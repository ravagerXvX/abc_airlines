import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const r = await pool.query(`
      SELECT f.flight_id,
             src.name AS source, src.city AS source_city,
             dst.name AS destination, dst.city AS dest_city,
             f.departure_time, f.arrival_time,
             pl.model_no AS plane, pl.capacity,
             f.source_airport_id, f.dest_airport_id, f.plane_id
      FROM flight f
      JOIN airport src ON f.source_airport_id = src.airport_id
      JOIN airport dst ON f.dest_airport_id   = dst.airport_id
      JOIN plane   pl  ON f.plane_id          = pl.p_id
      WHERE f.flight_id = $1
    `, [id]);
    if (!r.rows.length) return NextResponse.json({ error: 'Flight not found' }, { status: 404 });

    const dates = await pool.query('SELECT flight_date FROM flight_dates WHERE flight_id=$1 ORDER BY flight_date', [id]);
    const crew = await pool.query(`
      SELECT e.name, e.designation FROM works_on wo
      JOIN employee e ON wo.e_id = e.e_id WHERE wo.flight_id=$1
    `, [id]);

    return NextResponse.json({
      ...r.rows[0],
      dates: dates.rows.map(d => d.flight_date),
      crew: crew.rows
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    if (body.arrival_time) await pool.query('UPDATE flight SET arrival_time=$1 WHERE flight_id=$2', [body.arrival_time, id]);
    if (body.departure_time) await pool.query('UPDATE flight SET departure_time=$1 WHERE flight_id=$2', [body.departure_time, id]);
    if (body.plane_id) await pool.query('UPDATE flight SET plane_id=$1 WHERE flight_id=$2', [body.plane_id, id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await pool.query('DELETE FROM works_on     WHERE flight_id=$1', [id]);
    await pool.query('DELETE FROM books        WHERE flight_id=$1', [id]);
    await pool.query('DELETE FROM flight_dates WHERE flight_id=$1', [id]);
    await pool.query('DELETE FROM flight       WHERE flight_id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
