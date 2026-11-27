// Vercel Routing Middleware: only people with the brand-manual password can
// open anything under /manual-de-marca (pages, images and downloads).
import { guardManual, manualPassword } from './lib/manual-auth.js';

export const config = {
  matcher: ['/manual-de-marca', '/manual-de-marca/:path*'],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const result = await guardManual(url.pathname, url.search, request.headers.get('cookie'), manualPassword());
  if (result) {
    return new Response(null, {
      status: 307,
      headers: { Location: new URL(result.redirect, url).toString(), 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }
  // Same as next() from @vercel/functions: continue to the static file.
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}
