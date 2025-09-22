import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Temporarily disabled for build - requires Stripe environment variables
  return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
}
