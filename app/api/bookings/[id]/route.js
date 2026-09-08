import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';
import { getAuthenticatedPassenger } from '@/app/lib/auth';

export async function GET(req, { params }) {
  try {
    const passenger = await getAuthenticatedPassenger();
    if (!passenger) return NextResponse.json({ error: 'Sign in with Google to view bookings.' }, { status: 401 });

    const { id } = params;
    if (String(id) !== String(passenger.p_id)) {
      return NextResponse.json({ error: 'You can only view your own bookings.' }, { status: 403 });
    }
    const r = await pool.query(`
      SELECT f.flight_id,
             src.name AS from_city, dst.name AS to_city,
             f.departure_time, f.arrival_time,
             pl.model_no AS plane
      FROM books b
      JOIN flight  f   ON b.flight_id          = f.flight_id
      JOIN airport src ON f.source_airport_id   = src.airport_id
      JOIN airport dst ON f.dest_airport_id     = dst.airport_id
      JOIN plane   pl  ON f.plane_id            = pl.p_id
      WHERE b.passenger_id = $1
      ORDER BY f.flight_id
    `, [id]);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
