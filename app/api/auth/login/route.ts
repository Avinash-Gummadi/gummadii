import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth-util';

/**
 * Detects if the identifier is an email or phone number.
 */
function isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email/Mobile and password are required' }, { status: 400 });
        }

        const identifier = email.trim();

        // ─── ADMIN BYPASS ──────────────────────────────────────────────────
        if (identifier === 'admin@gummadii.com') {
            if (password !== 'admin@Gummadi@123') {
                return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
            }

            const adminUser = {
                id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for admin
                email: 'admin@gummadii.com',
                phone: '0000000000',
                companyName: 'Miracle Invoice Admin',
                firstName: 'System',
                lastName: 'Admin',
                role: 'ADMIN'
            };
            // Generate token first using a temporary response
            const tempRes = NextResponse.json({});
            const token = setAuthCookie(tempRes, { userId: adminUser.id, email: adminUser.email, phone: adminUser.phone, role: 'ADMIN' });

            const response = NextResponse.json({
                message: 'Admin login successful',
                user: adminUser,
                token
            });

            // Apply cookies to the real response
            setAuthCookie(response, { userId: adminUser.id, email: adminUser.email, phone: adminUser.phone, role: 'ADMIN' });

            return response;
        }

        // Query by email OR phone
        let result;
        if (isEmail(identifier)) {
            result = await query('SELECT * FROM users WHERE email = $1', [identifier]);
        } else {
            result = await query('SELECT * FROM users WHERE phone = $1', [identifier]);
        }

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Lazy initialize referral_code for older users
        let updatedReferralCode = user.referral_code;
        if (!updatedReferralCode) {
            updatedReferralCode = 'REF-' + Math.random().toString(36).substring(2, 7).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-4);
            await query('UPDATE users SET referral_code = $1 WHERE id = $2', [updatedReferralCode, user.id]);
            user.referral_code = updatedReferralCode;
        }

        // Set Auth Cookie & Respond
        const tempRes = NextResponse.json({});
        const token = setAuthCookie(tempRes, { userId: user.id, email: user.email, phone: user.phone });

        const response = NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                companyName: user.company_name,
                firstName: user.first_name,
                lastName: user.last_name,
                walletBalance: user.wallet_balance || 0,
                referralCode: user.referral_code || null
            },
            token
        });

        setAuthCookie(response, { userId: user.id, email: user.email, phone: user.phone });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
