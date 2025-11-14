import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const supabaseAdmin = getSupabaseAdmin();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { data, error } = await supabaseAdmin
      .from('product_catalog_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching catalog settings:', error);
      return NextResponse.json({ error: 'Failed to fetch catalog settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: data || null });
  } catch (error) {
    console.error('Catalog settings GET error:', error);
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
    const {
      businessName,
      headline,
      subheading,
      slug,
      accentColor,
      heroImageUrl,
      logoUrl,
      whatsappNumber,
      contactEmail,
      ctaText,
    } = body;

    if (!businessName || !slug) {
      return NextResponse.json(
        { error: 'Business name and slug are required' },
        { status: 400 }
      );
    }

    // Ensure slug is unique across catalog settings
    const { data: slugOwner, error: slugError } = await supabaseAdmin
      .from('product_catalog_settings')
      .select('id,user_id')
      .eq('slug', slug)
      .maybeSingle();

    if (slugError) {
      console.error('Slug lookup error:', slugError);
      return NextResponse.json({ error: 'Unable to verify slug' }, { status: 500 });
    }

    if (slugOwner && slugOwner.user_id !== userId) {
      return NextResponse.json(
        { error: 'This catalog URL is already in use by another business.' },
        { status: 409 }
      );
    }

    const payload = {
      user_id: userId,
      business_name: businessName,
      headline: headline || null,
      subheading: subheading || null,
      slug,
      accent_color: accentColor || '#10b981',
      hero_image_url: heroImageUrl || null,
      logo_url: logoUrl || null,
      whatsapp_number: whatsappNumber || null,
      contact_email: contactEmail || null,
      cta_text: ctaText || 'Order now',
    };

    let result;
    if (slugOwner && slugOwner.user_id === userId) {
      result = await supabaseAdmin
        .from('product_catalog_settings')
        .update(payload)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();
    } else {
      result = await supabaseAdmin
        .from('product_catalog_settings')
        .insert(payload)
        .select('*')
        .maybeSingle();
    }

    if (result.error) {
      console.error('Error saving catalog settings:', result.error);
      return NextResponse.json({ error: 'Failed to save catalog settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: result.data });
  } catch (error) {
    console.error('Catalog settings POST error:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}


