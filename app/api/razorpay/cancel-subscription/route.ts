import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { supabase } from '@/lib/supabase';
import { cancelRazorpaySubscription } from '@/lib/razorpay';

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
    const { subscriptionId, cancelAtCycleEnd } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', (session.user as any).id)
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Cancel the subscription in Razorpay
    try {
      const cancelledSubscription = await cancelRazorpaySubscription(
        subscriptionId,
        cancelAtCycleEnd || false
      );

      // Update subscription in database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: cancelAtCycleEnd ? 'active' : 'canceled',
          cancel_at_period_end: cancelAtCycleEnd || false,
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', subscriptionId);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
      }

      return NextResponse.json({
        message: 'Subscription cancelled successfully',
        subscription: cancelledSubscription,
      });

    } catch (razorpayError: any) {
      console.error('Razorpay API Error:', razorpayError);
      return NextResponse.json(
        { 
          error: 'Failed to cancel subscription with Razorpay',
          details: razorpayError.error?.description || razorpayError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


