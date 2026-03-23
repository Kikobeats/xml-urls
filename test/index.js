'use strict'

const test = require('ava')
const xmlUrls = require('..')

const { getBrowserless, fixtures } = require('./util')

test('Get all URLs from a plain sitemap', async t => {
  const urls = await xmlUrls(fixtures.sitemap, { prerender: false, getBrowserless })
  t.snapshot(urls)
})

test('Remove duplicates', async t => {
  const urls = await xmlUrls(fixtures.sitemaWithDuplicates, {
    prerender: false,
    getBrowserless
  })
  t.snapshot(urls)
})

test('Get all URLs from more than one sitemap', async t => {
  const urls = await xmlUrls([fixtures.sitemap, fixtures.sitemap], {
    prerender: false,
    getBrowserless
  })
  t.snapshot(urls)
})

test('Get all URLs from a sitemap of sitemaps', async t => {
  const urls = await xmlUrls(fixtures.sitemapOfSitemaps, { prerender: false, getBrowserless })
  t.snapshot(urls)
})
