import passport from 'passport';
import { createOAuthState, oauthStateCookie } from '../../../app/lib/auth';
import { ensureGoogleStrategy, runMiddleware } from '../../../app/lib/passport';

export default async function googleSignIn(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    ensureGoogleStrategy();
    const state = createOAuthState();
    res.setHeader('Set-Cookie', oauthStateCookie(state));
    await runMiddleware(req, res, passport.initialize());
    return passport.authenticate('google', {
      scope: ['openid', 'profile', 'email'],
      session: false,
      state,
    })(req, res);
  } catch (error) {
    return res.status(503).json({ error: `Google sign-in is unavailable: ${error.message}` });
  }
}
