import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan configuration (amounts in paise)
const PLANS: Record<string, { amount: number; label: string; durationDays: number }> = {
    monthly: { amount: 19900, label: 'Monthly Plan', durationDays: 30 },
    yearly: { amount: 199900, label: 'Yearly Plan', durationDays: 365 },
};

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for the selected plan.
 * Body: { planId: "monthly" | "yearly" }
 */
export async function POST(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please login first.' }, { status: 401 });
        }

        const { planId } = await req.json();

        if (!planId || !PLANS[planId]) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        const plan = PLANS[planId];

        // 1. Fetch real-time wallet balance
        const dbUserRes = await query('SELECT wallet_balance FROM users WHERE id = $1', [user.userId]);
        const walletBalanceRaw = Number(dbUserRes.rows[0].wallet_balance || 0);
        const walletBalancePaise = walletBalanceRaw * 100;

        // 2. Calculate what's payable
        const maxWalletUsable = Math.min(walletBalancePaise, plan.amount);
        let finalAmountPaise = plan.amount - maxWalletUsable;

        // If amount remaining is less than Razorpay's ₹1 minimum, fully cover it with wallet if possible
        if (finalAmountPaise > 0 && finalAmountPaise < 100) {
            finalAmountPaise = 100;
        }

        // 3. Fully Paid by Wallet bypass
        if (finalAmountPaise === 0) {
            // Deduct wallet
            await query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [plan.amount / 100, user.userId]);

            // Activate subscription right away
            const subRes = await query('SELECT plan_id, expires_at, active FROM subscriptions WHERE user_id = $1', [user.userId]);
            let expiresAt = new Date();
            if (subRes.rows.length > 0) {
                const currentSub = subRes.rows[0];
                if (currentSub.active && new Date(currentSub.expires_at) > new Date()) {
                    expiresAt = new Date(currentSub.expires_at); // preserve existing days
                }
            }
            expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

            await query(
                `INSERT INTO subscriptions (user_id, plan_id, razorpay_payment_id, razorpay_order_id, starts_at, expires_at, active)
                 VALUES ($1, $2, $3, $4, $5, $6, true)
                 ON CONFLICT (user_id)
                 DO UPDATE SET plan_id = $2, razorpay_payment_id = $3, razorpay_order_id = $4, starts_at = $5, expires_at = $6, active = true`,
                [user.userId, planId, 'WALLET_PAID', 'WALLET_ORDER_' + Date.now(), new Date().toISOString(), expiresAt.toISOString()]
            );

            // Process referral reward (Duplicate logic from verify)
            const userQuery = await query('SELECT referred_by, referral_reward_paid FROM users WHERE id = $1', [user.userId]);
            if (userQuery.rows.length > 0) {
                const dbUser = userQuery.rows[0];
                if (dbUser.referred_by && !dbUser.referral_reward_paid) {
                    const reward = planId === 'yearly' ? 50 : 25;
                    await query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [reward, dbUser.referred_by]);
                    await query('UPDATE users SET wallet_balance = wallet_balance + $1, referral_reward_paid = true WHERE id = $2', [reward, user.userId]);
                }
            }

            return NextResponse.json({
                success: true,
                fullyPaidByWallet: true,
                plan: planId,
                expiresAt: expiresAt.toISOString(),
            });
        }

        // 4. Create Razorpay order for the remaining amount
        const order = await razorpay.orders.create({
            amount: finalAmountPaise,
            currency: 'INR',
            receipt: `r_${Date.now()}`,
            notes: {
                userId: String(user.userId),
                planId,
            },
        });

        // 5. Save order to DB (we save the actual razorpay amount requested!)
        await query(
            `INSERT INTO payment_orders (razorpay_order_id, user_id, plan_id, amount, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [order.id, user.userId, planId, finalAmountPaise, 'created']
        );

        return NextResponse.json({
            orderId: order.id,
            amount: finalAmountPaise,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            planLabel: plan.label,
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}
