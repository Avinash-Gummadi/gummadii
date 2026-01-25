import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveJson } from '@/lib/json-loader';

export async function POST(request: Request) {
    try {
        // Check Auth
        const cookieStore = await cookies();
        const adminSession = cookieStore.get('admin_session');
        if (!adminSession || adminSession.value !== 'true') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { filename, content } = body;

        if (!filename || !content) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
        }

        // Security check: simple path traversal prevention
        if (filename.includes('..') || filename.includes('/') || !filename.endsWith('.json')) {
            return NextResponse.json({ success: false, message: 'Invalid filename' }, { status: 400 });
        }

        await saveJson(filename, content);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Failed to save' }, { status: 500 });
    }
}
