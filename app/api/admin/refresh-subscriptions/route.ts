import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get: () => '', set: () => {}, remove: () => {} }
      }
    );
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabase
      .from('system_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all active subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stores!inner(
          id,
          name,
          status
        )
      `)
      .eq('status', 'active');

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    const updatedSubscriptions = [];
    const now = new Date();

    // Process each subscription
    for (const subscription of subscriptions || []) {
      const endDate = new Date(subscription.end_date);
      const gracePeriod = subscription.grace_days || 7;
      const graceEndDate = new Date(endDate.getTime() + (gracePeriod * 24 * 60 * 60 * 1000));

      let newStatus = subscription.status;
      let shouldUpdate = false;

      // Check if subscription has expired
      if (now > endDate) {
        if (now > graceEndDate) {
          // Past grace period - suspend store
          newStatus = 'expired';
          shouldUpdate = true;

          // Update store status to suspended
          const { error: storeUpdateError } = await supabase
            .from('stores')
            .update({ status: 'suspended' })
            .eq('id', subscription.store_id);

          if (storeUpdateError) {
            console.error(`Error suspending store ${subscription.store_id}:`, storeUpdateError);
          }
        } else {
          // Within grace period
          newStatus = 'past_due';
          shouldUpdate = true;
        }
      }

      // Check if subscription is expiring soon (within 7 days)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0 && subscription.status === 'active') {
        // Send notification (in real app, this would trigger email/SMS)
        console.log(`Subscription ${subscription.id} expires in ${daysUntilExpiry} days`);
      }

      // Update subscription if needed
      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            status: newStatus,
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError);
        } else {
          updatedSubscriptions.push({
            id: subscription.id,
            store_name: subscription.stores.name,
            old_status: subscription.status,
            new_status: newStatus,
            updated_at: now.toISOString()
          });
        }
      }
    }

    // Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('subscriptions')
      .select('status')
      .in('status', ['active', 'past_due', 'expired']);

    if (statsError) {
      console.error('Error fetching subscription stats:', statsError);
    }

    const summary = {
      total: stats?.length || 0,
      active: stats?.filter((s: { status: string }) => s.status === 'active').length || 0,
      past_due: stats?.filter((s: { status: string }) => s.status === 'past_due').length || 0,
      expired: stats?.filter((s: { status: string }) => s.status === 'expired').length || 0,
      updated: updatedSubscriptions.length
    };

    return NextResponse.json({
      success: true,
      message: 'Subscriptions refreshed successfully',
      summary,
      updated_subscriptions: updatedSubscriptions,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error refreshing subscriptions:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to refresh subscriptions'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get: () => '', set: () => {}, remove: () => {} }
      }
    );
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabase
      .from('system_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get subscription statistics
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        end_date,
        grace_days,
        stores!inner(
          id,
          name,
          status
        )
      `);

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    const now = new Date();
    const stats = {
      total: subscriptions?.length || 0,
      active: 0,
      past_due: 0,
      expired: 0,
      expiring_soon: 0,
      grace_period: 0
    };

    const expiringSoon = [];
    const gracePeriod = [];

    // Analyze subscriptions
    for (const subscription of subscriptions || []) {
      const endDate = new Date(subscription.end_date);
      const graceDays = subscription.grace_days || 7;
      const graceEndDate = new Date(endDate.getTime() + (graceDays * 24 * 60 * 60 * 1000));

      if (subscription.status === 'active') {
        stats.active++;
        
        // Check if expiring soon (within 7 days)
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          stats.expiring_soon++;
          expiringSoon.push({
            id: subscription.id,
            store_name: subscription.stores[0]?.name || 'Unknown Store',
            days_until_expiry: daysUntilExpiry,
            end_date: subscription.end_date
          });
        }
      } else if (subscription.status === 'past_due') {
        stats.past_due++;
        
        // Check if within grace period
        if (now <= graceEndDate) {
          stats.grace_period++;
          gracePeriod.push({
            id: subscription.id,
            store_name: subscription.stores[0]?.name || 'Unknown Store',
            grace_end_date: graceEndDate.toISOString(),
            days_remaining: Math.ceil((graceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      } else if (subscription.status === 'expired') {
        stats.expired++;
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      expiring_soon: expiringSoon,
      grace_period: gracePeriod,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error fetching subscription statistics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch subscription statistics'
      },
      { status: 500 }
    );
  }
}
