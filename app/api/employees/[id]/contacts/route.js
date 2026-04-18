import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const r = await pool.query('SELECT contact_no FROM employee_contact WHERE e_id=$1', [id]);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const { contact_no } = await req.json();
    await pool.query('INSERT INTO employee_contact(e_id, contact_no) VALUES($1,$2)', [id, contact_no]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const { contact_no } = await req.json();
    await pool.query('DELETE FROM employee_contact WHERE e_id=$1 AND contact_no=$2', [id, contact_no]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
