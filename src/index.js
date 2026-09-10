'use strict'

const path = require('path')

const createExclusionMatcher = require('./create-exclusion-matcher')
const extractLocs = require('./extract-locs')
const normalizeUrl = require('./normalize-url')

const REQUEST_TIMEOUT = 8000

const REGEX_URL_XML = /^\.xml$/i

const isXmlUrl = url => REGEX_URL_XML.test(path.extname(url))

const fetchXml = async (url, { timeout, ...fetchOptions }) => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
      ...fetchOptions
    })
    return response.ok ? await response.text() : ''
  } catch (_) {
    return ''
  }
}

const collectLoc = async (loc, origin, context) => {
  if (isXmlUrl(loc)) {
    const sitemapUrl = normalizeUrl.parseUrl(loc, origin)
    if (sitemapUrl) await collectUrls(sitemapUrl.href, context)
    return
  }

  const url = normalizeUrl(loc, origin)
  if (url) context.urls.add(url)
}

const collectUrls = async (sitemapUrl, context) => {
  if (context.visited.has(sitemapUrl)) return
  context.visited.add(sitemapUrl)

  const { origin } = new URL(sitemapUrl)
  const xml = await fetchXml(sitemapUrl, context.fetchOptions)

  for (const loc of new Set(extractLocs(xml))) {
    if (!context.isExcluded(loc)) await collectLoc(loc, origin, context)
  }
}

module.exports = async (
  sitemapUrls,
  { whitelist, timeout = REQUEST_TIMEOUT, ...fetchOptions } = {}
) => {
  const context = {
    fetchOptions: { timeout, ...fetchOptions },
    isExcluded: createExclusionMatcher(whitelist),
    urls: new Set(),
    visited: new Set()
  }

  for (const sitemapUrl of [].concat(sitemapUrls)) {
    await collectUrls(new URL(sitemapUrl).href, context)
  }

  return Array.from(context.urls)
}

module.exports.isXmlUrl = isXmlUrl
