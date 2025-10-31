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
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    if (!data) {
      return {
        plan: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return data as Subscription;
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


