import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
    const { p_id, name, address, contact_no } = await req.json();
    await pool.query('INSERT INTO passenger VALUES($1,$2,$3)', [p_id, name, address]);
    if (contact_no?.trim()) {
      await pool.query('INSERT INTO passenger_contact VALUES($1,$2)', [p_id, contact_no.trim()]);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
