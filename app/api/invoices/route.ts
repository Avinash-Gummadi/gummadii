import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

/**
 * GET /api/invoices
 * List all invoices for the authenticated user.
 */
export async function GET(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');

        let sql = 'SELECT * FROM invoices WHERE user_id = $1';
        const params: any[] = [user.userId];

        if (type) {
            sql += ` AND type = $${params.length + 1}`;
            params.push(type);
        }
        if (status) {
            sql += ` AND status = $${params.length + 1}`;
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, params);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

/**
 * POST /api/invoices
 * Create or Update an invoice for the authenticated user.
 */
export async function POST(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            id, invoiceNumber, type, date, dueDate, clientId,
            clientName, clientDetails, items, subtotal, taxTotal,
            discount, discountType, discountValue, total,
            status, currency, notes, terms, meta,
            clientAddress, clientGstIn, taxRate, showSignature, showBankDetails
        } = body;

        if (!invoiceNumber || !type || !date) {
            return NextResponse.json({ error: 'Invoice Number, Type, and Date are required' }, { status: 400 });
        }

        const now = Date.now();

        const sql = `
            INSERT INTO invoices (
                id, user_id, invoice_number, type, date, due_date, client_id,
                client_name, client_details, items, subtotal, tax_total,
                discount, discount_type, discount_value, total,
                status, currency, notes, terms, meta,
                client_address, client_gst_in, tax_rate, show_signature, show_bank_details,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
            ON CONFLICT (id) DO UPDATE SET
                invoice_number = EXCLUDED.invoice_number,
                type = EXCLUDED.type,
                date = EXCLUDED.date,
                due_date = EXCLUDED.due_date,
                client_id = EXCLUDED.client_id,
                client_name = EXCLUDED.client_name,
                client_details = EXCLUDED.client_details,
                items = EXCLUDED.items,
                subtotal = EXCLUDED.subtotal,
                tax_total = EXCLUDED.tax_total,
                discount = EXCLUDED.discount,
                discount_type = EXCLUDED.discount_type,
                discount_value = EXCLUDED.discount_value,
                total = EXCLUDED.total,
                status = EXCLUDED.status,
                currency = EXCLUDED.currency,
                notes = EXCLUDED.notes,
                terms = EXCLUDED.terms,
                meta = EXCLUDED.meta,
                client_address = EXCLUDED.client_address,
                client_gst_in = EXCLUDED.client_gst_in,
                tax_rate = EXCLUDED.tax_rate,
                show_signature = EXCLUDED.show_signature,
                show_bank_details = EXCLUDED.show_bank_details,
                updated_at = EXCLUDED.updated_at
            WHERE invoices.user_id = $2 OR invoices.user_id IS NULL
            RETURNING *;
        `;

        const requestId = id || undefined;
        let result;

        const params = [
            requestId, user.userId, invoiceNumber, type, date, dueDate, clientId,
            clientName, JSON.stringify(clientDetails), JSON.stringify(items),
            subtotal, taxTotal, discount, discountType, discountValue, total,
            status, currency, notes, terms, JSON.stringify(meta),
            clientAddress, clientGstIn, taxRate, showSignature, showBankDetails,
            now, now
        ];

        if (id) {
            result = await query(sql, params);
            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
            }
        } else {
            const insertSql = `
                INSERT INTO invoices (
                    user_id, invoice_number, type, date, due_date, client_id,
                    client_name, client_details, items, subtotal, tax_total,
                    discount, discount_type, discount_value, total,
                    status, currency, notes, terms, meta,
                    client_address, client_gst_in, tax_rate, show_signature, show_bank_details,
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
                RETURNING *;
            `;
            // Remove id from params
            params.shift();
            result = await query(insertSql, params);
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving invoice:', error);
        return NextResponse.json({ error: 'Failed to save invoice' }, { status: 500 });
    }
}
