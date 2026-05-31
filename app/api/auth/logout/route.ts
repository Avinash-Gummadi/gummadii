import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear the jwt cookie
    response.cookies.set('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
    });

    return response;
}
