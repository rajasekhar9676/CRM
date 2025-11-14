import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { razorpay, verifyRazorpayPaymentSignature } from '@/lib/razorpay';

const supabaseAdmin = getSupabaseAdmin();

export async function POST(request: NextRequest) {
  if (!razorpay) {
    return NextResponse.json(
      { error: 'Razorpay is not configured. Please set the API keys.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { catalogOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!catalogOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing payment verification fields' },
        { status: 400 }
      );
    }

    const { data: orderRecord, error: orderError } = await supabaseAdmin
      .from('catalog_orders')
      .select('*')
      .eq('id', catalogOrderId)
      .maybeSingle();

    if (orderError || !orderRecord) {
      return NextResponse.json({ error: 'Catalog order not found' }, { status: 404 });
    }

    if (orderRecord.payment_status === 'paid') {
      return NextResponse.json({ success: true, message: 'Order already verified.' });
    }

    if (orderRecord.razorpay_order_id !== razorpayOrderId) {
      return NextResponse.json({ error: 'Order mismatch' }, { status: 400 });
    }

    const isValidSignature = verifyRazorpayPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid Razorpay signature' }, { status: 400 });
    }

    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json(
        { error: `Payment not captured yet. Status: ${payment.status}` },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('catalog_orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      })
      .eq('id', catalogOrderId);

    if (updateError) {
      console.error('Catalog order update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Catalog verify-order error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}


