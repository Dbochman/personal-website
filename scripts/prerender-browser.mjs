// A caller may supply only a dedicated, explicitly acquired local browser.
// The caller owns its lifecycle; prerender uses a fresh context and disconnects.
export function publicationBrowserEndpoint(value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      !url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Publication CDP endpoint must be an explicit loopback HTTP port');
  }
  return url.href;
}
