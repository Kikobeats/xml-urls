'use strict'

const { readFile } = require('fs/promises')
const path = require('path')
const test = require('ava')
const xmlUrls = require('..')

const { createServer } = require('./helpers')

const opts = { prerender: false }

test.before(async t => {
  t.context.server = await createServer()
})

test.after.always(t => t.context.server.close())

test('Get all URLs from a plain sitemap', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap.xml`, opts)
  t.snapshot(urls)
})

test('Remove duplicates', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap_with_duplicates.xml`, opts)
  t.snapshot(urls)
})

test('Get all URLs from more than one sitemap', async t => {
  const sitemapUrl = `${t.context.server.url}/sitemap.xml`
  const urls = await xmlUrls([sitemapUrl, sitemapUrl], opts)
  t.snapshot(urls)
})

test('Get all URLs from a sitemap of sitemaps', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap_of_sitemaps.xml`, opts)
  t.snapshot(urls)
})

test('markup index still fetches nested sitemaps', async t => {
  const origin = t.context.server.url
  const html = (
    await readFile(path.join(__dirname, 'fixtures/sitemap_of_sitemaps.xml'), 'utf8')
  ).replace(/\{\{origin\}\}/g, origin)
  const urls = await xmlUrls(html, { url: `${origin}/sitemap_of_sitemaps.xml`, ...opts })
  t.true(urls.includes('http://www.sitemappro.com/'))
  t.true(urls.length > 1)
})
