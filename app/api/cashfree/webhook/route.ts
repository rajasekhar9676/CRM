import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');

    // Verify webhook signature
    if (!signature) {
      console.error('No signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const webhookData = JSON.parse(body);
    console.log('Cashfree webhook received:', webhookData);

    const { type, data } = webhookData;

    switch (type) {
      case 'SUBSCRIPTION_ACTIVATED':
        await handleSubscriptionActivated(data);
        break;
      case 'SUBSCRIPTION_CANCELLED':
        await handleSubscriptionCancelled(data);
        break;
      case 'SUBSCRIPTION_PAUSED':
        await handleSubscriptionPaused(data);
        break;
      case 'SUBSCRIPTION_RESUMED':
        await handleSubscriptionResumed(data);
        break;
      case 'PAYMENT_SUCCESS':
        await handlePaymentSuccess(data);
        break;
      case 'PAYMENT_FAILED':
        await handlePaymentFailed(data);
        break;
      default:
        console.log('Unhandled webhook type:', type);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(data: any) {
  try {
    const { subscriptionId } = data;
    
    // Update subscription in database
    const { error } = await getSupabaseAdmin()
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('cashfree_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription activated:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
}

async function handleSubscriptionCancelled(data: any) {
  try {
    const { subscriptionId } = data;
    
    // Update subscription in database
    const { error } = await getSupabaseAdmin()
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('cashfree_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription cancelled:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleSubscriptionPaused(data: any) {
  try {
    const { subscriptionId } = data;
    
    // Update subscription in database
    const { error } = await getSupabaseAdmin()
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('cashfree_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription paused:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription pause:', error);
  }
}

async function handleSubscriptionResumed(data: any) {
  try {
    const { subscriptionId } = data;
    
    // Update subscription in database
    const { error } = await getSupabaseAdmin()
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('cashfree_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription resumed:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription resume:', error);
  }
}

async function handlePaymentSuccess(data: any) {
  try {
    const { subscriptionId, paymentId, amount } = data;
    
    console.log('Payment successful:', {
      subscriptionId,
      paymentId,
      amount,
    });

    // You can add additional logic here like sending confirmation emails
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const { subscriptionId, paymentId, reason } = data;
    
    console.log('Payment failed:', {
      subscriptionId,
      paymentId,
      reason,
    });

    // You can add additional logic here like sending failure notifications
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
