import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

/**
 * GET /api/payments/status
 * Returns the active subscription for the logged-in user.
 */
export async function GET(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(
            `SELECT plan_id, starts_at, expires_at, active
             FROM subscriptions
             WHERE user_id = $1 AND active = true AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1`,
            [user.userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ isActive: false, plan: null, expiresAt: null });
        }

        const sub = result.rows[0];
        return NextResponse.json({
            isActive: true,
            plan: sub.plan_id,
            expiresAt: sub.expires_at,
            startsAt: sub.starts_at,
        });
    } catch (error: any) {
        console.error('Subscription status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch subscription status' },
            { status: 500 }
        );
    }
}
