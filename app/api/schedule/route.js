import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT f.flight_id, src.name AS from_city, dst.name AS to_city,
             f.departure_time, f.arrival_time,
             fd.flight_date, pl.model_no AS plane
      FROM flight_dates fd
      JOIN flight  f   ON fd.flight_id          = f.flight_id
      JOIN airport src ON f.source_airport_id   = src.airport_id
      JOIN airport dst ON f.dest_airport_id     = dst.airport_id
      JOIN plane   pl  ON f.plane_id            = pl.p_id
      ORDER BY fd.flight_date, f.flight_id
    `);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
