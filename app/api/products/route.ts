import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

/**
 * GET /api/products
 */
export async function GET(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(
            'SELECT * FROM products WHERE user_id = $1 ORDER BY name ASC',
            [user.userId]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

/**
 * POST /api/products (Upsert)
 */
export async function POST(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, name, price, unit, hsnCode, description, taxRate, allowedTypes, priceType, stock } = body;

        if (!name || price === undefined) {
            return NextResponse.json({ error: 'Name and Price are required' }, { status: 400 });
        }

        const now = Date.now();

        const sql = `
            INSERT INTO products (id, user_id, name, price, unit, hsn_code, description, tax_rate, allowed_types, price_type, stock, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                price = EXCLUDED.price,
                unit = EXCLUDED.unit,
                hsn_code = EXCLUDED.hsn_code,
                description = EXCLUDED.description,
                tax_rate = EXCLUDED.tax_rate,
                allowed_types = EXCLUDED.allowed_types,
                price_type = EXCLUDED.price_type,
                stock = EXCLUDED.stock,
                updated_at = EXCLUDED.updated_at
            WHERE products.user_id = $2 OR products.user_id IS NULL
            RETURNING *;
        `;

        let result;
        if (id) {
            result = await query(sql, [id, user.userId, name, price, unit, hsnCode, description, taxRate, JSON.stringify(allowedTypes), priceType, stock, now, now]);
            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
            }
        } else {
            const insertSql = `
                INSERT INTO products (user_id, name, price, unit, hsn_code, description, tax_rate, allowed_types, price_type, stock, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *;
            `;
            result = await query(insertSql, [user.userId, name, price, unit, hsnCode, description, taxRate, JSON.stringify(allowedTypes), priceType, stock, now, now]);
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving product:', error);
        return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
    }
}
