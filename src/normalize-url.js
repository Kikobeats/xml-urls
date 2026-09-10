'use strict'

const NORMALIZABLE_PROTOCOLS = new Set(['http:', 'https:', 'file:'])

const REGEX_DUPLICATE_SLASHES = /(?<!\b[a-z][a-z\d+\-.]{1,50}:)\/{2,}/g

const REGEX_TEXT_FRAGMENT = /#?:~:text.*?$/i

const REGEX_TRACKING_PARAM = /^utm_\w+/i

const REGEX_TRAILING_DOT = /\.$/

const parseUrl = (input, baseUrl) => {
  try {
    return new URL(input, baseUrl)
  } catch (_) {}
}

const decodePathname = pathname => {
  try {
    return decodeURI(pathname).replaceAll('\\', '%5C')
  } catch (_) {
    return pathname
  }
}

const isTrackingParam = param => REGEX_TRACKING_PARAM.test(param.split('=', 1)[0])

const removeTrackingParams = search => {
  const params = search
    .slice(1)
    .split('&')
    .filter(param => param && !isTrackingParam(param))
  return params.length === 0 ? '' : `?${params.join('&')}`
}

const normalizeUrl = (input, baseUrl) => {
  const url = parseUrl(input, baseUrl)
  if (!url) return
  if (!NORMALIZABLE_PROTOCOLS.has(url.protocol)) return url.href

  url.username = ''
  url.password = ''
  url.hash = url.hash.replace(REGEX_TEXT_FRAGMENT, '')
  url.pathname = decodePathname(url.pathname.replace(REGEX_DUPLICATE_SLASHES, '/'))
  url.hostname = url.hostname.replace(REGEX_TRAILING_DOT, '')
  url.search = removeTrackingParams(url.search)

  return url.href
}

module.exports = normalizeUrl
module.exports.parseUrl = parseUrl
