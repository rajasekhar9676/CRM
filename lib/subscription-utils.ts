import { supabase } from './supabase';
import { Subscription, SubscriptionPlan } from '@/types';

export async function createSubscription(
  userId: string,
  plan: SubscriptionPlan,
  stripeSubscriptionId?: string,
  stripeCustomerId?: string
): Promise<Subscription | null> {
  try {
    const subscription: Omit<Subscription, 'createdAt' | 'updatedAt'> = {
      plan,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      cancelAtPeriodEnd: false,
      stripeSubscriptionId,
      stripeCustomerId,
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        ...subscription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
    // Explicitly select all required fields
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        plan,
        status,
        current_period_start,
        current_period_end,
        next_due_date,
        razorpay_subscription_id,
        razorpay_customer_id,
        razorpay_order_id,
        razorpay_payment_id,
        stripe_subscription_id,
        stripe_customer_id,
        cashfree_subscription_id,
        cashfree_customer_id,
        cancel_at_period_end,
        amount_paid,
        billing_duration_months,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching subscription:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    if (!data) {
      console.log('⚠️ No subscription found in database, checking users table...');
      
      // Fallback: Check user's plan in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user plan:', userError);
      }

      const userPlan = userData?.plan || 'free';
      console.log('📋 User plan from users table:', userPlan);

      // If user has a paid plan but no subscription record, create one
      if (userPlan !== 'free') {
        console.log('⚠️ User has paid plan but no subscription record. Plan:', userPlan);
      }

      return {
        plan: userPlan as SubscriptionPlan,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Map database fields to Subscription interface
    const subscription: Subscription = {
      plan: data.plan || 'free',
      status: data.status || 'active',
      currentPeriodStart: data.current_period_start || new Date().toISOString(),
      currentPeriodEnd: data.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: data.cancel_at_period_end || false,
      nextDueDate: data.next_due_date || undefined,
      razorpaySubscriptionId: data.razorpay_subscription_id || undefined,
      razorpayCustomerId: data.razorpay_customer_id || undefined,
      razorpayOrderId: data.razorpay_order_id || undefined,
      razorpayPaymentId: data.razorpay_payment_id || undefined,
      stripeSubscriptionId: data.stripe_subscription_id || undefined,
      stripeCustomerId: data.stripe_customer_id || undefined,
      cashfreeSubscriptionId: data.cashfree_subscription_id || undefined,
      cashfreeCustomerId: data.cashfree_customer_id || undefined,
      amountPaid: typeof data.amount_paid === 'number' ? data.amount_paid : undefined,
      billingDurationMonths: typeof data.billing_duration_months === 'number' ? data.billing_duration_months : undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };

    console.log('📥 Fetched subscription from database:', {
      userId: userId,
      hasData: !!data,
      dbPlan: data?.plan,
      dbStatus: data?.status,
      dbRazorpaySubscriptionId: data?.razorpay_subscription_id,
      dbCurrentPeriodStart: data?.current_period_start,
      dbCurrentPeriodEnd: data?.current_period_end,
      dbNextDueDate: data?.next_due_date,
      mappedPlan: subscription.plan,
      mappedStatus: subscription.status,
      mappedRazorpaySubscriptionId: subscription.razorpaySubscriptionId,
      mappedCurrentPeriodStart: subscription.currentPeriodStart,
      mappedCurrentPeriodEnd: subscription.currentPeriodEnd,
      mappedNextDueDate: subscription.nextDueDate,
      amountPaid: subscription.amountPaid,
      billingDurationMonths: subscription.billingDurationMonths,
      razorpayOrderId: subscription.razorpayOrderId,
      razorpayPaymentId: subscription.razorpayPaymentId,
      rawData: {
        plan: data?.plan,
        status: data?.status,
        current_period_start: data?.current_period_start,
        current_period_end: data?.current_period_end,
        next_due_date: data?.next_due_date,
        razorpay_subscription_id: data?.razorpay_subscription_id,
        razorpay_customer_id: data?.razorpay_customer_id,
        razorpay_order_id: data?.razorpay_order_id,
        razorpay_payment_id: data?.razorpay_payment_id,
        amount_paid: data?.amount_paid,
        billing_duration_months: data?.billing_duration_months,
      },
    });

    // If plan is null or free in database, check users table as fallback
    if (!subscription.plan || subscription.plan === 'free') {
      console.log('⚠️ Plan is free/null in subscriptions table, checking users table...');
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();

      if (userData?.plan && userData.plan !== 'free') {
        console.log('✅ Found paid plan in users table:', userData.plan);
        subscription.plan = userData.plan as SubscriptionPlan;
      }
    }

    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function updateSubscription(
  userId: string,
  updates: Partial<Subscription>
): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating subscription:', error);
      return null;
    }

    return data as Subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return null;
  }
}

export async function cancelSubscription(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

export async function getCustomerCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching customer count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching customer count:', error);
    return 0;
  }
}

export async function getInvoiceCountThisMonth(userId: string): Promise<number> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error fetching invoice count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching invoice count:', error);
    return 0;
  }
}


