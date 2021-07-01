'use strict'

const test = require('ava')
const xmlUrls = require('..')

const { getBrowserless } = require('./util')
/**
 * tests files at: https://gist.github.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b
 */
const fixtures = {
  sitemap:
    'https://gistcdn.githack.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/7d9508f4c1284efe44f9845ad8e8a748d12a3365/sitemap.xml',
  sitemaWithDuplicates:
    'https://gistcdn.githack.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/7df528dcbf0489ee51b50df648f5e5ea010e10ae/sitemap_with_duplicates.xml',
  sitemapOfSitemaps:
    'https://gistcdn.githack.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/7df528dcbf0489ee51b50df648f5e5ea010e10ae/sitemap_of_sitemaps.xml'
}

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
