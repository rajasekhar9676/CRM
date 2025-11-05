import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyRazorpayPaymentSignature, razorpay } from '@/lib/razorpay';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';
import { SubscriptionPlan } from '@/types';

export const dynamic = 'force-dynamic';

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
    const { orderId, paymentId, signature, plan, durationMonths = 1 } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyRazorpayPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Razorpay not configured' },
        { status: 500 }
      );
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json(
        { error: 'Payment not successful', status: payment.status },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const supabaseAdmin = getSupabaseAdmin();
    const planConfig = SUBSCRIPTION_PLANS[plan as SubscriptionPlan];

    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Calculate subscription expiry (current time + duration months)
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    // Delete any existing active subscriptions for this user (one active at a time)
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'active');

    // Create subscription record for one-time payment
    // This is NOT a recurring subscription, just a record of paid access
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: plan as SubscriptionPlan,
        status: 'active',
        // Store order and payment IDs instead of subscription IDs (one-time payment)
        razorpay_subscription_id: `onetime_${paymentId}`, // Mark as one-time
        razorpay_customer_id: payment.customer_id || null,
        current_period_start: now.toISOString(),
        current_period_end: expiryDate.toISOString(),
        next_due_date: expiryDate.toISOString(), // Expiry date (not renewal date)
        cancel_at_period_end: true, // Auto-expire after period ends
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (subscriptionError) {
      console.error('Error saving subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to save subscription', details: subscriptionError.message },
        { status: 500 }
      );
    }

    // Update user's plan
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        plan: plan as SubscriptionPlan,
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.warn('Warning: Could not update user plan:', userError);
    }

    console.log('✅ One-time payment verified and subscription activated:', {
      userId: userId,
      plan: plan,
      expiryDate: expiryDate.toISOString(),
      durationMonths: durationMonths,
    });

    return NextResponse.json({
      success: true,
      message: `Payment successful! Your ${planConfig.name} plan is active until ${expiryDate.toLocaleDateString()}`,
      subscription: {
        plan: plan,
        expiryDate: expiryDate.toISOString(),
        durationMonths: durationMonths,
      },
    });

  } catch (error: any) {
    console.error('Error verifying one-time payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    );
  }
}

