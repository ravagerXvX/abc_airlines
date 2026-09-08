import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';
import { getAuthenticatedPassenger } from '@/app/lib/auth';

export async function GET(req, { params }) {
  try {
    const passenger = await getAuthenticatedPassenger();
    if (!passenger) return NextResponse.json({ error: 'Sign in with Google to view your profile.' }, { status: 401 });

    const { id } = params;
    if (String(id) !== String(passenger.p_id)) {
      return NextResponse.json({ error: 'You can only view your own profile.' }, { status: 403 });
    }
    const r = await pool.query('SELECT * FROM passenger WHERE p_id=$1', [id]);
    if (!r.rows.length) return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const passenger = await getAuthenticatedPassenger();
    if (!passenger) return NextResponse.json({ error: 'Sign in with Google to update your profile.' }, { status: 401 });

    const { id } = params;
    if (String(id) !== String(passenger.p_id)) {
      return NextResponse.json({ error: 'You can only update your own profile.' }, { status: 403 });
    }
    const body = await req.json();
    const address = body.address?.trim();
    const contactNo = body.contact_no?.trim();
    if (body.name) await pool.query('UPDATE passenger SET name=$1 WHERE p_id=$2', [body.name, id]);
    if (address) await pool.query('UPDATE passenger SET address=$1 WHERE p_id=$2', [address, id]);
    if (contactNo) {
      await pool.query('INSERT INTO passenger_contact VALUES($1,$2) ON CONFLICT DO NOTHING', [id, contactNo]);
    }
    const updated = await getAuthenticatedPassenger();
    return NextResponse.json({ success: true, passenger: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
