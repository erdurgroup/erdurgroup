// Decap CMS için GitHub OAuth aracısı (Cloudflare Worker).
// Sadece /api/auth ve /api/callback adreslerini karşılar; diğer her şey statik dosyadır.
//
// Gerekli ayarlar (Cloudflare panelinde, Settings → Variables and Secrets):
//   GITHUB_CLIENT_ID      (Secret)  GitHub OAuth App Client ID
//   GITHUB_CLIENT_SECRET  (Secret)  GitHub OAuth App Client Secret
//   ALLOWED_USERS         (Text)    Panele girebilecek GitHub kullanıcı adları, virgülle ayrılmış
//   GITHUB_SCOPE          (Text, opsiyonel) varsayılan: public_repo  (özel depo için: repo)

const enc = new TextEncoder();

function randomHex(bytes = 16) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

// Zamanlama saldırısına dayanıklı karşılaştırma
function safeEqual(a, b) {
  const x = enc.encode(a || '');
  const y = enc.encode(b || '');
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const baseHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

function page(status, title, body, extraHeaders = {}) {
  const html = `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><body style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5"><h1 style="font-size:1.25rem">${esc(title)}</h1><p>${esc(body)}</p></body></html>`;
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      ...baseHeaders,
      ...extraHeaders,
    },
  });
}

async function handleAuth(request, env, url) {
  if (!env.GITHUB_CLIENT_ID) return page(500, 'Yapılandırma eksik', 'GITHUB_CLIENT_ID tanımlı değil.');
  const state = randomHex(16);
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
  authorize.searchParams.set('scope', env.GITHUB_SCOPE || 'public_repo');
  authorize.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`,
      ...baseHeaders,
    },
  });
}

async function handleCallback(request, env, url) {
  const clearCookie = 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0';
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = getCookie(request, 'oauth_state');

  if (!code || !state || !safeEqual(state, cookieState)) {
    return page(400, 'Giriş doğrulanamadı', 'Oturum süresi dolmuş olabilir. Lütfen /admin sayfasından tekrar deneyin.', { 'Set-Cookie': clearCookie });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return page(500, 'Yapılandırma eksik', 'GitHub anahtarları tanımlı değil.', { 'Set-Cookie': clearCookie });
  }

  // 1) code → token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'erdurgroup-cms-auth' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  const token = tokenJson.access_token;
  if (!token) {
    return page(401, 'Giriş başarısız', 'GitHub erişim izni vermedi.', { 'Set-Cookie': clearCookie });
  }

  // 2) Sadece izin verilen GitHub kullanıcıları panele girebilsin
  const allowed = (env.ALLOWED_USERS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length === 0) {
    return page(500, 'Yapılandırma eksik', 'ALLOWED_USERS tanımlı değil; güvenlik için giriş kapalı.', { 'Set-Cookie': clearCookie });
  }
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'erdurgroup-cms-auth', Accept: 'application/vnd.github+json' },
  });
  const user = await userRes.json().catch(() => ({}));
  if (!user.login || !allowed.includes(String(user.login).toLowerCase())) {
    return page(403, 'Yetkiniz yok', 'Bu GitHub hesabının yönetim paneline erişim izni yok.', { 'Set-Cookie': clearCookie });
  }

  // 3) Decap CMS'in beklediği el sıkışma: popup → opener
  const nonce = randomHex(16);
  const payload = JSON.stringify({ token, provider: 'github' }).replace(/</g, '\\u003c');
  const origin = JSON.stringify(url.origin);
  const html = `<!doctype html><html lang="tr"><meta charset="utf-8"><title>Giriş yapılıyor…</title><body><p>Giriş yapılıyor…</p>
<script nonce="${nonce}">
(function () {
  var allowedOrigin = ${origin};
  function receive(e) {
    if (e.origin !== allowedOrigin) return;
    window.opener.postMessage('authorization:github:success:' + JSON.stringify(${payload}), e.origin);
    window.removeEventListener('message', receive, false);
    setTimeout(function () { window.close(); }, 300);
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', allowedOrigin);
})();
</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'`,
      'Set-Cookie': clearCookie,
      ...baseHeaders,
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/auth' && request.method === 'GET') return handleAuth(request, env, url);
    if (url.pathname === '/api/callback' && request.method === 'GET') return handleCallback(request, env, url);
    if (url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404, headers: baseHeaders });
    return env.ASSETS.fetch(request);
  },
};
