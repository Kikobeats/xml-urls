'use strict'

const cheerio = require('cheerio')
const { URL } = require('url')
const aigle = require('aigle')
const got = require('got')

const { getUrl } = require('@metascraper/helpers')

const REGEX_URL_XML = /\.xml$/

const isXmlUrl = url => REGEX_URL_XML.test(url)

const walkUrls = async (url, opts) => {
  const { origin: baseUrl } = new URL(url)
  const { body: html } = await got(url, opts)
  const $ = cheerio.load(html, { xmlMode: true })

  const urls = $('loc')
    .map(function () {
      return $(this)
        .text()
        .trim()
    })
    .get()

  const iterator = async (set, url) => {
    if (!isXmlUrl(url)) return new Set([...set, getUrl(baseUrl, url)])
    const innerUrls = await walkUrls(url, opts)
    return new Set([...set, ...innerUrls])
  }

  return aigle.reduce(urls, iterator, new Set())
}

module.exports = async (url, opts) => Array.from(await walkUrls(url, opts))
module.exports.isXmlUrl = isXmlUrl
