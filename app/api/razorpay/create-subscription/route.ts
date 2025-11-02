import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { SubscriptionPlan } from '@/types';
import { createRazorpaySubscription, RAZORPAY_PLANS } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting Razorpay subscription creation...');
    
    const session = await getServerSession(authOptions);
    console.log('🔍 Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    const { plan } = body;

    if (!plan || !['starter', 'pro', 'business'].includes(plan)) {
      console.log('❌ Invalid plan:', plan);
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Get user details from Supabase
    console.log('🔍 Fetching user from database...');
    const supabaseAdmin = getSupabaseAdmin();
    const userId = (session.user as any).id;

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      console.warn('⚠️ Error fetching user record:', userError);
    }

    const user = userRecord || {
      id: userId,
      name: session.user.name || 'User',
      email: session.user.email,
      phone_number: (session.user as any).phone_number || (session.user as any).phone || '9999999999',
    };

    console.log('🔍 Using user data:', user);

    // Check if Razorpay environment variables are configured
    console.log('🔍 Checking Razorpay environment variables...');
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('🔍 Razorpay Key ID:', razorpayKeyId ? 'Set' : 'Not set');
    console.log('🔍 Razorpay Key Secret:', razorpayKeySecret ? 'Set' : 'Not set');
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.log('❌ Razorpay credentials not configured');
      return NextResponse.json(
        { 
          error: 'Razorpay not configured. Please set up Razorpay environment variables.',
          setupRequired: true
        },
        { status: 400 }
      );
    }

    const planConfig = RAZORPAY_PLANS[plan as keyof typeof RAZORPAY_PLANS];
    console.log('🔍 Selected plan config:', planConfig);
    
    if (!planConfig) {
      console.log('❌ Plan config not found for:', plan);
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Check if user already has a Razorpay customer ID stored
    const { data: existingSubscription, error: existingSubscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSubscriptionError && existingSubscriptionError.code !== 'PGRST116') {
      console.warn('⚠️ Error fetching existing subscription:', existingSubscriptionError);
    }

    // Create Razorpay subscription
    try {
      const customerDetails = {
        customerId: existingSubscription?.razorpay_customer_id,
        customerName: user.name || 'User',
        customerEmail: user.email,
        customerPhone: user.phone_number || '9999999999',
      };

      console.log('🔍 Creating subscription with customer details:', customerDetails);

      const subscription = await createRazorpaySubscription(
        planConfig.planId,
        customerDetails,
        12 // 12 billing cycles
      );

      console.log('✅ Razorpay subscription created:', subscription);
      console.log('🔍 Subscription short_url:', subscription.short_url);
      console.log('🔍 Subscription short_url type:', typeof subscription.short_url);
      console.log('🔍 Full subscription response:', JSON.stringify(subscription, null, 2));
      console.log('🔍 All subscription fields:', Object.keys(subscription));
      
      // Fetch full subscription details to get charge_at and current_end
      // These fields might not be in initial creation response
      let fullSubscription = subscription;
      try {
        const { getRazorpaySubscription } = await import('@/lib/razorpay');
        fullSubscription = await getRazorpaySubscription(subscription.id);
        console.log('📥 Fetched full subscription details:', JSON.stringify(fullSubscription, null, 2));
        console.log('📥 Full subscription fields:', Object.keys(fullSubscription));
      } catch (fetchError) {
        console.warn('⚠️ Could not fetch full subscription details, using initial response:', fetchError);
      }

      // Check if short_url exists (use original subscription for short_url check)
      if (!subscription.short_url) {
        console.error('❌ Razorpay subscription created but short_url is missing!');
        console.error('❌ This usually means hosted checkout is not enabled in your Razorpay account.');
        console.error('❌ Full subscription response:', JSON.stringify(subscription, null, 2));
        
        return NextResponse.json(
          { 
            error: 'Razorpay hosted checkout is not enabled',
            details: 'The subscription was created but Razorpay did not return a checkout URL. This usually means hosted checkout is disabled in your Razorpay account settings. Please enable Subscriptions > Hosted Checkout in your Razorpay dashboard, or contact Razorpay support to activate it.',
            razorpayError: true,
            subscriptionId: subscription.id,
            status: subscription.status,
            missingShortUrl: true
          },
          { status: 400 }
        );
      }

      // Normalize status & period timestamps for storage
      const normalizedStatus = fullSubscription.status === 'created' ? 'pending' : fullSubscription.status;
      const periodStart = fullSubscription.start_at
        ? new Date(fullSubscription.start_at * 1000).toISOString()
        : new Date().toISOString();
      const periodEnd = fullSubscription.end_at
        ? new Date(fullSubscription.end_at * 1000).toISOString()
        : new Date().toISOString();
      
      // Capture next due date from Razorpay (charge_at or current_end)
      // charge_at is the timestamp for the next charge
      // current_end is the end of current billing cycle (next billing date)
      // If neither available, calculate from start_at + 1 billing period
      let nextDueDate: string | null = null;
      
      if (fullSubscription.charge_at) {
        nextDueDate = new Date(fullSubscription.charge_at * 1000).toISOString();
      } else if (fullSubscription.current_end) {
        nextDueDate = new Date(fullSubscription.current_end * 1000).toISOString();
      } else if (fullSubscription.start_at) {
        // Calculate next due date: start_at + 1 billing cycle
        // Most plans are monthly (30 days)
        const startDate = new Date(fullSubscription.start_at * 1000);
        const nextDue = new Date(startDate);
        nextDue.setMonth(nextDue.getMonth() + 1); // Add 1 month
        nextDueDate = nextDue.toISOString();
      } else {
        // Last fallback: use periodEnd
        nextDueDate = periodEnd;
      }

      console.log('📅 Next Due Date calculation:', {
        charge_at: fullSubscription.charge_at,
        current_end: fullSubscription.current_end,
        start_at: fullSubscription.start_at,
        calculated_next_due_date: nextDueDate,
        periodEnd: periodEnd,
      });

      // Store subscription details in database
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            plan: plan as SubscriptionPlan,
            status: normalizedStatus,
            razorpay_subscription_id: fullSubscription.id,
            razorpay_customer_id: fullSubscription.customer_id,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            next_due_date: nextDueDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (subscriptionError) {
        console.error('Error storing subscription:', subscriptionError);
        return NextResponse.json(
          { 
            error: 'Database error while saving subscription',
            details: subscriptionError.message,
            code: subscriptionError.code,
            databaseError: true
          },
          { status: 500 }
        );
      }

      // Validate short_url format before returning
      if (!subscription.short_url || !subscription.short_url.startsWith('https://rzp.io/')) {
        console.error('❌ Invalid short_url format:', subscription.short_url);
        return NextResponse.json(
          { 
            error: 'Invalid checkout URL format from Razorpay',
            details: `Expected URL starting with 'https://rzp.io/' but got: ${subscription.short_url || 'undefined'}`,
            razorpayError: true,
            subscriptionId: subscription.id
          },
          { status: 500 }
        );
      }

      // Log exactly what we're returning
      console.log('🚀 Returning shortUrl to frontend:', subscription.short_url);
      console.log('🚀 Full response payload:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer_id,
        status: subscription.status,
        shortUrl: subscription.short_url,
      });

      // Return success response with Razorpay data
      return NextResponse.json({
        subscriptionId: subscription.id,
        customerId: subscription.customer_id,
        status: subscription.status,
        shortUrl: subscription.short_url,
        message: 'Subscription created successfully',
        planDetails: {
          name: planConfig.name,
          amount: planConfig.amount,
          currency: planConfig.currency,
          period: planConfig.period,
        },
        razorpayResponse: subscription,
      });

    } catch (apiError: any) {
      console.error('Razorpay API Error:', apiError);
      return NextResponse.json(
        { 
          error: 'Failed to create subscription with Razorpay',
          details: apiError.error?.description || apiError.message || 'Unknown error',
          razorpayError: true
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


