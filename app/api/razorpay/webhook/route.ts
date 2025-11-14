import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
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
    const { id, charge_at, current_end, plan_id } = data;
    
    // Calculate next due date from subscription data
    const nextDueDate = charge_at
      ? new Date(charge_at * 1000).toISOString()
      : current_end
      ? new Date(current_end * 1000).toISOString()
      : null;
    
    // Determine plan from Razorpay plan_id
    let plan: string = 'free';
    if (plan_id === process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID) {
      plan = 'starter';
    } else if (plan_id === process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID) {
      plan = 'pro';
    } else if (plan_id === process.env.NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID) {
      plan = 'business';
    }
    
    // Get subscription to find user_id
    const supabaseAdmin = getSupabaseAdmin();
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('razorpay_subscription_id', id)
      .single();

    if (fetchError || !subscription) {
      console.error('Error fetching subscription for user update:', fetchError);
    }
    
    // Only update/create subscription when activated (payment succeeded)
    // Delete any pending subscriptions first
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('razorpay_subscription_id', id)
      .in('status', ['created', 'pending']);

    // Get existing subscription or prepare new one
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('razorpay_subscription_id', id)
      .maybeSingle();

    const updateData: any = {
      status: 'active',
      plan: plan, // Update plan
      updated_at: new Date().toISOString(),
      billing_duration_months: 1,
      amount_paid: null,
      razorpay_payment_id: null,
      razorpay_order_id: null,
    };
    
    if (nextDueDate) {
      updateData.next_due_date = nextDueDate;
    }

    // Update existing or insert new
    if (existingSub) {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('razorpay_subscription_id', id);
      
      if (error) {
        console.error('Error updating subscription:', error);
      }
    } else if (subscription?.user_id) {
      // Insert new subscription only if user_id exists
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: subscription.user_id,
          plan: plan,
          status: 'active',
          razorpay_subscription_id: id,
          current_period_start: new Date().toISOString(),
          current_period_end: nextDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          next_due_date: nextDueDate,
          updated_at: new Date().toISOString(),
          billing_duration_months: 1,
          amount_paid: null,
          razorpay_payment_id: null,
          razorpay_order_id: null,
        });
      
      if (error) {
        console.error('Error inserting subscription:', error);
      }
    }

    // Also update user's plan in users table
    if (subscription?.user_id) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({
          plan: plan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.user_id);

      if (userError) {
        console.warn('Warning: Could not update user plan:', userError);
      } else {
        console.log(`✅ Updated user plan to ${plan} for user ${subscription.user_id}`);
      }
    }

    console.log('Subscription activated:', id);
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
}

async function handleSubscriptionCharged(subscriptionData: any, paymentData: any) {
  try {
    const { id, charge_at, current_end } = subscriptionData;
    
    console.log('Subscription charged:', {
      subscriptionId: id,
      paymentId: paymentData.id,
      amount: paymentData.amount,
      status: paymentData.status,
    });

    // Calculate next due date from subscription data
    const nextDueDate = charge_at
      ? new Date(charge_at * 1000).toISOString()
      : current_end
      ? new Date(current_end * 1000).toISOString()
      : null;

    // Update subscription status to active if payment is successful
    if (paymentData.status === 'captured') {
    const amountPaid =
      typeof paymentData.amount === 'number' ? paymentData.amount / 100 : null;
      const updateData: any = {
        status: 'active',
        updated_at: new Date().toISOString(),
      billing_duration_months: 1,
      amount_paid: amountPaid,
      razorpay_payment_id: paymentData.id || null,
      razorpay_order_id: paymentData.order_id || null,
      };
      
      if (nextDueDate) {
        updateData.next_due_date = nextDueDate;
      }
      
      const { error } = await getSupabaseAdmin()
        .from('subscriptions')
        .update(updateData)
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
    const { error } = await getSupabaseAdmin()
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
    const { error } = await getSupabaseAdmin()
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
    const { error } = await getSupabaseAdmin()
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
    const { error } = await getSupabaseAdmin()
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
    const { error } = await getSupabaseAdmin()
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
    const { error } = await getSupabaseAdmin()
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


