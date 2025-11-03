import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getRazorpaySubscription } from '@/lib/razorpay';
import { SubscriptionPlan } from '@/types';

// This endpoint allows users to sync their own subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch user's subscription from database
    const { data: existingSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription', details: fetchError.message },
        { status: 500 }
      );
    }

    // If no subscription found, check if user has any in Razorpay
    if (!existingSubscription || !existingSubscription.razorpay_subscription_id) {
      return NextResponse.json(
        { 
          error: 'No subscription found',
          message: 'You do not have an active subscription. Please subscribe to a plan.',
          hasSubscription: false
        },
        { status: 404 }
      );
    }

    const razorpaySubscriptionId = existingSubscription.razorpay_subscription_id;
    console.log('🔄 Syncing subscription:', razorpaySubscriptionId);

    // Fetch latest subscription details from Razorpay
    const razorpaySubscription = await getRazorpaySubscription(razorpaySubscriptionId);
    
    console.log('📥 Fetched from Razorpay:', {
      id: razorpaySubscription.id,
      status: razorpaySubscription.status,
      plan_id: razorpaySubscription.plan_id,
    });

    // Determine plan from Razorpay plan_id
    const planId = razorpaySubscription.plan_id;
    let plan: SubscriptionPlan = 'free';
    
    if (planId === process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID) {
      plan = 'starter';
    } else if (planId === process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID) {
      plan = 'pro';
    } else if (planId === process.env.NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID) {
      plan = 'business';
    }

    // Map Razorpay status to our status
    const normalizedStatus = razorpaySubscription.status === 'created' 
      ? 'pending' 
      : razorpaySubscription.status === 'authenticated' || razorpaySubscription.status === 'active'
      ? 'active'
      : razorpaySubscription.status;

    // Calculate dates
    const periodStart = razorpaySubscription.start_at
      ? new Date(razorpaySubscription.start_at * 1000).toISOString()
      : existingSubscription.current_period_start || new Date().toISOString();
    
    const periodEnd = razorpaySubscription.end_at
      ? new Date(razorpaySubscription.end_at * 1000).toISOString()
      : existingSubscription.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Calculate next due date
    let nextDueDate: string | null = null;
    if (razorpaySubscription.charge_at) {
      nextDueDate = new Date(razorpaySubscription.charge_at * 1000).toISOString();
    } else if (razorpaySubscription.current_end) {
      nextDueDate = new Date(razorpaySubscription.current_end * 1000).toISOString();
    } else if (razorpaySubscription.start_at) {
      const startDate = new Date(razorpaySubscription.start_at * 1000);
      const nextDue = new Date(startDate);
      nextDue.setMonth(nextDue.getMonth() + 1);
      nextDueDate = nextDue.toISOString();
    } else if (existingSubscription.next_due_date) {
      nextDueDate = existingSubscription.next_due_date;
    }

    // Update subscription in database
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: plan,
        status: normalizedStatus,
        razorpay_subscription_id: razorpaySubscription.id,
        razorpay_customer_id: razorpaySubscription.customer_id || existingSubscription.razorpay_customer_id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        next_due_date: nextDueDate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to update subscription', details: subscriptionError.message },
        { status: 500 }
      );
    }

    // Update user's plan in users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        plan: plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.warn('Warning: Could not update user plan:', userError);
    }

    console.log('✅ Subscription synced successfully:', {
      subscriptionId: razorpaySubscription.id,
      plan,
      status: normalizedStatus,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: razorpaySubscription.id,
        plan,
        status: normalizedStatus,
        planId: razorpaySubscription.plan_id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        nextDueDate: nextDueDate,
      },
      message: `Subscription synced successfully. Your plan is now: ${plan.toUpperCase()} (${normalizedStatus})`,
    });

  } catch (error: any) {
    console.error('Error syncing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription', details: error.message },
      { status: 500 }
    );
  }
}


