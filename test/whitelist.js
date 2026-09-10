'use strict'

const test = require('ava')
const xmlUrls = require('..')

const { createServer, getBrowserless } = require('./util')

test.before(async t => {
  t.context.server = await createServer()
})

test.after.always(t => t.context.server.close())

test('Exclude urls based on pattern', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap.xml`, {
    prerender: false,
    getBrowserless,
    whitelist: ['*examples*']
  })

  t.snapshot(urls)
})
