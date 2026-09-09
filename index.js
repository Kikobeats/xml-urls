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

const getText = $ =>
  function () {
    return $(this).text().trim()
  }

const isXmlUrl = url => REGEX_URL_XML.test(path.extname(url))

const isExcluded = (url, whitelist) =>
  !isEmpty(whitelist) && !isEmpty(matcher([url], concat(whitelist)))

const getSitemapUrls = async (url, opts = {}, visitedSitemaps = new Set()) => {
  const { cheerioOpts = {}, whitelist = false, ...getHtmlOpts } = opts

  visitedSitemaps.add(url)

  const { origin: baseUrl } = new URL(url)
  const { html } = await getHTML(url, getHtmlOpts)
  const $ = cheerio.load(html, { xmlMode: true, ...cheerioOpts })
  const locations = uniq($(XML_SELECTOR).map(getText($)).get())

  const iterator = async (set, location) => {
    if (isExcluded(location, whitelist)) return set
    const url = normalizeUrl(baseUrl, location)
    if (!isXmlUrl(location)) return new Set([...set, url])
    if (visitedSitemaps.has(url)) return set
    const urls = await getSitemapUrls(url, opts, visitedSitemaps)
    return new Set([...set, ...urls])
  }

  return aigle.reduce(locations, iterator, new Set())
}

const xmlUrls = async (urls, opts) => {
  const visitedSitemaps = new Set()

  const iterator = async (set, url) => {
    if (visitedSitemaps.has(url)) return set
    const urls = await getSitemapUrls(url, opts, visitedSitemaps)
    return new Set([...set, ...urls])
  }

  const set = await aigle.reduce(concat(urls), iterator, new Set())
  return Array.from(set)
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

const request = async (url, { timeout, headers }) => {
  try {
    return await fetch(url, {
      headers: createHeaders(headers),
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout)
    })
  } catch (_) {}
}

const readChunk = async body => {
  if (body === null) return ''
  const reader = body.getReader()
  try {
    const { value } = await reader.read()
    return value === undefined ? '' : Buffer.from(value).toString()
  } catch (_) {
    return ''
  } finally {
    await reader.cancel().catch(() => {})
  }
}

const existsSitemap = async (url, requestOpts) => {
  const response = await request(url, requestOpts)
  if (response === undefined) return false
  const markup = await readChunk(response.body)
  return response.ok && REGEX_SITEMAP_ROOT_TAG.test(markup)
}

const getDeclaredSitemaps = async (origin, requestOpts) => {
  const response = await request(`${origin}/robots.txt`, requestOpts)
  if (response === undefined) return []

  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    return []
  }

  const robotsTxt = await response.text().catch(() => '')
  const sitemaps = []
  for (const [, location] of robotsTxt.matchAll(REGEX_ROBOTS_SITEMAP)) {
    try {
      sitemaps.push(new URL(location, response.url).toString())
    } catch (_) {}
  }
  return sitemaps
}

const getWellKnownSitemaps = (origin, requestOpts) =>
  aigle.filter(
    WELL_KNOWN_SITEMAP_PATHNAMES.map(pathname => `${origin}${pathname}`),
    url => existsSitemap(url, requestOpts)
  )

const getOriginSitemaps = async (origin, requestOpts) => {
  const declaredSitemaps = await getDeclaredSitemaps(origin, requestOpts)
  return isEmpty(declaredSitemaps) ? getWellKnownSitemaps(origin, requestOpts) : declaredSitemaps
}

const getSitemaps = async (rootUrls, { timeout = DEFAULT_TIMEOUT, headers } = {}) => {
  const requestOpts = { timeout, headers }
  const origins = uniq(concat(rootUrls).map(getOrigin))
  const sitemaps = await aigle.map(origins, origin => getOriginSitemaps(origin, requestOpts))
  return uniq(sitemaps.flat())
}

const fromRoot = async (rootUrls, opts) => {
  const sitemaps = await getSitemaps(rootUrls, opts)
  return isEmpty(sitemaps) ? [] : xmlUrls(sitemaps, opts)
}

module.exports = xmlUrls
module.exports.fromRoot = fromRoot
module.exports.getSitemaps = getSitemaps
module.exports.isXmlUrl = isXmlUrl
