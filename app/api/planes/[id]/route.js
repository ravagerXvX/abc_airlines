import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    if (body.capacity) await pool.query('UPDATE plane SET capacity=$1 WHERE p_id=$2', [body.capacity, id]);
    if (body.model_no) await pool.query('UPDATE plane SET model_no=$1 WHERE p_id=$2', [body.model_no, id]);
    if (body.license_no) await pool.query('UPDATE plane SET license_no=$1 WHERE p_id=$2', [body.license_no, id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await pool.query('DELETE FROM plane WHERE p_id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
