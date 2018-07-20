'use strict'

const cheerio = require('cheerio')
const { URL } = require('url')
const aigle = require('aigle')
const path = require('path')
const got = require('got')

const { getUrl } = require('@metascraper/helpers')

const REGEX_URL_XML = /^\.xml$/i

const isXml = url => REGEX_URL_XML.test(path.extname(url))

const xmlUrls = async (url, opts) => {
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
    const urls = isXml(url) ? await xmlUrls(url, opts) : [getUrl(baseUrl, url)]
    return new Set([...set, ...urls])
  }

  return aigle.reduce(urls, iterator, new Set())
}

const resolveUrl = async (url, opts) => Array.from(await xmlUrls(url, opts))

module.exports = async (urls, opts) => {
  const collection = [].concat(urls)
  const iterator = async (set, url) =>
    new Set([...set, ...(await resolveUrl(url))])
  const set = await aigle.reduce(collection, iterator, new Set())
  return Array.from(set)
}

module.exports.isXml = isXml
