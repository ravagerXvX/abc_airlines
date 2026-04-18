import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    if (body.name) await pool.query('UPDATE airport SET name=$1 WHERE airport_id=$2', [body.name, id]);
    if (body.city) await pool.query('UPDATE airport SET city=$1 WHERE airport_id=$2', [body.city, id]);
    if (body.address) await pool.query('UPDATE airport SET address=$1 WHERE airport_id=$2', [body.address, id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await pool.query('DELETE FROM airport_contact WHERE airport_id=$1', [id]);
    await pool.query('DELETE FROM airport WHERE airport_id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
