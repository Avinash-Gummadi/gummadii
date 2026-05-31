import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-util';

/**
 * PATCH /api/auth/profile
 * Updates the user's profile information.
 */
export async function PATCH(req: NextRequest) {
    try {
        const { user } = getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { firstName, lastName, phone, companyName } = await req.json();

        // Build the update query dynamically
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (firstName !== undefined) {
            updates.push(`first_name = $${paramIndex++}`);
            params.push(firstName);
        }
        if (lastName !== undefined) {
            updates.push(`last_name = $${paramIndex++}`);
            params.push(lastName);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            params.push(phone);
        }
        if (companyName !== undefined) {
            updates.push(`company_name = $${paramIndex++}`);
            params.push(companyName);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        params.push(user.userId);
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const result = await query(sql, params);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updatedUser = result.rows[0];

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                phone: updatedUser.phone,
                companyName: updatedUser.company_name,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name
            }
        });

    } catch (error: any) {
        console.error('UpdateProfile Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
