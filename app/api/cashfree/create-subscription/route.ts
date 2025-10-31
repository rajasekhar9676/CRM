import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { SubscriptionPlan } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting subscription creation...');
    
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

    // Check if Cashfree environment variables are configured
    console.log('🔍 Checking Cashfree environment variables...');
    const cashfreeAppId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
    
    console.log('🔍 Cashfree App ID:', cashfreeAppId ? 'Set' : 'Not set');
    console.log('🔍 Cashfree Secret Key:', cashfreeSecretKey ? 'Set' : 'Not set');
    
    if (!cashfreeAppId || !cashfreeSecretKey) {
      console.log('❌ Cashfree credentials not configured');
      return NextResponse.json(
        { 
          error: 'Cashfree not configured. Please set up Cashfree environment variables.',
          setupRequired: true
        },
        { status: 400 }
      );
    }

    // Plan configurations with maximum and recurring amounts
    const planConfigs = {
      starter: {
        name: 'Starter Plan',
        planId: process.env.NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID || 'minicrm_starter_monthly',
        recurringAmount: 25000, // ₹250 in paise
        maxAmount: 25000, // Maximum ₹250 per cycle
        billingPeriod: 'monthly',
        billingInterval: 1, // Every 1 month
      },
      pro: {
        name: 'Pro Plan',
        planId: process.env.NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID || 'minicrm_pro_monthly',
        recurringAmount: 49900, // ₹499 in paise
        maxAmount: 49900, // Maximum ₹499 per cycle
        billingPeriod: 'monthly',
        billingInterval: 1, // Every 1 month
      },
      business: {
        name: 'Business Plan',
        planId: process.env.NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID || 'minicrm_business_monthly',
        recurringAmount: 99900, // ₹999 in paise
        maxAmount: 99900, // Maximum ₹999 per cycle
        billingPeriod: 'monthly',
        billingInterval: 1, // Every 1 month
      },
    };

    const planConfig = planConfigs[plan as keyof typeof planConfigs];
    console.log('🔍 Selected plan config:', planConfig);
    
    if (!planConfig) {
      console.log('❌ Plan config not found for:', plan);
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Create Cashfree subscription using real API
    try {
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare subscription request for Cashfree - Updated format
      const subscriptionRequest = {
        subscription_id: subscriptionId,
        plan_id: planConfig.planId,
        customer_details: {
          customer_id: user.id,
          customer_name: user.name || 'User',
          customer_email: user.email,
          customer_phone: user.phone_number || '9999999999',
        },
        subscription_amount: planConfig.recurringAmount / 100, // Convert from paise to rupees
        subscription_currency: 'INR',
        subscription_frequency: planConfig.billingPeriod,
        subscription_start_date: new Date().toISOString().split('T')[0],
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cashfree/webhook`,
      };

      console.log('🔍 Subscription request:', subscriptionRequest);

      // Call Cashfree API - Updated endpoint
      const cashfreeResponse = await fetch('https://sandbox.cashfree.com/pg/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2023-08-01',
          'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        },
        body: JSON.stringify(subscriptionRequest),
      });

      const cashfreeData = await cashfreeResponse.json();

      if (!cashfreeResponse.ok) {
        console.error('Cashfree API Error:', cashfreeData);
        return NextResponse.json(
          { 
            error: 'Failed to create subscription with Cashfree',
            details: cashfreeData.message || 'Unknown error',
            cashfreeError: true
          },
          { status: 400 }
        );
      }

      // Store subscription details in database
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            plan: plan as SubscriptionPlan,
            status: 'pending',
            cashfree_subscription_id: subscriptionId,
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

      // Return success response with Cashfree data
      return NextResponse.json({
        subscriptionId: subscriptionId,
        authLink: cashfreeData.authLink || `https://sandbox.cashfree.com/pg/subscription/${subscriptionId}`,
        message: 'Subscription created successfully',
        planDetails: {
          name: planConfig.name,
          recurringAmount: planConfig.recurringAmount,
          maxAmount: planConfig.maxAmount,
          billingPeriod: planConfig.billingPeriod,
          billingInterval: planConfig.billingInterval,
        },
        cashfreeResponse: cashfreeData,
      });

    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to Cashfree API',
          details: 'Please check your Cashfree credentials and network connection',
          apiError: true
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
