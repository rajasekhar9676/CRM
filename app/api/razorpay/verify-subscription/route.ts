import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getRazorpaySubscription } from '@/lib/razorpay';
import { SubscriptionPlan } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch latest subscription details from Razorpay
    const razorpaySubscription = await getRazorpaySubscription(subscriptionId);
    
    console.log('📥 Fetched subscription from Razorpay:', {
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
      : new Date().toISOString();
    
    const periodEnd = razorpaySubscription.end_at
      ? new Date(razorpaySubscription.end_at * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days default

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
    }

    // Only save subscription if status is active (payment succeeded)
    // Delete any pending/created subscriptions for this user first
    if (normalizedStatus === 'active') {
      // Delete any pending/created subscriptions with same Razorpay subscription ID
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('razorpay_subscription_id', razorpaySubscription.id)
        .in('status', ['created', 'pending']);

      // Delete any other active subscriptions for this user (only one active subscription per user)
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'active')
        .neq('razorpay_subscription_id', razorpaySubscription.id);

      // Insert/Update subscription with active status
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            plan: plan,
            status: normalizedStatus,
            razorpay_subscription_id: razorpaySubscription.id,
            razorpay_customer_id: razorpaySubscription.customer_id,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            next_due_date: nextDueDate,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'razorpay_subscription_id',
          }
        );

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

      console.log('✅ Subscription saved successfully after payment:', {
        subscriptionId: razorpaySubscription.id,
        plan,
        status: normalizedStatus,
      });
    } else {
      // If status is not active, don't save subscription
      console.log('⚠️ Subscription not active yet. Status:', normalizedStatus);
      return NextResponse.json({
        success: false,
        message: 'Subscription is not active yet. Please complete the payment first.',
        status: normalizedStatus,
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: razorpaySubscription.id,
        plan,
        status: normalizedStatus,
        planId: razorpaySubscription.plan_id,
      },
    });

  } catch (error: any) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json(
      { error: 'Failed to verify subscription', details: error.message },
      { status: 500 }
    );
  }
}


