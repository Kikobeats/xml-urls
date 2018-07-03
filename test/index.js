'use strict'

const test = require('ava')
const xmlUrls = require('..')

test('Get all URLs from a plain sitemap', async t => {
  const urls = await xmlUrls(
    'https://rawgit.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/40a311a2930d19755332818ee4a8a14e59b6ef04/sitemap.xml'
  )
  t.snapshot(urls)
})

test('Get all URLs from a sitemap of sitemaps', async t => {
  const urls = await xmlUrls(
    'https://rawgit.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/7d9508f4c1284efe44f9845ad8e8a748d12a3365/sitemap_of_sitemaps.xml'
  )
  t.snapshot(urls)
})
