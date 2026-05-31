import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. CORS Logic for API routes
    if (path.startsWith('/api')) {
        const origin = request.headers.get("origin") || "";
        
        // Define allowed origins patterns:
        // 1. Ends with .gummadii.com or is exactly https://gummadii.com
        // 2. Localhost for development (e.g., http://localhost:3000, http://localhost:3001, etc.)
        const isGummadiiSubdomain = origin.endsWith(".gummadii.com") || origin === "https://gummadii.com";
        const isLocalhost = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");

        const isAllowed = isGummadiiSubdomain || isLocalhost;

        // Handle preflight OPTIONS requests
        if (request.method === "OPTIONS") {
            if (isAllowed) {
                return new NextResponse(null, {
                    status: 204,
                    headers: {
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, Authorization",
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Max-Age": "86400", // 24 hours
                    },
                });
            }
            return new NextResponse(null, { status: 204 });
        }

        // Handle normal API requests
        const response = NextResponse.next();

        if (isAllowed) {
            response.headers.set("Access-Control-Allow-Origin", origin);
            response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.headers.set("Access-Control-Allow-Credentials", "true");
        }

        return response;
    }

    // 2. Protect /admin routes
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
    matcher: ['/admin/:path*', '/api/:path*'],
};
