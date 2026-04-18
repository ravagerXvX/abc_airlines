import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT f.flight_id,
             src.name AS source, dst.name AS destination,
             f.departure_time, f.arrival_time,
             p.model_no AS plane,
             p.capacity,
             COUNT(DISTINCT fd.flight_date) AS dates_scheduled,
             COUNT(DISTINCT b.passenger_id)  AS passengers_booked
      FROM flight f
      JOIN airport src ON f.source_airport_id = src.airport_id
      JOIN airport dst ON f.dest_airport_id   = dst.airport_id
      JOIN plane   p   ON f.plane_id          = p.p_id
      LEFT JOIN flight_dates fd ON f.flight_id = fd.flight_id
      LEFT JOIN books        b  ON f.flight_id = b.flight_id
      GROUP BY f.flight_id, src.name, dst.name, f.departure_time, f.arrival_time, p.model_no, p.capacity
      ORDER BY f.flight_id
    `);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { flight_id, arrival_time, departure_time, source_airport_id, dest_airport_id, plane_id, dates } = await req.json();
    await pool.query(
      'INSERT INTO flight(flight_id,arrival_time,departure_time,source_airport_id,dest_airport_id,plane_id) VALUES($1,$2,$3,$4,$5,$6)',
      [flight_id, arrival_time, departure_time, source_airport_id, dest_airport_id, plane_id]
    );
    if (dates?.length) {
      for (const d of dates) {
        if (d.trim()) await pool.query('INSERT INTO flight_dates VALUES($1,$2) ON CONFLICT DO NOTHING', [flight_id, d.trim()]);
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
