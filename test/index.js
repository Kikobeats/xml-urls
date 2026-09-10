'use strict'

const test = require('ava')
const xmlUrls = require('..')

const { createServer } = require('./util')

test.before(async t => {
  t.context.server = await createServer()
})

test.after.always(t => t.context.server.close())

test('Get all URLs from a plain sitemap', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap.xml`)
  t.snapshot(urls)
})

test('Remove duplicates', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap_with_duplicates.xml`)
  t.snapshot(urls)
})

test('Get all URLs from more than one sitemap', async t => {
  const sitemapUrl = `${t.context.server.url}/sitemap.xml`
  const urls = await xmlUrls([sitemapUrl, sitemapUrl])
  t.snapshot(urls)
})

test('Get all URLs from a sitemap of sitemaps', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap_of_sitemaps.xml`)
  t.snapshot(urls)
})
