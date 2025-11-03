import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { canCreateInvoice } from '@/lib/subscription-checks';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { allowed: false, reason: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = await request.json();
    
    // Verify the userId matches the session user
    if (userId !== (session.user as any).id) {
      return NextResponse.json(
        { allowed: false, reason: 'Unauthorized' },
        { status: 403 }
      );
    }

    const result = await canCreateInvoice(userId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking invoice limit:', error);
    return NextResponse.json(
      { allowed: false, reason: 'An error occurred while checking limits' },
      { status: 500 }
    );
  }
}

