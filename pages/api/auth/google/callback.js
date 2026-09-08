import passport from 'passport';
import {
  AUTH_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  authCookie,
  createAuthToken,
  isValidOAuthState,
  oauthStateCookie,
} from '../../../../app/lib/auth';
import { ensureGoogleStrategy, runMiddleware } from '../../../../app/lib/passport';

function clearCookie(name) {
  return name === AUTH_COOKIE_NAME ? authCookie('', 0) : oauthStateCookie('', 0);
}

export default async function googleCallback(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const stateCookie = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
  if (!state || state !== stateCookie || !isValidOAuthState(state)) {
    res.setHeader('Set-Cookie', clearCookie(OAUTH_STATE_COOKIE_NAME));
    return res.redirect(302, '/passenger?auth=state-error');
  }

  try {
    ensureGoogleStrategy();
    await runMiddleware(req, res, passport.initialize());
    return passport.authenticate('google', { session: false }, (error, user) => {
      if (error || !user) {
        res.setHeader('Set-Cookie', clearCookie(OAUTH_STATE_COOKIE_NAME));
        return res.redirect(302, '/passenger?auth=error');
      }

      res.setHeader('Set-Cookie', [
        authCookie(createAuthToken(user.userId)),
        clearCookie(OAUTH_STATE_COOKIE_NAME),
      ]);
      return res.redirect(302, '/passenger?auth=success');
    })(req, res);
  } catch {
    res.setHeader('Set-Cookie', clearCookie(OAUTH_STATE_COOKIE_NAME));
    return res.redirect(302, '/passenger?auth=error');
  }
}
