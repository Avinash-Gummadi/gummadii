import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

export async function PATCH(req: NextRequest) {
    try {
        const { user, error } = getAuthUser(req);
        if (error || !user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
        }

        const body = await req.json();
        const { accountId, walletBalance } = body;

        if (!accountId || typeof walletBalance !== 'number') {
            return NextResponse.json({ error: 'Missing accountId or valid walletBalance parameter' }, { status: 400 });
        }

        await query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [walletBalance, accountId]);

        return NextResponse.json({ message: 'Wallet balance successfully updated' });
    } catch (e: any) {
        console.error('Admin Wallet PATCH error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
