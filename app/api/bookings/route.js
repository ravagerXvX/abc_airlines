import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT b.flight_id, p.name AS passenger, p.p_id,
             src.name AS from_city, dst.name AS to_city,
             f.departure_time, f.arrival_time
      FROM books b
      JOIN passenger p   ON b.passenger_id     = p.p_id
      JOIN flight    f   ON b.flight_id         = f.flight_id
      JOIN airport   src ON f.source_airport_id = src.airport_id
      JOIN airport   dst ON f.dest_airport_id   = dst.airport_id
      ORDER BY b.flight_id, p.name
    `);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { flight_id, passenger_id } = await req.json();
    const check = await pool.query('SELECT * FROM books WHERE flight_id=$1 AND passenger_id=$2', [flight_id, passenger_id]);
    if (check.rows.length) {
      return NextResponse.json({ error: 'You already have a booking on this flight!' }, { status: 409 });
    }
    await pool.query('INSERT INTO books VALUES($1,$2)', [flight_id, passenger_id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { flight_id, passenger_id } = await req.json();
    await pool.query('DELETE FROM books WHERE flight_id=$1 AND passenger_id=$2', [flight_id, passenger_id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
