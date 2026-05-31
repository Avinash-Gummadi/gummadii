import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, setAuthCookie } from '@/lib/auth-util';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { user, error } = getAuthUser(req);

        // If altered or expired, clear the cookie
        if (error === 'invalid' || error === 'expired') {
            const response = NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
            response.cookies.delete('jwt');
            return response;
        }

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ─── ADMIN BYPASS ──────────────────────────────────────────────────
        if (user.role === 'ADMIN' && user.userId === '00000000-0000-0000-0000-000000000000') {
            const adminUser = {
                id: user.userId,
                email: user.email,
                phone: user.phone || '0000000000',
                firstName: 'System',
                lastName: 'Admin',
                companyName: 'Miracle Invoice Admin',
                role: 'ADMIN',
                walletBalance: 0,
                referralCode: null
            };
            const response = NextResponse.json({ user: adminUser });
            setAuthCookie(response, user);
            return response;
        }

        // Fetch fresh user data from DB to avoid stale JWT for wallet balances
        const dbUser = await query('SELECT * FROM users WHERE id = $1', [user.userId]);
        if (dbUser.rows.length === 0) {
            return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
        }

        let latestUser = dbUser.rows[0];

        // Lazy initialize referral_code for older users
        let updatedReferralCode = latestUser.referral_code;
        if (!updatedReferralCode) {
            updatedReferralCode = 'REF-' + Math.random().toString(36).substring(2, 7).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-4);
            await query('UPDATE users SET referral_code = $1 WHERE id = $2', [updatedReferralCode, latestUser.id]);
            latestUser.referral_code = updatedReferralCode;
        }

        // Valid session: Refresh the token with latest expiry
        const response = NextResponse.json({
            user: {
                id: latestUser.id,
                email: latestUser.email,
                phone: latestUser.phone,
                firstName: latestUser.first_name || null,
                lastName: latestUser.last_name || null,
                companyName: latestUser.company_name || null,
                role: latestUser.role || undefined, // Role doesn't exist natively on `users` table yet, we need to respect the legacy JWT role if used
                walletBalance: latestUser.wallet_balance || 0,
                referralCode: latestUser.referral_code || null
            }
        });

        setAuthCookie(response, user);
        return response;

    } catch (error) {
        console.error('CheckSession Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
