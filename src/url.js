/**
 * Express.js middleware which adds utility methods to the Request object.
 *
 * Adds the following methods:
 *  - Request.fullURL()       get full request URL
 *  - Request.superURL()      get URL ending in slash
 *
 * @returns {function}
 */
export default function url() {
  return function url(req, res, next) {
    Object.assign(req, {fullURL, superURL});
    next();
  };
}

/**
 * Return the full requested URL.
 * @returns {URL}
 */
function fullURL() {
  const {protocol, originalUrl} = this;
  const host = this.get("Host");
  return new URL(`${protocol}://${host}${originalUrl}`);
}

/**
 * Return the requested URL with its query stripped and with a terminating
 * slash.  This can be used to append a relative sub-resource URI path to the
 * current URL.
 */
function superURL() {
  const url = this.fullURL();

  // strip query
  url.search = "";

  // append slash if needed
  if (!url.pathname.endsWith("/")) {
    url.pathname += "/";
  }

  return url;
}
