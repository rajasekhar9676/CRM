import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature
    if (!signature) {
      console.error('No signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const isValid = verifyRazorpayWebhookSignature(body, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const webhookData = JSON.parse(body);
    console.log('Razorpay webhook received:', webhookData);

    const { event, payload } = webhookData;

    switch (event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(payload.subscription.entity);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(payload.subscription.entity, payload.payment.entity);
        break;
      case 'subscription.completed':
        await handleSubscriptionCompleted(payload.subscription.entity);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.subscription.entity);
        break;
      case 'subscription.paused':
        await handleSubscriptionPaused(payload.subscription.entity);
        break;
      case 'subscription.resumed':
        await handleSubscriptionResumed(payload.subscription.entity);
        break;
      case 'subscription.pending':
        await handleSubscriptionPending(payload.subscription.entity);
        break;
      case 'subscription.halted':
        await handleSubscriptionHalted(payload.subscription.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event);
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
    const { id } = data;
    
    // Update subscription in database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', id);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription activated:', id);
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
}

async function handleSubscriptionCharged(subscriptionData: any, paymentData: any) {
  try {
    const { id } = subscriptionData;
    
    console.log('Subscription charged:', {
      subscriptionId: id,
      paymentId: paymentData.id,
      amount: paymentData.amount,
      status: paymentData.status,
    });

    // Update subscription status to active if payment is successful
    if (paymentData.status === 'captured') {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', id);

      if (error) {
        console.error('Error updating subscription:', error);
      }
    }
  } catch (error) {
    console.error('Error handling subscription charge:', error);
  }
}

async function handleSubscriptionCompleted(data: any) {
  try {
    const { id } = data;
    
    // Update subscription in database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', id);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription completed:', id);
  } catch (error) {
    console.error('Error handling subscription completion:', error);
  }
}

async function handleSubscriptionCancelled(data: any) {
  try {
    const { id } = data;
    
    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', id);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription cancelled:', id);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleSubscriptionPaused(data: any) {
  try {
    const { id } = data;
    
    // Update subscription in database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', id);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription paused:', id);
  } catch (error) {
    console.error('Error handling subscription pause:', error);
  }
}

async function handleSubscriptionResumed(data: any) {
  try {
    const { id } = data;
    
    // Update subscription in database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', id);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription resumed:', id);
  } catch (error) {
    console.error('Error handling subscription resume:', error);
  }
}

async function handleSubscriptionPending(data: any) {
  try {
    const { id } = data;
    
    // Update subscription in database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', id);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription pending:', id);
  } catch (error) {
    console.error('Error handling subscription pending:', error);
  }
}

async function handleSubscriptionHalted(data: any) {
  try {
    const { id } = data;
    
    // Update subscription in database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', id);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    console.log('Subscription halted:', id);
  } catch (error) {
    console.error('Error handling subscription halt:', error);
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const { subscription_id, id, error_description } = data;
    
    console.log('Payment failed:', {
      subscriptionId: subscription_id,
      paymentId: id,
      reason: error_description,
    });

    // You can add additional logic here like sending failure notifications
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}


