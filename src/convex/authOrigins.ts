/** Exact app origins only; never trust every site on a hosting provider. */
export function getAuthOrigins(siteUrl: string, additionalOrigins = '') {
  return [
    ...new Set(
      [siteUrl, ...additionalOrigins.split(',')].map((value) => value.trim()).filter(Boolean)
    )
  ].map((value) => {
    const url = new URL(value);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (
      url.hostname.includes('*') ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
    ) {
      throw new Error('Auth origins must be HTTPS origins (HTTP is allowed for localhost).');
    }
    return url.origin;
  });
}
