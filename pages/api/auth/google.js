import passport from 'passport';
import { createOAuthState, oauthStateCookie } from '../../../app/lib/auth';
import { ensureGoogleStrategy, getGoogleCallbackUrl, runMiddleware } from '../../../app/lib/passport';

export default async function googleSignIn(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    ensureGoogleStrategy();
    const state = createOAuthState();
    res.setHeader('Set-Cookie', oauthStateCookie(state));
    await runMiddleware(req, res, passport.initialize());
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || (host?.includes('localhost') ? 'http' : 'https');
    return passport.authenticate('google', {
      scope: ['openid', 'profile', 'email'],
      session: false,
      state,
      callbackURL: getGoogleCallbackUrl(host || 'localhost:3000', protocol),
    })(req, res);
  } catch (error) {
    return res.status(503).json({ error: `Google sign-in is unavailable: ${error.message}` });
  }
}
