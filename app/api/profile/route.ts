import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

/**
 * GET /api/profile
 * Returns the business profile for the authenticated user.
 */
export async function GET(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query('SELECT * FROM business_profile WHERE user_id = $1', [user.userId]);
        return NextResponse.json(result.rows[0] || {});
    } catch (error) {
        console.error('Error fetching business profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

/**
 * POST /api/profile
 * Upsert the per-user business profile.
 */
export async function POST(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            businessName, ownerName, address, phone, email, gstIn,
            logo, headerStyle, defaultTaxRate, signature,
            bankDetails, fssai, showBankDetailsByDefault,
            showSignatureByDefault, toc
        } = body;

        if (!businessName) {
            return NextResponse.json({ error: 'Business Name is required' }, { status: 400 });
        }

        const now = Date.now();

        const sql = `
            INSERT INTO business_profile (
                user_id, business_name, owner_name, address, phone, email, gst_in,
                logo, header_style, default_tax_rate, signature,
                bank_details, fssai, show_bank_details_by_default,
                show_signature_by_default, toc, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (user_id) DO UPDATE SET
                business_name = EXCLUDED.business_name,
                owner_name = EXCLUDED.owner_name,
                address = EXCLUDED.address,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                gst_in = EXCLUDED.gst_in,
                logo = EXCLUDED.logo,
                header_style = EXCLUDED.header_style,
                default_tax_rate = EXCLUDED.default_tax_rate,
                signature = EXCLUDED.signature,
                bank_details = EXCLUDED.bank_details,
                fssai = EXCLUDED.fssai,
                show_bank_details_by_default = EXCLUDED.show_bank_details_by_default,
                show_signature_by_default = EXCLUDED.show_signature_by_default,
                toc = EXCLUDED.toc,
                updated_at = EXCLUDED.updated_at
            RETURNING *;
        `;

        const result = await query(sql, [
            user.userId, businessName, ownerName, address, phone, email, gstIn,
            logo, headerStyle, defaultTaxRate, signature,
            JSON.stringify(bankDetails), fssai, showBankDetailsByDefault,
            showSignatureByDefault, toc, now
        ]);

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error('Error saving business profile:', error);
        return NextResponse.json({
            error: 'Failed to save profile',
            details: error.message
        }, { status: 500 });
    }
}
