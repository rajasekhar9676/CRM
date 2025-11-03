import { supabase } from './supabase';
import { SubscriptionPlan } from '@/types';
import { getPlanFeatures } from './subscription';

/**
 * Check if user can create a customer based on their subscription plan
 */
export async function canCreateCustomer(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Get user's plan
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user plan:', userError);
      return { allowed: false, reason: 'Unable to verify subscription status' };
    }

    const userPlan = (userData?.plan || 'free') as SubscriptionPlan;
    const planFeatures = getPlanFeatures(userPlan);

    // Check if unlimited (value of -1 means unlimited)
    if (planFeatures.limits.maxCustomers === -1) {
      return { allowed: true };
    }

    // Count existing customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId);

    if (customersError) {
      console.error('Error counting customers:', customersError);
      return { allowed: false, reason: 'Unable to verify customer count' };
    }

    const customerCount = customers?.length || 0;
    const maxCustomers = planFeatures.limits.maxCustomers;

    if (customerCount >= maxCustomers) {
      return {
        allowed: false,
        reason: `You've reached your limit of ${maxCustomers} customers. Please upgrade your plan to add more customers.`
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking customer limit:', error);
    return { allowed: false, reason: 'An error occurred while checking limits' };
  }
}

/**
 * Check if user can create an invoice based on their subscription plan
 */
export async function canCreateInvoice(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Get user's plan
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user plan:', userError);
      return { allowed: false, reason: 'Unable to verify subscription status' };
    }

    const userPlan = (userData?.plan || 'free') as SubscriptionPlan;
    const planFeatures = getPlanFeatures(userPlan);

    // Check if unlimited (value of -1 means unlimited)
    if (planFeatures.limits.maxInvoicesPerMonth === -1) {
      return { allowed: true };
    }

    // Count invoices created this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    if (invoicesError) {
      console.error('Error counting invoices:', invoicesError);
      return { allowed: false, reason: 'Unable to verify invoice count' };
    }

    const invoiceCount = invoices?.length || 0;
    const maxInvoices = planFeatures.limits.maxInvoicesPerMonth;

    if (invoiceCount >= maxInvoices) {
      return {
        allowed: false,
        reason: `You've reached your monthly limit of ${maxInvoices} invoices. Please upgrade your plan for unlimited invoices.`
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking invoice limit:', error);
    return { allowed: false, reason: 'An error occurred while checking limits' };
  }
}

/**
 * Check if user can use a specific feature
 */
export async function canUseFeature(userId: string, feature: 'productManagement' | 'whatsAppCRM' | 'prioritySupport'): Promise<boolean> {
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .maybeSingle();

    const userPlan = (userData?.plan || 'free') as SubscriptionPlan;
    const planFeatures = getPlanFeatures(userPlan);

    switch (feature) {
      case 'productManagement':
        return planFeatures.limits.hasProductManagement;
      case 'whatsAppCRM':
        return planFeatures.limits.hasWhatsAppCRM;
      case 'prioritySupport':
        return planFeatures.limits.hasPrioritySupport;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

