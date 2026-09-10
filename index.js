'use strict'

const { normalizeUrl } = require('@metascraper/helpers')
const cheerio = require('cheerio')
const matcher = require('matcher')
const { URL } = require('url')
const path = require('path')

const REGEX_URL_XML = /^\.xml$/i
const XML_SELECTOR = 'loc'

const isMarkup = value => typeof value === 'string' && /^\s*</.test(value)

const isXmlUrl = url => REGEX_URL_XML.test(path.extname(url))

const HTML_GET = 'html-get'

const defaultFetcher = (url, opts) => require(HTML_GET)(url, opts)

const getContent = async (url, fetcher, opts) => {
  const result = await fetcher(url, opts)
  if (typeof result === 'string') return result
  if (result && typeof result.html === 'string') return result.html
  const buffer = Buffer.from(await result.arrayBuffer())
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return require('zlib').gunzipSync(buffer).toString()
  }
  return buffer.toString()
}

const xmlUrls = async (
  input,
  { cheerioOpts = {}, whitelist = false, html, url, fetcher = defaultFetcher, ...opts } = {}
) => {
  const fromMarkup = isMarkup(input)
  const markup = fromMarkup ? input : html
  const target = fromMarkup ? url : input
  const body = markup || (await getContent(target, fetcher, opts))
  const base = target && new URL(target).origin
  const $ = cheerio.load(body, { xmlMode: true, ...cheerioOpts })
  const locs = new Set(
    $(XML_SELECTOR)
      .map(function () {
        return $(this).text().trim()
      })
      .get()
  )

  const urls = new Set()
  for (const loc of locs) {
    const resolved = base ? normalizeUrl(base, loc) : normalizeUrl(loc)
    if (!resolved) continue
    if (whitelist && matcher([resolved], [].concat(whitelist)).length) continue
    if (isXmlUrl(resolved)) {
      for (const item of await xmlUrls(resolved, { cheerioOpts, whitelist, fetcher, ...opts })) {
        urls.add(item)
      }
    } else {
      urls.add(resolved)
    }
  }
  return urls
}

module.exports = async (input, opts) => {
  const urls = new Set()
  for (const item of [].concat(input)) {
    for (const url of await xmlUrls(item, opts)) urls.add(url)
  }
  return [...urls]
}

module.exports.isXmlUrl = isXmlUrl
