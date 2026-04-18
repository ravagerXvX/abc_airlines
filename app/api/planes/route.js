import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT p.*, COUNT(f.flight_id) AS flights_assigned
      FROM plane p
      LEFT JOIN flight f ON p.p_id = f.plane_id
      GROUP BY p.p_id ORDER BY p.p_id
    `);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { p_id, capacity, model_no, license_no } = await req.json();
    await pool.query('INSERT INTO plane VALUES($1,$2,$3,$4)', [p_id, capacity, model_no, license_no]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
