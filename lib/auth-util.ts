import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set in environment variables. Using fallback.');
}

export interface AuthUser {
    userId: string;
    email: string;
    phone?: string;
    role?: string;
}

/**
 * Verifies the JWT from the Authorization header or Cookie.
 * Returns { user, error } where error can be 'missing', 'expired', or 'invalid'.
 */
export function getAuthUser(req: NextRequest): { user: AuthUser | null; error?: 'missing' | 'expired' | 'invalid' } {
    try {
        let token = null;

        // 1. Check Authorization header
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // 2. Check Cookie if header is missing
        if (!token) {
            token = req.cookies.get('jwt')?.value;
        }

        if (!token) {
            return { user: null, error: 'missing' };
        }

        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return { user: decoded };
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return { user: null, error: 'expired' };
        }
        return { user: null, error: 'invalid' };
    }
}

/**
 * Generates a JWT and sets it in an HTTP-only cookie
 */
export function setAuthCookie(response: NextResponse, user: AuthUser) {
    const payload: any = { userId: user.userId, email: user.email, phone: user.phone };
    if (user.role) {
        payload.role = user.role;
    }

    const token = jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    response.cookies.set('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return token;
}
