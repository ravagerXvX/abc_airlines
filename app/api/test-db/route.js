import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const r = await pool.query('SELECT 1 as connected');
    return NextResponse.json({ status: 'ok', message: 'Connected to database!', result: r.rows });
  } catch (e) {
    return NextResponse.json({ 
      status: 'error', 
      message: e.message,
      hint: 'Check PG_HOST, PG_PASSWORD, and SSL settings in .env.local'
    }, { status: 500 });
  }
}
