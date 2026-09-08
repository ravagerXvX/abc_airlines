import { NextResponse } from 'next/server';
import { getAuthenticatedEmployee, getAuthenticatedPassenger } from '@/app/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const employee = await getAuthenticatedEmployee();
    if (employee) return NextResponse.json({ role: 'employee', employee });

    const passenger = await getAuthenticatedPassenger();
    if (passenger) return NextResponse.json({ role: 'passenger', passenger });

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Unable to read your sign-in session' }, { status: 500 });
  }
}
