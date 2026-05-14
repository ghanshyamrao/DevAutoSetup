const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');
const path = require('path');
const fs = require('fs');
const { shell } = require('electron');

function loadOAuthConfig() {
  const configPath = path.join(__dirname, 'google-oauth-config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pkcePair() {
  const verifier = base64UrlEncode(crypto.randomBytes(32));
  const challenge = base64UrlEncode(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function buildAuthUrl(cfg, redirectUri, state, challenge) {
  const url = new URL(cfg.auth_uri);
  url.searchParams.set('client_id', cfg.client_id);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', cfg.scopes.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

function postForm(targetUrl, formData) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(formData).toString();
    const u = new URL(targetUrl);
    const req = https.request(
      {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data || '{}');
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(json);
            else reject(new Error(json.error_description || json.error || `HTTP ${res.statusCode}`));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(targetUrl, accessToken) {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const req = https.request(
      {
        method: 'GET',
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data || '{}');
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(json);
            else reject(new Error(json.error_description || json.error || `HTTP ${res.statusCode}`));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const SUCCESS_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Signed in</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1117;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#1a1d27;border:1px solid #2a2f3a;padding:32px 40px;border-radius:12px;text-align:center;max-width:420px}
h1{margin:0 0 8px;font-size:20px}p{margin:0;color:#9ca3af;line-height:1.5}</style></head>
<body><div class="card"><h1>You're signed in</h1><p>You can close this tab and return to DevOnboard.</p></div></body></html>`;

const ERROR_HTML = (msg) => `<!doctype html><html><head><meta charset="utf-8"><title>Sign-in failed</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1117;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#1a1d27;border:1px solid #ef4444;padding:32px 40px;border-radius:12px;text-align:center;max-width:420px}
h1{margin:0 0 8px;font-size:20px;color:#ef4444}p{margin:0;color:#9ca3af;line-height:1.5}</style></head>
<body><div class="card"><h1>Sign-in failed</h1><p>${msg}</p></div></body></html>`;

async function startGoogleSignIn() {
  const cfg = loadOAuthConfig();
  const state = base64UrlEncode(crypto.randomBytes(16));
  const { verifier, challenge } = pkcePair();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      try { server.close(); } catch (_) { }
      clearTimeout(timeout);
      fn(value);
    };

    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://${req.headers.host}`);
        if (reqUrl.pathname !== '/' && reqUrl.pathname !== '/callback') {
          res.writeHead(404); res.end('Not found');
          return;
        }
        const error = reqUrl.searchParams.get('error');
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML(error));
          finish(reject, new Error(error));
          return;
        }
        const code = reqUrl.searchParams.get('code');
        const returnedState = reqUrl.searchParams.get('state');
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML('Missing authorization code.'));
          finish(reject, new Error('Missing authorization code'));
          return;
        }
        if (returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML('State mismatch - possible CSRF.'));
          finish(reject, new Error('State mismatch'));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(SUCCESS_HTML);

        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        const redirectUri = `http://localhost:${port}`;
        const tokens = await postForm(cfg.token_uri, {
          code,
          client_id: cfg.client_id,
          client_secret: cfg.client_secret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: verifier,
        });
        const profile = await getJson(cfg.userinfo_uri, tokens.access_token);
        finish(resolve, {
          user: {
            id: profile.sub,
            email: profile.email,
            name: profile.name || profile.email,
            picture: profile.picture || null,
            email_verified: !!profile.email_verified,
          },
          tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            id_token: tokens.id_token || null,
            expires_in: tokens.expires_in || null,
            obtained_at: Date.now(),
          },
        });
      } catch (err) {
        try {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML(String(err && err.message ? err.message : err)));
        } catch (_) { }
        finish(reject, err instanceof Error ? err : new Error(String(err)));
      }
    });

    server.on('error', (err) => finish(reject, err));
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const redirectUri = `http://localhost:${port}`;
      const authUrl = buildAuthUrl(cfg, redirectUri, state, challenge);
      shell.openExternal(authUrl).catch((err) => finish(reject, err));
    });

    const timeout = setTimeout(() => finish(reject, new Error('Sign-in timed out')), 5 * 60 * 1000);
  });
}

module.exports = { startGoogleSignIn };
