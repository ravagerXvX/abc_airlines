import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import pool from '@/app/lib/db';

export const AUTH_COOKIE_NAME = 'abc_airlines_auth';
export const OAUTH_STATE_COOKIE_NAME = 'abc_airlines_oauth_state';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;
let schemaPromise;

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SESSION_SECRET must be set to a value of at least 32 characters.');
  }
  return secret;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signedPayload(payload) {
  const encoded = encode(payload);
  return `${encoded}.${sign(encoded)}`;
}

function readSignedPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length || !safeEqual(signature, sign(encoded))) return null;

  try {
    return decode(encoded);
  } catch {
    return null;
  }
}

export function createOAuthState() {
  const now = Math.floor(Date.now() / 1000);
  return signedPayload({ nonce: crypto.randomUUID(), iat: now, exp: now + OAUTH_STATE_MAX_AGE_SECONDS });
}

export function isValidOAuthState(state) {
  const payload = readSignedPayload(state);
  return Boolean(payload?.nonce && payload.exp > Math.floor(Date.now() / 1000));
}

export function createAuthToken(userId, role = 'passenger') {
  const now = Math.floor(Date.now() / 1000);
  return signedPayload({ sub: userId, role, iat: now, exp: now + SESSION_MAX_AGE_SECONDS });
}

function getSessionPayload(token) {
  const payload = readSignedPayload(token);
  if (!payload?.sub || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function authCookie(value, maxAge = SESSION_MAX_AGE_SECONDS) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function oauthStateCookie(value, maxAge = OAUTH_STATE_MAX_AGE_SECONDS) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function mapPassenger(row) {
  if (!row) return null;
  const address = (row.address || '').trim();
  const contacts = (row.contacts || '').trim();
  return {
    ...row,
    address: address || null,
    contacts: contacts || null,
    needs_profile: !address || address === 'Not provided' || !contacts,
  };
}

async function seedDefaultEmployeeAccount() {
  const username = process.env.EMPLOYEE_USERNAME?.trim();
  const password = process.env.EMPLOYEE_PASSWORD;
  if (!username || !password) return;

  const existing = await pool.query(
    'SELECT username FROM employee_accounts WHERE username = $1',
    [username],
  );
  if (existing.rows.length) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO employee_accounts (username, password_hash, display_name) VALUES ($1, $2, $3)',
    [username, passwordHash, 'Airline staff'],
  );
}

async function ensureAuthSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS google_auth_accounts (
          google_id TEXT PRIMARY KEY,
          user_id UUID NOT NULL UNIQUE,
          passenger_id TEXT NOT NULL UNIQUE,
          email TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS employee_accounts (
          username TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          display_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS passenger_accounts (
          username TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          passenger_id TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await seedDefaultEmployeeAccount();
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

async function getPassengerByUserId(userId) {
  const result = await pool.query(`
    SELECT p.p_id, p.name, p.address, a.email,
           STRING_AGG(DISTINCT pc.contact_no, ', ') AS contacts
    FROM google_auth_accounts a
    JOIN passenger p ON p.p_id::text = a.passenger_id
    LEFT JOIN passenger_contact pc ON pc.passenger_id = p.p_id
    WHERE a.user_id = $1
    GROUP BY p.p_id, p.name, p.address, a.email
  `, [userId]);
  return mapPassenger(result.rows[0]);
}

/**
 * Creates the airline account exactly once for a Google identity.  The stable
 * passenger ID is generated server-side, then reused on all later logins.
 */
export async function findOrCreateGooglePassenger(profile) {
  await ensureAuthSchema();

  const googleId = profile?.id;
  if (!googleId) throw new Error('Google did not return an account identifier.');

  const existing = await pool.query(`
    SELECT a.user_id, p.p_id, p.name, p.address, a.email,
           STRING_AGG(DISTINCT pc.contact_no, ', ') AS contacts
    FROM google_auth_accounts a
    JOIN passenger p ON p.p_id::text = a.passenger_id
    LEFT JOIN passenger_contact pc ON pc.passenger_id = p.p_id
    WHERE a.google_id = $1
    GROUP BY a.user_id, p.p_id, p.name, p.address, a.email
  `, [googleId]);
  if (existing.rows[0]) {
    return { userId: existing.rows[0].user_id, passenger: mapPassenger(existing.rows[0]) };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Prevent duplicate generated numeric IDs while two new Google users sign in together.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('abc-airlines-google-passenger-id'))");

    const again = await client.query(`
      SELECT a.user_id, p.p_id, p.name, p.address, a.email,
             STRING_AGG(DISTINCT pc.contact_no, ', ') AS contacts
      FROM google_auth_accounts a
      JOIN passenger p ON p.p_id::text = a.passenger_id
      LEFT JOIN passenger_contact pc ON pc.passenger_id = p.p_id
      WHERE a.google_id = $1
      GROUP BY a.user_id, p.p_id, p.name, p.address, a.email
    `, [googleId]);
    if (again.rows[0]) {
      await client.query('COMMIT');
      return { userId: again.rows[0].user_id, passenger: mapPassenger(again.rows[0]) };
    }

    const nextId = await client.query(`
      SELECT COALESCE(MAX(CASE WHEN p_id::text ~ '^[0-9]+$' THEN p_id::text::bigint END), 0) + 1 AS p_id
      FROM passenger
    `);
    const passengerId = String(nextId.rows[0].p_id);
    const email = profile.emails?.[0]?.value || null;
    const name = profile.displayName?.trim() || email || 'Google passenger';
    const userId = crypto.randomUUID();

    await client.query(
      'INSERT INTO passenger (p_id, name, address) VALUES ($1, $2, $3)',
      [passengerId, name, 'Not provided'],
    );
    await client.query(
      'INSERT INTO google_auth_accounts (google_id, user_id, passenger_id, email) VALUES ($1, $2, $3, $4)',
      [googleId, userId, passengerId, email],
    );
    await client.query('COMMIT');

    return {
      userId,
      passenger: mapPassenger({ p_id: passengerId, name, address: 'Not provided', email, contacts: null }),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getPassengerByPId(pId) {
  const result = await pool.query(`
    SELECT p.p_id, p.name, p.address,
           STRING_AGG(DISTINCT pc.contact_no, ', ') AS contacts
    FROM passenger p
    LEFT JOIN passenger_contact pc ON pc.passenger_id = p.p_id
    WHERE p.p_id::text = $1
    GROUP BY p.p_id, p.name, p.address
  `, [pId]);
  return mapPassenger(result.rows[0]);
}

export async function getAuthenticatedPassenger() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const payload = getSessionPayload(token);
  if (!payload || (payload.role && payload.role !== 'passenger')) return null;

  await ensureAuthSchema();

  // Try Google auth first (sub is a UUID user_id)
  const googlePassenger = await getPassengerByUserId(payload.sub);
  if (googlePassenger) return googlePassenger;

  // Try manual auth (sub is passenger_id)
  return getPassengerByPId(payload.sub);
}

export async function registerPassengerAccount(username, password, name, address, contact_no) {
  await ensureAuthSchema();

  const existing = await pool.query(
    'SELECT username FROM passenger_accounts WHERE username = $1',
    [username],
  );
  if (existing.rows.length) {
    throw new Error('This username is already taken.');
  }

  // Auto-generate passenger ID
  const nextId = await pool.query(
    `SELECT COALESCE(MAX(CASE WHEN p_id::text ~ '^[0-9]+$' THEN p_id::text::bigint END), 0) + 1 AS p_id FROM passenger`
  );
  const passengerId = String(nextId.rows[0].p_id);
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query('INSERT INTO passenger VALUES($1,$2,$3)', [passengerId, name, address || 'Not provided']);
  if (contact_no?.trim()) {
    await pool.query('INSERT INTO passenger_contact VALUES($1,$2)', [passengerId, contact_no.trim()]);
  }
  await pool.query(
    'INSERT INTO passenger_accounts (username, password_hash, passenger_id) VALUES ($1, $2, $3)',
    [username, passwordHash, passengerId],
  );

  return { passengerId, passenger: mapPassenger({ p_id: passengerId, name, address: address || 'Not provided', contacts: contact_no || null }) };
}

export async function authenticatePassengerAccount(username, password) {
  await ensureAuthSchema();

  const result = await pool.query(
    'SELECT username, password_hash, passenger_id FROM passenger_accounts WHERE username = $1',
    [username],
  );
  const account = result.rows[0];
  if (!account) return null;

  const matches = await bcrypt.compare(password, account.password_hash);
  if (!matches) return null;

  const passenger = await getPassengerByPId(account.passenger_id);
  return { passengerId: account.passenger_id, passenger };
}

export async function getAuthenticatedEmployee() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const payload = getSessionPayload(token);
  if (!payload || payload.role !== 'employee') return null;

  await ensureAuthSchema();
  const result = await pool.query(
    'SELECT username, display_name FROM employee_accounts WHERE username = $1',
    [payload.sub],
  );
  return result.rows[0] || null;
}

export async function authenticateEmployee(username, password) {
  await ensureAuthSchema();

  const result = await pool.query(
    'SELECT username, password_hash, display_name FROM employee_accounts WHERE username = $1',
    [username],
  );
  const account = result.rows[0];
  if (!account) return null;

  const matches = await bcrypt.compare(password, account.password_hash);
  if (!matches) return null;

  return { username: account.username, display_name: account.display_name };
}
