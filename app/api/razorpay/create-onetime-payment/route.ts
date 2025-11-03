import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createRazorpayOrder } from '@/lib/razorpay';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/subscription';

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
    const { plan, durationMonths = 1 } = body; // durationMonths defaults to 1

    if (!plan || plan === 'free') {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const planConfig = SUBSCRIPTION_PLANS[plan as SubscriptionPlan];
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const amount = planConfig.price * durationMonths; // Total amount for selected duration
    const amountInPaise = Math.round(amount * 100); // Convert to paise

    // Create one-time payment order (NOT subscription)
    const order = await createRazorpayOrder(
      amountInPaise,
      'INR',
      `order_${plan}_${Date.now()}`,
      {
        plan: plan,
        user_id: userId,
        duration_months: durationMonths.toString(),
        payment_type: 'onetime',
      }
    );

    console.log('📝 Created one-time payment order:', {
      orderId: order.id,
      amount: amount,
      plan: plan,
      durationMonths: durationMonths,
      userId: userId,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: amount,
      amountInPaise: amountInPaise,
      plan: plan,
      planName: planConfig.name,
      durationMonths: durationMonths,
      currency: 'INR',
      message: `One-time payment for ${durationMonths} month(s) - ${planConfig.name} plan`,
    });

  } catch (error: any) {
    console.error('Error creating one-time payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    );
  }
}

