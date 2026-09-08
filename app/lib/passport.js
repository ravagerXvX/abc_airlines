import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateGooglePassenger } from '@/app/lib/auth';

export function getGoogleCallbackUrl(hostname = '', protocol = '') {
  if (hostname.includes('://')) {
    return `${hostname.replace(/\/$/, '')}/api/auth/google/callback`;
  }

  const host = hostname || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'localhost:3000';
  const scheme = protocol || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  return `${scheme}://${host.replace(/\/$/, '')}/api/auth/google/callback`;
}

export function ensureGoogleStrategy() {
  if (passport._strategy('google')) return;

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientID || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured.');
  }

  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL: getGoogleCallbackUrl(),
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      done(null, await findOrCreateGooglePassenger(profile));
    } catch (error) {
      done(error);
    }
  }));
}

export function runMiddleware(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => (result instanceof Error ? reject(result) : resolve(result)));
  });
}
