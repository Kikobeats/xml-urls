'use strict'

const { uniq, concat, isEmpty } = require('lodash')
const getHTML = require('html-get')
const cheerio = require('cheerio')
const matcher = require('matcher')
const aigle = require('aigle')
const { URL } = require('url')
const path = require('path')

const { normalizeUrl } = require('@metascraper/helpers')

const REGEX_URL_XML = /^\.xml$/i
const XML_SELECTOR = 'loc'

const REGEX_PROTOCOL = /^[a-z][a-z\d+\-.]*:\/\//i
const REGEX_ROBOTS_SITEMAP = /^[^\S\r\n]*sitemap[^\S\r\n]*:[^\S\r\n]*(\S+)/gim
const REGEX_SITEMAP_ROOT_TAG = /<(?:urlset|sitemapindex)[\s>]/i

const WELL_KNOWN_SITEMAP_PATHNAMES = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap-index.xml',
  '/sitemap/sitemap.xml',
  '/sitemap/index.xml',
  '/wp-sitemap.xml'
]

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'

const HTTP_PROTOCOLS = new Set(['http:', 'https:'])

const DEFAULT_TIMEOUT = 8000
const DEFAULT_CONCURRENCY = 8

const MAX_PROBE_BYTES = 4 * 1024
const MAX_ROBOTS_TXT_BYTES = 512 * 1024
const MAX_SITEMAPS = 1000

const getText = $ =>
  function () {
    return $(this).text().trim()
  }

const getPathname = url => {
  try {
    return new URL(url).pathname
  } catch (_) {
    return url
  }
}

const isXmlUrl = url => REGEX_URL_XML.test(path.extname(getPathname(url)))

const isExcluded = (url, whitelist) =>
  !isEmpty(whitelist) && !isEmpty(matcher([url], concat(whitelist)))

const getSitemapUrls = async (url, opts = {}, visitedSitemaps = new Set()) => {
  const { cheerioOpts = {}, whitelist = false, ...getHtmlOpts } = opts

  visitedSitemaps.add(url)

  const { origin: baseUrl } = new URL(url)
  const { html } = await getHTML(url, getHtmlOpts)
  const $ = cheerio.load(html, { xmlMode: true, ...cheerioOpts })
  const locations = uniq($(XML_SELECTOR).map(getText($)).get())

  const iterator = async (urls, location) => {
    if (isExcluded(location, whitelist)) return urls
    const url = normalizeUrl(baseUrl, location)
    if (!isXmlUrl(url)) return urls.add(url)
    if (visitedSitemaps.has(url) || visitedSitemaps.size >= MAX_SITEMAPS) return urls
    const nested = await getSitemapUrls(url, opts, visitedSitemaps)
    nested.forEach(url => urls.add(url))
    return urls
  }

  return aigle.reduce(locations, iterator, new Set())
}

const xmlUrls = async (sitemaps, opts) => {
  const visitedSitemaps = new Set()

  const iterator = async (urls, sitemap) => {
    if (visitedSitemaps.has(sitemap)) return urls
    const nested = await getSitemapUrls(sitemap, opts, visitedSitemaps)
    nested.forEach(url => urls.add(url))
    return urls
  }

  return Array.from(await aigle.reduce(concat(sitemaps), iterator, new Set()))
}

const getOrigin = url => {
  const { origin, protocol } = new URL(REGEX_PROTOCOL.test(url) ? url : `https://${url}`)
  if (!HTTP_PROTOCOLS.has(protocol)) throw new TypeError(`Expected a http(s) url, got '${url}'`)
  return origin
}

const createHeaders = headers => {
  const result = new Headers(headers)
  if (!result.has('user-agent')) result.set('user-agent', DEFAULT_USER_AGENT)
  return result
}

/**
 * Options are turned into a request before the try, so a malformed `headers` or
 * `timeout` surfaces to the caller instead of looking like an unreachable website.
 */
const request = async (url, { timeout, headers }) => {
  const init = {
    headers: createHeaders(headers),
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout)
  }

  try {
    return await fetch(url, init)
  } catch (_) {}
}

const discard = response => response.body?.cancel().catch(() => {})

const readUpTo = async (body, maxBytes) => {
  if (body === null) return ''

  const reader = body.getReader()
  const chunks = []
  let size = 0

  try {
    while (size < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.length
    }
  } catch (_) {
  } finally {
    await reader.cancel().catch(() => {})
  }

  return Buffer.concat(chunks).toString('utf8', 0, maxBytes)
}

const resolveSitemap = async (url, requestOpts) => {
  const response = await request(url, requestOpts)
  if (response === undefined) return undefined

  if (!response.ok) {
    await discard(response)
    return undefined
  }

  const markup = await readUpTo(response.body, MAX_PROBE_BYTES)
  return REGEX_SITEMAP_ROOT_TAG.test(markup) ? response.url : undefined
}

const getDeclaredSitemaps = async (origin, requestOpts) => {
  const response = await request(`${origin}/robots.txt`, requestOpts)
  if (response === undefined) return []

  if (!response.ok) {
    await discard(response)
    return []
  }

  const robotsTxt = await readUpTo(response.body, MAX_ROBOTS_TXT_BYTES)
  const sitemaps = []

  for (const [, location] of robotsTxt.matchAll(REGEX_ROBOTS_SITEMAP)) {
    try {
      const { href, protocol } = new URL(location, response.url)
      if (HTTP_PROTOCOLS.has(protocol)) sitemaps.push(href)
    } catch (_) {}
  }

  return sitemaps
}

const getWellKnownSitemaps = async (origin, requestOpts) => {
  const candidates = WELL_KNOWN_SITEMAP_PATHNAMES.map(pathname => `${origin}${pathname}`)
  const resolved = await aigle.map(candidates, url => resolveSitemap(url, requestOpts))
  return resolved.filter(url => url !== undefined)
}

const getOriginSitemaps = async (origin, requestOpts) => {
  const declaredSitemaps = await getDeclaredSitemaps(origin, requestOpts)
  return isEmpty(declaredSitemaps) ? getWellKnownSitemaps(origin, requestOpts) : declaredSitemaps
}

const getSitemaps = async (
  websites,
  { timeout = DEFAULT_TIMEOUT, concurrency = DEFAULT_CONCURRENCY, headers } = {}
) => {
  const requestOpts = { timeout, headers }
  const origins = uniq(concat(websites).map(website => getOrigin(website)))
  const sitemaps = await aigle.mapLimit(origins, concurrency, origin =>
    getOriginSitemaps(origin, requestOpts)
  )
  return uniq(sitemaps.flat())
}

const fromRoot = async (websites, opts) => {
  const sitemaps = await getSitemaps(websites, opts)
  return isEmpty(sitemaps) ? [] : xmlUrls(sitemaps, opts)
}

module.exports = xmlUrls
module.exports.fromRoot = fromRoot
module.exports.getSitemaps = getSitemaps
module.exports.isXmlUrl = isXmlUrl
