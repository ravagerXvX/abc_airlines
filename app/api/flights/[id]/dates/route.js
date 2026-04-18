import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const r = await pool.query('SELECT flight_date FROM flight_dates WHERE flight_id=$1 ORDER BY flight_date', [id]);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const { dates } = await req.json();
    for (const d of dates) {
      await pool.query('INSERT INTO flight_dates VALUES($1,$2) ON CONFLICT DO NOTHING', [id, d.trim()]);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const { date } = await req.json();
    await pool.query('DELETE FROM flight_dates WHERE flight_id=$1 AND flight_date=$2', [id, date]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
