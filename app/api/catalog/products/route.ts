import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const supabaseAdmin = getSupabaseAdmin();
const ALLOWED_FIELDS = [
  'show_in_catalog',
  'catalog_price',
  'catalog_badge',
  'catalog_description',
  'catalog_button_label',
  'catalog_featured',
  'catalog_sort_order',
] as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Catalog products fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });
  } catch (error) {
    console.error('Catalog products GET error:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { productId, updates } = body;

    if (!productId || !updates) {
      return NextResponse.json({ error: 'Product ID and updates are required' }, { status: 400 });
    }

    const payload: Record<string, any> = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (field in updates) {
        payload[field] = updates[field];
      }
    });

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields found in update' }, { status: 400 });
    }

    const { error, data } = await supabaseAdmin
      .from('products')
      .update(payload)
      .eq('id', productId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Catalog product update error:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Catalog products POST error:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}


