import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateGooglePassenger } from '@/app/lib/auth';

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
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
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
