import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth-util';

export async function POST(req: NextRequest) {
    try {
        const { email, phone, password, companyName, ref } = await req.json();

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        if (!email && !phone) {
            return NextResponse.json({ error: 'Email or Mobile number is required' }, { status: 400 });
        }

        // Check if user exists (by email or phone)
        if (email) {
            const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
            }
        }
        if (phone) {
            const existing = await query('SELECT id FROM users WHERE phone = $1', [phone]);
            if (existing.rows.length > 0) {
                return NextResponse.json({ error: 'User already exists with this mobile number' }, { status: 400 });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let referredBy = null;
        if (ref) {
            const refUser = await query('SELECT id FROM users WHERE referral_code = $1', [ref]);
            if (refUser.rows.length > 0) {
                referredBy = refUser.rows[0].id;
            }
        }

        // Generate unique referral code: 'REF-' + 5 random chars + short timestamp
        const referralCode = 'REF-' + Math.random().toString(36).substring(2, 7).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-4);
        
        // Generate globalid (9 digits)
        const globalid = Math.floor(100000000 + Math.random() * 900000000).toString();

        // Insert user
        const result = await query(
            'INSERT INTO users (globalid, email, phone, password_hash, company_name, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [globalid, email || null, phone || null, passwordHash, companyName, referralCode, referredBy]
        );

        const userId = result.rows[0].id;

        // Generate token using a temporary response
        const tempRes = NextResponse.json({});
        const token = setAuthCookie(tempRes, { userId, email: email || phone, phone });

        // Set Auth Cookie & Respond
        const response = NextResponse.json({
            message: 'User created successfully',
            user: { id: userId, globalid, email, phone, companyName, firstName: null, lastName: null, referralCode, walletBalance: 0 },
            token
        });

        setAuthCookie(response, { userId, email: email || phone, phone });

        return response;

    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
