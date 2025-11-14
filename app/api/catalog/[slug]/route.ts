import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(
  _request: Request,
  context: { params: { slug: string } }
) {
  const { slug } = context.params;

  if (!slug) {
    return NextResponse.json({ error: 'Catalog slug is required' }, { status: 400 });
  }

  try {
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('product_catalog_settings')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .maybeSingle();

    if (settingsError) {
      console.error('Catalog settings fetch error:', settingsError);
      return NextResponse.json({ error: 'Failed to load catalog' }, { status: 500 });
    }

    if (!settings) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
    }

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('user_id', settings.user_id)
      .eq('show_in_catalog', true)
      .eq('status', 'active')
      .order('catalog_sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Catalog products fetch error:', productsError);
      return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
    }

    return NextResponse.json({
      settings,
      products: products || [],
    });
  } catch (error) {
    console.error('Catalog public GET error:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}


