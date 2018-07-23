'use strict'

const test = require('ava')
const xmlUrls = require('..')

test('Exclude urls based on pattern', async t => {
  const url =
    'https://rawgit.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/40a311a2930d19755332818ee4a8a14e59b6ef04/sitemap.xml'
  const urls = await xmlUrls(url, {
    prerender: false,
    whitelist: ['*examples*']
  })

  t.snapshot(urls)
})
