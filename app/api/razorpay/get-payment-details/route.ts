import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { razorpay } from '@/lib/razorpay';

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
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const supabaseAdmin = getSupabaseAdmin();

    // Verify user owns this subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('razorpay_subscription_id, user_id')
      .eq('razorpay_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Razorpay not configured' },
        { status: 500 }
      );
    }

    // Fetch subscription details from Razorpay
    const razorpaySubscription = await razorpay.subscriptions.fetch(subscriptionId);
    
    let paymentDetails = null;

    // Get payment details from subscription's invoices
    // Razorpay subscriptions store payment info in invoices
    try {
      // Get subscription's invoices to find the latest payment
      const invoices = await razorpay.invoices.all({
        subscription_id: subscriptionId,
        count: 1,
      });

      if (invoices && invoices.items && invoices.items.length > 0) {
        const latestInvoice = invoices.items[0];
        if (latestInvoice.payment_id) {
          try {
            const payment = await razorpay.payments.fetch(latestInvoice.payment_id);
            
            if (payment) {
              paymentDetails = {
                method: payment.method || 'N/A',
                card: payment.method === 'card' ? {
                  last4: payment.card?.last4 || 'N/A',
                  network: payment.card?.network || 'N/A',
                  type: payment.card?.type || 'N/A',
                  issuer: payment.card?.issuer || 'N/A',
                  name: payment.card?.name || 'N/A',
                } : null,
                upi: payment.method === 'upi' ? {
                  vpa: payment.vpa || 'N/A',
                } : null,
                wallet: payment.method === 'wallet' ? {
                  wallet: payment.wallet || 'N/A',
                } : null,
                netbanking: payment.method === 'netbanking' ? {
                  bank: payment.bank || 'N/A',
                } : null,
                email: payment.email || null,
                contact: payment.contact || null,
                amount: payment.amount || null,
                currency: payment.currency || 'INR',
                status: payment.status || 'N/A',
                created_at: payment.created_at || null,
              };
            }
          } catch (error) {
            console.error('Error fetching payment from invoice:', error);
          }
        }
      }
    } catch (invoiceError) {
      console.error('Error fetching invoices:', invoiceError);
    }

    return NextResponse.json({
      success: true,
      paymentDetails,
      subscription: {
        id: razorpaySubscription.id,
        status: razorpaySubscription.status,
        current_end: razorpaySubscription.current_end,
        charge_at: razorpaySubscription.charge_at,
        start_at: razorpaySubscription.start_at,
        end_at: razorpaySubscription.end_at,
      },
    });

  } catch (error: any) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details', details: error.message },
      { status: 500 }
    );
  }
}

