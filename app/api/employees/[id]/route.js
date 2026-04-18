import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    if (body.name) await pool.query('UPDATE employee SET name=$1 WHERE e_id=$2', [body.name, id]);
    if (body.designation) await pool.query('UPDATE employee SET designation=$1 WHERE e_id=$2', [body.designation, id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await pool.query('DELETE FROM employee_contact WHERE e_id=$1', [id]);
    await pool.query('DELETE FROM works_on         WHERE e_id=$1', [id]);
    await pool.query('DELETE FROM employee          WHERE e_id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
