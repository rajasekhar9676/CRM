import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { supabaseAdmin } from '@/lib/supabase-admin';
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
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', (session.user as any).id)
      .single();

    console.log('🔍 User query result:', { user, userError });

    if (userError || !user) {
      console.log('❌ User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', user.id)
      .single();

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

      // Store subscription details in database
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: plan as SubscriptionPlan,
          status: 'created',
          razorpay_subscription_id: subscription.id,
          razorpay_customer_id: subscription.customer_id,
          current_period_start: new Date(subscription.start_at * 1000).toISOString(),
          current_period_end: new Date(subscription.end_at * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (subscriptionError) {
        console.error('Error storing subscription:', subscriptionError);
        return NextResponse.json(
          { 
            error: 'Database error. Please run the SQL script to create the subscriptions table.',
            databaseError: true
          },
          { status: 500 }
        );
      }

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


