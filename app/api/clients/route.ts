import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

/**
 * GET /api/clients
 * Fetch all clients for the authenticated user.
 */
export async function GET(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(
            'SELECT * FROM clients WHERE user_id = $1 ORDER BY updated_at DESC',
            [user.userId]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

/**
 * POST /api/clients
 * Upsert a client for the authenticated user.
 */
export async function POST(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, name, phone, email, address, gstIn, notes } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const now = Date.now();

        // One-shot Upsert operation (restricted by user_id)
        const sql = `
            INSERT INTO clients (id, user_id, name, phone, email, address, gst_in, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                address = EXCLUDED.address,
                gst_in = EXCLUDED.gst_in,
                notes = EXCLUDED.notes,
                updated_at = EXCLUDED.updated_at
            WHERE clients.user_id = $2 OR clients.user_id IS NULL
            RETURNING *;
        `;

        let result;
        if (id) {
            result = await query(sql, [id, user.userId, name, phone, email, address, gstIn, notes, now, now]);
            if (result.rows.length === 0) {
                // This could happen if id exists but belongs to another user
                return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
            }
        } else {
            const insertSql = `
                INSERT INTO clients (user_id, name, phone, email, address, gst_in, notes, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *;
            `;
            result = await query(insertSql, [user.userId, name, phone, email, address, gstIn, notes, now, now]);
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving client:', error);
        return NextResponse.json({ error: 'Failed to save client' }, { status: 500 });
    }
}
