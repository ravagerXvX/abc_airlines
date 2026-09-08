import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';
import { getAuthenticatedEmployee } from '@/app/lib/auth';

export async function GET() {
  try {
    const employee = await getAuthenticatedEmployee();
    if (!employee) return NextResponse.json({ error: 'Sign in as staff to view passengers.' }, { status: 401 });

    const r = await pool.query(`
      SELECT p.p_id, p.name, p.address,
             STRING_AGG(DISTINCT pc.contact_no, ', ') AS contacts,
             COUNT(DISTINCT b.flight_id) AS flights_booked
      FROM passenger p
      LEFT JOIN passenger_contact pc ON p.p_id = pc.passenger_id
      LEFT JOIN books              b ON p.p_id = b.passenger_id
      GROUP BY p.p_id ORDER BY p.p_id
    `);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { p_id: providedId, name, address, contact_no } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    let p_id = providedId;
    if (!p_id) {
      const nextId = await pool.query(
        `SELECT COALESCE(MAX(CASE WHEN p_id::text ~ '^[0-9]+$' THEN p_id::text::bigint END), 0) + 1 AS p_id FROM passenger`
      );
      p_id = String(nextId.rows[0].p_id);
    }

    await pool.query('INSERT INTO passenger VALUES($1,$2,$3)', [p_id, name.trim(), address || 'Not provided']);
    if (contact_no?.trim()) {
      await pool.query('INSERT INTO passenger_contact VALUES($1,$2)', [p_id, contact_no.trim()]);
    }
    return NextResponse.json({ success: true, p_id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
