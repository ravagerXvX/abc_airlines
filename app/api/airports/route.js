import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT a.airport_id, a.name, a.city, a.address,
             COALESCE(STRING_AGG(ac.contact_no, ', '), '') AS contacts
      FROM airport a
      LEFT JOIN airport_contact ac ON a.airport_id = ac.airport_id
      GROUP BY a.airport_id ORDER BY a.airport_id
    `);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { airport_id, name, city, address, contacts } = await req.json();
    await pool.query('INSERT INTO airport VALUES ($1,$2,$3,$4)', [airport_id, name, city, address]);
    if (contacts?.length) {
      for (const c of contacts) {
        if (c.trim()) await pool.query('INSERT INTO airport_contact VALUES($1,$2) ON CONFLICT DO NOTHING', [airport_id, c.trim()]);
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
