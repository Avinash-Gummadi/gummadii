import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';
import crypto from 'crypto';

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

        // Verify signature using HMAC SHA256
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Payment verification failed. Invalid signature.' }, { status: 400 });
        }

        // Look up the order
        const orderResult = await query(
            'SELECT * FROM payment_orders WHERE razorpay_order_id = $1 AND user_id = $2',
            [razorpay_order_id, user.userId]
        );

        if (orderResult.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orderResult.rows[0];

        // Ensure this is actually a wallet topup
        if (order.plan_id !== 'wallet_topup') {
            return NextResponse.json({ error: 'Invalid order type for wallet verification' }, { status: 400 });
        }

        // Check if already paid to prevent double crediting
        if (order.status === 'paid') {
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        const topupAmount = Number(order.amount);

        // Update order status
        await query(
            'UPDATE payment_orders SET status = $1 WHERE razorpay_order_id = $2',
            ['paid', razorpay_order_id]
        );

        // Credit User Wallet
        await query(
            'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
            [topupAmount, user.userId]
        );

        console.log(`[Wallet Topup] Added ₹${topupAmount} to User ${user.userId}`);

        return NextResponse.json({
            success: true,
            addedAmount: topupAmount,
        });

    } catch (error: any) {
        console.error('Wallet verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Wallet validation failed' },
            { status: 500 }
        );
    }
}
