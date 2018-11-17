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

const getText = $ =>
  function () {
    return $(this)
      .text()
      .trim()
  }

const isXml = url => REGEX_URL_XML.test(path.extname(url))

const xmlUrls = async (
  url,
  { cheerioOpts = {}, whitelist = false, ...opts } = {}
) => {
  const { origin: baseUrl } = new URL(url)
  const { html } = await getHTML(url, opts)
  const $ = cheerio.load(html, { xmlMode: true, ...cheerioOpts })
  const urls = uniq(
    $(XML_SELECTOR)
      .map(getText($))
      .get()
  )

  const iterator = async (set, url) => {
    const match = !isEmpty(whitelist) && matcher([url], concat(whitelist))
    if (!isEmpty(match)) return set
    const urls = isXml(url)
      ? await xmlUrls(url, opts)
      : [normalizeUrl(baseUrl, url)]
    return new Set([...set, ...urls])
  }

  return aigle.reduce(urls, iterator, new Set())
}

module.exports = async (urls, opts) => {
  const collection = concat(urls)

  const iterator = async (set, url) => {
    const urls = Array.from(await xmlUrls(url, opts))
    return new Set([...set, ...urls])
  }

  const set = await aigle.reduce(collection, iterator, new Set())
  return Array.from(set)
}

module.exports.isXml = isXml
