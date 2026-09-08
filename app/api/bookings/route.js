import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';
import { getAuthenticatedEmployee, getAuthenticatedPassenger } from '@/app/lib/auth';

export async function GET() {
  try {
    const employee = await getAuthenticatedEmployee();
    if (!employee) return NextResponse.json({ error: 'Sign in as staff to view all bookings.' }, { status: 401 });

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
    const passenger = await getAuthenticatedPassenger();
    if (!passenger) return NextResponse.json({ error: 'Sign in with Google to book a flight.' }, { status: 401 });

    const { flight_id } = await req.json();
    const passenger_id = passenger.p_id;
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
    const passenger = await getAuthenticatedPassenger();
    if (!passenger) return NextResponse.json({ error: 'Sign in with Google to manage bookings.' }, { status: 401 });

    const { flight_id } = await req.json();
    const passenger_id = passenger.p_id;
    await pool.query('DELETE FROM books WHERE flight_id=$1 AND passenger_id=$2', [flight_id, passenger_id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
