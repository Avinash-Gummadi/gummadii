import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

export async function POST(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount } = await req.json(); // Expected amount in INR (e.g., 500)

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid top-up amount' }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // Amount in paise
        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `rcpt_wallet_${Date.now().toString(36)}`,
        };

        const order = await razorpay.orders.create(options);

        // Store order as a pending wallet_topup
        await query(
            'INSERT INTO payment_orders (razorpay_order_id, user_id, plan_id, amount, status) VALUES ($1, $2, $3, $4, $5)',
            [order.id, user.userId, 'wallet_topup', amount, 'created']
        );

        return NextResponse.json({ orderId: order.id, amount: options.amount });
    } catch (error: any) {
        console.error('Wallet Top-Up Order Creation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create top-up order' },
            { status: 500 }
        );
    }
}
