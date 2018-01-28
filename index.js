'use strict'

const cheerio = require('cheerio')
const aigle = require('aigle')
const got = require('got')

const REGEX_URL_XML = /\.xml$/

const isXmlUrl = url => REGEX_URL_XML.test(url)

const walkUrls = async (url, opts) => {
  const { body: html } = await got(url, opts)
  const $ = cheerio.load(html, { xmlMode: true })

  const urls = $('loc')
    .map(function () {
      return $(this).text().trim()
    })
    .get()

  const iterator = async (set, url) => {
    if (!isXmlUrl(url)) return set.add(url)
    const innerUrls = await walkUrls(url, opts)
    return new Set([...set, ...innerUrls])
  }

  return aigle.reduce(urls, iterator, new Set())
}

module.exports = async (url, opts) => Array.from(await walkUrls(url, opts))
module.exports.isXmlUrl = isXmlUrl
