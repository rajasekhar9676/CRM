import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('⚠️ RECAPTCHA_SECRET_KEY not set, skipping verification');
    return true; // Allow submission if reCAPTCHA not configured
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}

// Rate limiting: Check if same IP submitted recently (prevent spam)
async function checkRateLimit(ipAddress: string): Promise<boolean> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', fiveMinutesAgo)
      .limit(1);

    if (error) {
      console.error('Error checking rate limit:', error);
      return true; // Allow if check fails
    }

    // If found, rate limit exceeded
    return (data?.length || 0) === 0;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return true; // Allow if check fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, phone, recaptchaToken } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidRecaptcha) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Get IP address and user agent for spam detection
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check rate limit (prevent spam from same IP)
    const canSubmit = await checkRateLimit(ipAddress);
    if (!canSubmit) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes before submitting again.' },
        { status: 429 }
      );
    }

    // Save to database
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        name: name.trim(),
        email: email.trim(),
        subject: subject?.trim() || null,
        message: message.trim(),
        phone: phone?.trim() || null,
        status: 'new',
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving contact:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please run the CREATE_CONTACTS_TABLE.sql script in Supabase.',
            databaseError: true,
            details: error.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to save contact. Please try again later.',
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ Contact saved successfully:', data.id);
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for contacting us! We\'ll get back to you within 24 hours.',
        id: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

