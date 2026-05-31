import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

const PLATFORM_BASE_LIMIT = 500 * 1024 * 1024; // 500MB Baseline (Adjustable)


export async function GET(req: NextRequest) {
    try {
        const { user, error } = getAuthUser(req);
        console.log('[ADMIN_ROUTE] getAuthUser result:', { user, error });

        if (error || !user || user.role !== 'ADMIN') {
            console.error('[ADMIN_ROUTE] Unauthorized attempt:', { error, userRole: user?.role });
            return NextResponse.json({ error: 'Unauthorized access', details: { error, userRole: user?.role } }, { status: 401 });
        }

        // Aggregate DB size (in bytes) and user metrics
        // We use pg_column_size to accurately estimate the physical size of user-associated records.
        const sql = `
            SELECT
                u.id as account_id,
                u.globalid,
                u.company_name,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.wallet_balance,
                u.created_at,
                s.plan_id as subscription_type,
                COALESCE(i.invoice_count, 0) as invoice_count,
                COALESCE(c.client_count, 0) as client_count,
                COALESCE(p.product_count, 0) as product_count,
                (
                    COALESCE(i.invoice_size, 0) + 
                    COALESCE(c.client_size, 0) + 
                    COALESCE(p.product_size, 0) + 
                    COALESCE(bp.bp_size, 0) +
                    COALESCE(pg_column_size(u.*), 0)
                ) as db_size_bytes
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id AND s.active = true
            LEFT JOIN (
                SELECT user_id, COUNT(*) as invoice_count, SUM(pg_column_size(invoices.*)) as invoice_size
                FROM invoices GROUP BY user_id
            ) i ON u.id = i.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as client_count, SUM(pg_column_size(clients.*)) as client_size
                FROM clients GROUP BY user_id
            ) c ON u.id = c.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as product_count, SUM(pg_column_size(products.*)) as product_size
                FROM products GROUP BY user_id
            ) p ON u.id = p.user_id
            LEFT JOIN (
                SELECT user_id, SUM(pg_column_size(business_profile.*)) as bp_size
                FROM business_profile GROUP BY user_id
            ) bp ON u.id = bp.user_id
            ORDER BY u.created_at DESC;
        `;

        const result = await query(sql);

        // Analyze and aggregate cluster data
        const users = (result?.rows || []).map(row => ({
            accountId: row.account_id,
            globalid: row.globalid,
            companyName: row.company_name || 'N/A',
            ownerName: row.first_name ? `${row.first_name} ${row.last_name || ''}`.trim() : 'N/A',
            email: row.email,
            phone: row.phone,
            walletBalance: Number(row.wallet_balance) || 0,
            createdAt: Number(row.created_at),
            subscriptionType: row.subscription_type || 'free',
            invoiceCount: Number(row.invoice_count),
            clientCount: Number(row.client_count),
            productCount: Number(row.product_count),
            dbSizeBytes: Number(row.db_size_bytes),
        }));

        const totalDbSizeBytes = users.reduce((sum, u) => sum + u.dbSizeBytes, 0);
        const totalDbLimit = Math.max(PLATFORM_BASE_LIMIT, users.reduce((sum, u) => {
            const isPro = u.subscriptionType !== 'free';
            return sum + (isPro ? 500 * 1024 * 1024 : 10 * 1024 * 1024);
        }, 0));


        return NextResponse.json({
            users,
            cluster: {
                totalUsers: users.length,
                totalDbSizeBytes,
                totalDbLimit
            }
        });

    } catch (error: any) {
        console.error('Admin API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { user, error } = getAuthUser(req);
        if (error || !user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
        }

        const body = await req.json();
        const { accountId, subscriptionType } = body;

        if (!accountId || !subscriptionType) {
            return NextResponse.json({ error: 'Missing accountId or subscriptionType' }, { status: 400 });
        }

        if (subscriptionType === 'free') {
            await query('DELETE FROM subscriptions WHERE user_id = $1', [accountId]);
        } else {
            // Upsert for pro ('monthly', 'yearly')
            await query(`
                INSERT INTO subscriptions (user_id, plan_id, active, starts_at, expires_at)
                VALUES ($1, $2, true, NOW(), NOW() + INTERVAL '1 year')
                ON CONFLICT (user_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, active = true, expires_at = NOW() + INTERVAL '1 year'
            `, [accountId, subscriptionType]);
        }

        return NextResponse.json({ message: 'Subscription successfully updated' });
    } catch (e: any) {
        console.error('Admin PATCH error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { user, error } = getAuthUser(req);
        if (error || !user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
        }

        const url = new URL(req.url);
        const accountId = url.searchParams.get('id');

        if (!accountId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        // Manually cascade delete just in case constraints are not perfectly set
        await query('DELETE FROM invoices WHERE user_id = $1', [accountId]);
        await query('DELETE FROM clients WHERE user_id = $1', [accountId]);
        await query('DELETE FROM products WHERE user_id = $1', [accountId]);
        await query('DELETE FROM business_profile WHERE user_id = $1', [accountId]);
        await query('DELETE FROM payment_orders WHERE user_id = $1', [accountId]);
        await query('DELETE FROM subscriptions WHERE user_id = $1', [accountId]);
        await query('DELETE FROM users WHERE id = $1', [accountId]);

        return NextResponse.json({ message: 'User successfully deleted' });
    } catch (e: any) {
        console.error('Admin DELETE error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
