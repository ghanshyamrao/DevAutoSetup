const http = require('http');
const https = require('https');
const { URL, URLSearchParams } = require('url');
const { shell } = require('electron');

const STRIPE_API = 'https://api.stripe.com';

function stripeRequest(method, pathName, formData = null) {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('STRIPE_SECRET_KEY is not configured in .env'));
  }
  return new Promise((resolve, reject) => {
    const body = formData ? new URLSearchParams(flatten(formData)).toString() : '';
    const u = new URL(pathName, STRIPE_API);
    const req = https.request(
      {
        method,
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data || '{}');
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(json);
            else reject(new Error(json?.error?.message || `Stripe HTTP ${res.statusCode}`));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Convert nested form params like {line_items: [{price: 'x', quantity: 1}]} into
// Stripe's bracketed style: line_items[0][price]=x&line_items[0][quantity]=1
function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const composedKey = prefix ? `${prefix}[${key}]` : key;
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === 'object') flatten(item, `${composedKey}[${i}]`, out);
        else out[`${composedKey}[${i}]`] = String(item);
      });
    } else if (typeof value === 'object') {
      flatten(value, composedKey, out);
    } else {
      out[composedKey] = String(value);
    }
  }
  return out;
}

function createCheckoutSession({ priceId, mode, customerEmail, clientReferenceId, successUrl, cancelUrl, metadata }) {
  return stripeRequest('POST', '/v1/checkout/sessions', {
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: clientReferenceId,
    customer_email: customerEmail,
    metadata: metadata || {},
    ...(mode === 'subscription' ? { subscription_data: { metadata: metadata || {} } } : {}),
  });
}

function retrieveSession(sessionId) {
  return stripeRequest('GET', `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

const COMPLETION_HTML = (heading, body) => `<!doctype html><html><head><meta charset="utf-8"><title>${heading}</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1117;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#1a1d27;border:1px solid #2a2f3a;padding:32px 40px;border-radius:12px;text-align:center;max-width:460px}
h1{margin:0 0 8px;font-size:20px}p{margin:0;color:#9ca3af;line-height:1.5}</style></head>
<body><div class="card"><h1>${heading}</h1><p>${body}</p></div></body></html>`;

const ERROR_HTML = (msg) => `<!doctype html><html><head><meta charset="utf-8"><title>Payment verification failed</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1117;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#1a1d27;border:1px solid #ef4444;padding:32px 40px;border-radius:12px;text-align:center;max-width:460px}
h1{margin:0 0 8px;font-size:20px;color:#ef4444}p{margin:0;color:#9ca3af;line-height:1.5}</style></head>
<body><div class="card"><h1>Payment verification failed</h1><p>${msg}</p></div></body></html>`;

/**
 * Start a verified Stripe checkout flow.
 * - Spins up a one-shot loopback HTTP server.
 * - Asks Stripe to create a Checkout Session with success_url pointing at the loopback.
 * - Opens the Stripe-hosted checkout page in the user's default browser.
 * - When Stripe redirects back, retrieves the session via the Stripe API to verify
 *   `payment_status === 'paid'` and `client_reference_id === user.id` BEFORE resolving.
 *
 * Resolves with: { status: 'paid' | 'cancelled' | 'timeout', session?, error? }
 */
async function startVerifiedCheckout({ priceId, mode, user, planId }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try { server.close(); } catch (_) { }
      clearTimeout(timeout);
      resolve(value);
    };

    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://${req.headers.host}`);
        if (reqUrl.pathname === '/cancel') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(COMPLETION_HTML('Checkout cancelled', 'You can close this tab and return to DevOnboard.'));
          finish({ status: 'cancelled' });
          return;
        }
        if (reqUrl.pathname !== '/success') {
          res.writeHead(404); res.end('Not found');
          return;
        }
        const sessionId = reqUrl.searchParams.get('session_id');
        if (!sessionId) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML('Missing session_id on callback.'));
          finish({ status: 'error', error: 'Missing session_id' });
          return;
        }
        const session = await retrieveSession(sessionId);
        const paid = session.status === 'complete' &&
          (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
        const refMatches = session.client_reference_id === user.id;
        if (!paid || !refMatches) {
          res.writeHead(402, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML(
            !refMatches
              ? 'Payment was for a different user. Activation refused.'
              : `Payment not completed (status: ${session.payment_status || session.status}).`
          ));
          finish({ status: 'unpaid', session });
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(COMPLETION_HTML('Payment verified', 'Your plan is now active. You can close this tab and return to DevOnboard.'));
        finish({ status: 'paid', session });
      } catch (err) {
        try {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML(String(err && err.message ? err.message : err)));
        } catch (_) { }
        finish({ status: 'error', error: err && err.message ? err.message : String(err) });
      }
    });

    server.on('error', (err) => {
      if (!settled) reject(err);
    });

    server.listen(0, '127.0.0.1', async () => {
      try {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        const successUrl = `http://localhost:${port}/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `http://localhost:${port}/cancel`;
        const session = await createCheckoutSession({
          priceId,
          mode,
          customerEmail: user.email,
          clientReferenceId: user.id,
          successUrl,
          cancelUrl,
          metadata: { app_user_id: user.id, plan_id: planId },
        });
        if (!session.url) throw new Error('Stripe did not return a checkout URL');
        await shell.openExternal(session.url);
      } catch (err) {
        finish({ status: 'error', error: err && err.message ? err.message : String(err) });
      }
    });

    const timeout = setTimeout(() => finish({ status: 'timeout' }), 15 * 60 * 1000);
  });
}

module.exports = { startVerifiedCheckout, retrieveSession };
