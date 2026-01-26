'use strict'

const test = require('ava')
const xmlUrls = require('..')

const { getBrowserless, fixtures } = require('./util')

test('Exclude urls based on pattern', async t => {
  const urls = await xmlUrls(fixtures.sitemap, {
    prerender: false,
    getBrowserless,
    whitelist: ['*examples*']
  })

  t.snapshot(urls)
})
