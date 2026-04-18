import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const r = await pool.query(`
      SELECT f.flight_id, src.name AS from_city, dst.name AS to_city,
             f.departure_time, f.arrival_time
      FROM works_on wo
      JOIN flight  f   ON wo.flight_id = f.flight_id
      JOIN airport src ON f.source_airport_id = src.airport_id
      JOIN airport dst ON f.dest_airport_id   = dst.airport_id
      WHERE wo.e_id = $1 ORDER BY f.flight_id
    `, [id]);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
