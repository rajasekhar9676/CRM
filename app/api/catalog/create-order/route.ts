import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createRazorpayOrder, razorpay } from '@/lib/razorpay';

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
    const {
      slug,
      productId,
      quantity = 1,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      note,
    } = body;

    if (!slug || !productId) {
      return NextResponse.json(
        { error: 'Catalog slug and product ID are required' },
        { status: 400 }
      );
    }

    const qty = Number(quantity) || 1;
    if (qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('product_catalog_settings')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .maybeSingle();

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', settings.user_id)
      .eq('show_in_catalog', true)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product unavailable' }, { status: 404 });
    }

    const unitPrice =
      product.catalog_price !== null && product.catalog_price !== undefined
        ? Number(product.catalog_price)
        : Number(product.price);
    const amount = unitPrice * qty;
    const amountPaise = Math.round(amount * 100);

    const { data: orderRecord, error: insertError } = await supabaseAdmin
      .from('catalog_orders')
      .insert({
        user_id: settings.user_id,
        catalog_slug: slug,
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: qty,
        amount,
        currency: 'INR',
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        shipping_address: shippingAddress || null,
        note: note || null,
        payment_status: 'pending',
      })
      .select('*')
      .maybeSingle();

    if (insertError || !orderRecord) {
      console.error('Catalog order insert error:', insertError);
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
    }

    const sanitizedSlug = slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'catalog';
    const shortOrderId = orderRecord.id.replace(/-/g, '').slice(0, 16);
    const receipt = `cat_${sanitizedSlug}_${shortOrderId}`.slice(0, 40);
    const razorpayOrder = await createRazorpayOrder(amountPaise, 'INR', receipt, {
      catalog_slug: slug,
      product_id: product.id,
    });

    const { error: updateError } = await supabaseAdmin
      .from('catalog_orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', orderRecord.id);

    if (updateError) {
      console.error('Failed to attach Razorpay order ID:', updateError);
    }

    return NextResponse.json({
      razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      catalogOrderId: orderRecord.id,
      businessName: settings.business_name,
      productName: product.name,
      notes: razorpayOrder.notes,
    });
  } catch (error) {
    console.error('Catalog create-order error:', error);
    return NextResponse.json({ error: 'Failed to create checkout order' }, { status: 500 });
  }
}


