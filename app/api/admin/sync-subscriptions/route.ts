import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getRazorpaySubscription } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const supabaseAdmin = getSupabaseAdmin();
    const userId = (session.user as any).id;
    
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Allow admin@minicrm.com as admin
    const isAdmin = user?.role === 'admin' || session.user?.email === 'admin@minicrm.com';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all subscriptions with Razorpay subscription IDs
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, razorpay_subscription_id, user_id')
      .not('razorpay_subscription_id', 'is', null);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions to sync',
        synced: 0,
      });
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Sync each subscription
    for (const sub of subscriptions) {
      try {
        if (!sub.razorpay_subscription_id) continue;

        // Fetch latest subscription data from Razorpay
        const razorpaySub = await getRazorpaySubscription(sub.razorpay_subscription_id);

        console.log(`📥 Syncing subscription ${sub.razorpay_subscription_id}:`, {
          status: razorpaySub.status,
          charge_at: razorpaySub.charge_at,
          current_end: razorpaySub.current_end,
          start_at: razorpaySub.start_at,
          end_at: razorpaySub.end_at,
          all_fields: Object.keys(razorpaySub),
        });

        // Calculate next due date
        let nextDueDate: string | null = null;
        
        if (razorpaySub.charge_at) {
          nextDueDate = new Date(razorpaySub.charge_at * 1000).toISOString();
          console.log(`✅ Using charge_at: ${nextDueDate}`);
        } else if (razorpaySub.current_end) {
          nextDueDate = new Date(razorpaySub.current_end * 1000).toISOString();
          console.log(`✅ Using current_end: ${nextDueDate}`);
        } else if (razorpaySub.start_at) {
          // Calculate next due date: start_at + 1 billing cycle (monthly)
          const startDate = new Date(razorpaySub.start_at * 1000);
          const nextDue = new Date(startDate);
          nextDue.setMonth(nextDue.getMonth() + 1); // Add 1 month
          nextDueDate = nextDue.toISOString();
          console.log(`✅ Calculated from start_at: ${nextDueDate}`);
        } else {
          console.warn(`⚠️ No date fields available for subscription ${sub.razorpay_subscription_id}`);
        }

        // Determine plan from Razorpay plan_id
        const planId = razorpaySub.plan_id;
        let plan: string = 'free';
        
        if (planId === process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID) {
          plan = 'starter';
        } else if (planId === process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID) {
          plan = 'pro';
        } else if (planId === process.env.NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID) {
          plan = 'business';
        }

        // Update subscription in database
        const updateData: any = {
          status: razorpaySub.status === 'created' ? 'pending' : razorpaySub.status,
          plan: plan, // Update plan from Razorpay
          updated_at: new Date().toISOString(),
        };

        if (razorpaySub.start_at) {
          updateData.current_period_start = new Date(razorpaySub.start_at * 1000).toISOString();
        }

        if (razorpaySub.end_at) {
          updateData.current_period_end = new Date(razorpaySub.end_at * 1000).toISOString();
        }

        if (nextDueDate) {
          updateData.next_due_date = nextDueDate;
        }

        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('id', sub.id);

        if (updateError) {
          failed++;
          errors.push(`Failed to update subscription ${sub.razorpay_subscription_id}: ${updateError.message}`);
        } else {
          synced++;
          
          // Also update user's plan in users table
          const { error: userUpdateError } = await supabaseAdmin
            .from('users')
            .update({
              plan: plan,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.user_id);

          if (userUpdateError) {
            console.warn(`Warning: Could not update user plan for user ${sub.user_id}:`, userUpdateError);
          } else {
            console.log(`✅ Updated user plan to ${plan} for user ${sub.user_id}`);
          }
        }
      } catch (error: any) {
        failed++;
        errors.push(`Error syncing subscription ${sub.razorpay_subscription_id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} subscriptions, ${failed} failed`,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Error syncing subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

