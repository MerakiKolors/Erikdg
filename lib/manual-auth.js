// Shared password check for the private brand manual (/manual-de-marca).
// Used by middleware.js (Vercel), api/manual-acceso.js and server.mjs (local).
// Only Web APIs here so it runs on both the Edge and Node runtimes.

export const MANUAL_PREFIX = '/manual-de-marca';
export const LOGIN_PAGE = `${MANUAL_PREFIX}/acceso.html`;
export const COOKIE_NAME = 'edg_manual';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Paths under the prefix that anyone may open: the login page and its photo.
const PUBLIC_PATHS = new Set([LOGIN_PAGE, `${MANUAL_PREFIX}/acceso-fondo.jpg`]);
export function isPublicManualPath(pathname) {
  return PUBLIC_PATHS.has(pathname);
}

export function manualPassword(env = globalThis.process?.env ?? {}) {
  return (env.MANUAL_PASSWORD || '').trim();
}

const encoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// The session token is an HMAC keyed with the password, so changing the
// password in Vercel signs everyone out.
export async function sessionToken(password) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode('edg-manual-session-v1')));
}

function sameString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function passwordMatches(candidate, password) {
  if (!password || typeof candidate !== 'string') return false;
  const [a, b] = await Promise.all([sessionToken(candidate), sessionToken(password)]);
  return sameString(a, b);
}

export function readCookie(cookieHeader, name = COOKIE_NAME) {
  for (const part of (cookieHeader || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return '';
}

export async function hasValidSession(cookieHeader, password) {
  if (!password) return false;
  return sameString(readCookie(cookieHeader), await sessionToken(password));
}

export function sessionCookie(token, { secure = true } = {}) {
  return `${COOKIE_NAME}=${token}; Path=${MANUAL_PREFIX}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function clearedCookie({ secure = true } = {}) {
  return `${COOKIE_NAME}=; Path=${MANUAL_PREFIX}; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

// Only allow redirects back into the manual, never to another site.
export function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith(`${MANUAL_PREFIX}/`) || value.startsWith('//') || value.includes('\\')) {
    return `${MANUAL_PREFIX}/`;
  }
  if (value.startsWith(LOGIN_PAGE)) return `${MANUAL_PREFIX}/`;
  return value;
}

// Decides what to do with a request for a manual path.
// Returns null to let it through, or { redirect } to send it to the login page.
export async function guardManual(pathname, search, cookieHeader, password) {
  if (pathname !== MANUAL_PREFIX && !pathname.startsWith(`${MANUAL_PREFIX}/`)) return null;
  if (isPublicManualPath(pathname)) return null;
  if (await hasValidSession(cookieHeader, password)) return null;
  const next = encodeURIComponent(safeNext(pathname === MANUAL_PREFIX ? `${MANUAL_PREFIX}/` : pathname + (search || '')));
  return { redirect: `${LOGIN_PAGE}?next=${next}` };
}

// Login / logout. Works with a standard Request and returns a Response.
export async function handleManualAccess(request, { password, secure = true } = {}) {
  const url = new URL(request.url);
  const noStore = { 'Cache-Control': 'no-store' };

  if (request.method === 'GET' && url.searchParams.has('salir')) {
    return new Response(null, { status: 303, headers: { ...noStore, Location: LOGIN_PAGE, 'Set-Cookie': clearedCookie({ secure }) } });
  }
  if (request.method !== 'POST') {
    return new Response('Method not allowed.', { status: 405, headers: { ...noStore, Allow: 'POST' } });
  }

  const form = new URLSearchParams(await request.text());
  const next = safeNext(form.get('next') || '');

  if (!password) {
    return new Response(null, { status: 303, headers: { ...noStore, Location: `${LOGIN_PAGE}?error=config` } });
  }
  if (await passwordMatches(form.get('clave') || '', password)) {
    return new Response(null, { status: 303, headers: { ...noStore, Location: next, 'Set-Cookie': sessionCookie(await sessionToken(password), { secure }) } });
  }
  // Small delay to slow down guessing.
  await new Promise(r => setTimeout(r, 600));
  return new Response(null, { status: 303, headers: { ...noStore, Location: `${LOGIN_PAGE}?error=1&next=${encodeURIComponent(next)}` } });
}
