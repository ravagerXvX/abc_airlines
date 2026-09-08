import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, authenticateEmployee, createAuthToken } from '@/app/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username?.trim() || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const employee = await authenticateEmployee(username.trim(), password);
    if (!employee) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const response = NextResponse.json({ employee });
    response.cookies.set(AUTH_COOKIE_NAME, createAuthToken(employee.username, 'employee'), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to sign in.' }, { status: 500 });
  }
}
