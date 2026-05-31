import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';
import crypto from 'crypto';

// Plan durations for subscription expiry calculation
const PLAN_DURATIONS: Record<string, number> = {
    monthly: 30,
    yearly: 365,
};

/**
 * POST /api/payments/verify
 * Verifies payment signature and activates subscription.
 * Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 */
export async function POST(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
        }

        // 1. Verify signature using HMAC SHA256
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Payment verification failed. Invalid signature.' }, { status: 400 });
        }

        // 2. Look up the order to get planId
        const orderResult = await query(
            'SELECT * FROM payment_orders WHERE razorpay_order_id = $1 AND user_id = $2',
            [razorpay_order_id, user.userId]
        );

        if (orderResult.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orderResult.rows[0];
        const planId = order.plan_id;
        const durationDays = PLAN_DURATIONS[planId] || 30;
        const planAmountPaise = planId === 'yearly' ? 199900 : 19900;

        // 3. Deduct partial wallet if used
        const walletUsedPaise = planAmountPaise - order.amount;
        if (walletUsedPaise > 0) {
            await query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [walletUsedPaise / 100, user.userId]);
        }

        // 4. Update order status
        await query(
            'UPDATE payment_orders SET status = $1 WHERE razorpay_order_id = $2',
            ['paid', razorpay_order_id]
        );

        // 5. Upsert subscription (Add duration to existing if active)
        const subRes = await query('SELECT plan_id, expires_at, active FROM subscriptions WHERE user_id = $1', [user.userId]);
        let expiresAt = new Date();
        if (subRes.rows.length > 0) {
            const currentSub = subRes.rows[0];
            if (currentSub.active && new Date(currentSub.expires_at) > new Date()) {
                expiresAt = new Date(currentSub.expires_at); // preserve existing days
            }
        }
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        const startsAt = new Date();

        await query(
            `INSERT INTO subscriptions (user_id, plan_id, razorpay_payment_id, razorpay_order_id, starts_at, expires_at, active)
             VALUES ($1, $2, $3, $4, $5, $6, true)
             ON CONFLICT (user_id)
             DO UPDATE SET plan_id = $2, razorpay_payment_id = $3, razorpay_order_id = $4, starts_at = $5, expires_at = $6, active = true`,
            [user.userId, planId, razorpay_payment_id, razorpay_order_id, startsAt.toISOString(), expiresAt.toISOString()]
        );

        // 5. Process Referral Rewards (One-time per user)
        const userQuery = await query('SELECT referred_by, referral_reward_paid FROM users WHERE id = $1', [user.userId]);
        if (userQuery.rows.length > 0) {
            const dbUser = userQuery.rows[0];
            if (dbUser.referred_by && !dbUser.referral_reward_paid) {
                // Determine Reward amount
                const reward = planId === 'yearly' ? 50 : 25;

                // Credit referring user
                await query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [reward, dbUser.referred_by]);

                // Credit the buying user & mark reward as paid so it doesn't trigger again
                await query('UPDATE users SET wallet_balance = wallet_balance + $1, referral_reward_paid = true WHERE id = $2', [reward, user.userId]);

                console.log(`[Referral Reward] Paid ₹${reward} to User ${user.userId} & Referrer ${dbUser.referred_by}`);
            }
        }

        return NextResponse.json({
            success: true,
            plan: planId,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Payment verification failed' },
            { status: 500 }
        );
    }
}
