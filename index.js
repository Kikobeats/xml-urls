'use strict'

const { normalizeUrl } = require('@metascraper/helpers')
const getHTML = require('html-get')
const cheerio = require('cheerio')
const matcher = require('matcher')
const path = require('path')

const REGEX_URL_XML = /^\.xml$/i

const LOC_SELECTOR = 'loc'

const isXmlUrl = url => REGEX_URL_XML.test(path.extname(url))

const createExclusionMatcher = whitelist => {
  const patterns = whitelist || []
  if (patterns.length === 0) return () => false
  return url => matcher([url], patterns).length > 0
}

const withPrerenderDefault = opts =>
  opts.getBrowserless ? opts : { ...opts, prerender: opts.prerender ?? false }

const fetchXml = async (url, opts) => (await getHTML(url, opts)).html

const extractLocs = (xml, cheerioOpts) => {
  const $ = cheerio.load(xml, { xmlMode: true, ...cheerioOpts })
  return $(LOC_SELECTOR)
    .map((_, element) => $(element).text().trim())
    .get()
    .filter(Boolean)
}

const collectSitemapLoc = async (loc, origin, context) => {
  if (URL.canParse(loc, origin)) await collectUrls(new URL(loc, origin).href, context)
}

const collectPageLoc = (loc, origin, context) => {
  const url = normalizeUrl(origin, loc)
  if (url) context.urls.add(url)
}

const collectLoc = (loc, origin, context) =>
  isXmlUrl(loc) ? collectSitemapLoc(loc, origin, context) : collectPageLoc(loc, origin, context)

const collectUrls = async (sitemapUrl, context) => {
  if (context.visited.has(sitemapUrl)) return
  context.visited.add(sitemapUrl)

  const { origin } = new URL(sitemapUrl)
  const xml = await fetchXml(sitemapUrl, context.getHTMLOpts)

  for (const loc of new Set(extractLocs(xml, context.cheerioOpts))) {
    if (!context.isExcluded(loc)) await collectLoc(loc, origin, context)
  }
}

module.exports = async (sitemapUrls, { whitelist, cheerioOpts, ...getHTMLOpts } = {}) => {
  const context = {
    cheerioOpts,
    getHTMLOpts: withPrerenderDefault(getHTMLOpts),
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
