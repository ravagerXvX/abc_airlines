import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const r = await pool.query('SELECT * FROM passenger WHERE p_id=$1', [id]);
    if (!r.rows.length) return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    if (body.name) await pool.query('UPDATE passenger SET name=$1 WHERE p_id=$2', [body.name, id]);
    if (body.address) await pool.query('UPDATE passenger SET address=$1 WHERE p_id=$2', [body.address, id]);
    if (body.contact_no?.trim()) {
      await pool.query('INSERT INTO passenger_contact VALUES($1,$2) ON CONFLICT DO NOTHING', [id, body.contact_no.trim()]);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
