import { defineConfig, type Plugin } from 'vite';

/**
 * Strict Content-Security-Policy for production builds: the app may load only its own files
 * and may not contact any server. When a backend is added, list its origin in connect-src.
 * (Applied at build time only, because the dev server injects inline styles for hot reload.)
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const cspPlugin = (): Plugin => ({
  name: 'bloom-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

export default defineConfig({
  base: './',
  plugins: [cspPlugin()],
});
