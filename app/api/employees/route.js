import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const r = await pool.query(`
      SELECT e.e_id, e.name, e.designation,
             STRING_AGG(ec.contact_no, ', ') AS contacts
      FROM employee e
      LEFT JOIN employee_contact ec ON e.e_id = ec.e_id
      GROUP BY e.e_id ORDER BY e.e_id
    `);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { e_id, name, designation, contacts } = await req.json();
    await pool.query('INSERT INTO employee VALUES($1,$2,$3)', [e_id, name, designation]);
    if (contacts?.length) {
      for (const c of contacts) {
        if (c.trim()) await pool.query('INSERT INTO employee_contact(e_id, contact_no) VALUES($1,$2)', [e_id, c.trim()]);
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
