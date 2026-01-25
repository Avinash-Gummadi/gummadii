import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Protect /admin routes
    if (path.startsWith('/admin')) {
        // allow /admin/login
        if (path === '/admin/login') {
            return NextResponse.next();
        }

        const adminSession = request.cookies.get('admin_session');

        // Check if session exists and is valid (simple check for now)
        if (!adminSession || adminSession.value !== 'true') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
