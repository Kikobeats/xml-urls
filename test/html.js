'use strict'

const { readFile } = require('fs/promises')
const path = require('path')
const test = require('ava')

const xmlUrls = require('..')

test('parses loc urls from xml markup', async t => {
  const urls = await xmlUrls(
    '<urlset><loc>https://example.com/a</loc><loc>https://example.com/b</loc></urlset>'
  )
  t.deepEqual(urls, ['https://example.com/a', 'https://example.com/b'])
})

test('uses url as base when html is provided', async t => {
  const urls = await xmlUrls('https://example.com/sitemap.xml', {
    html: '<urlset><loc>/a</loc><loc>/b</loc></urlset>'
  })
  t.deepEqual(urls, ['https://example.com/a', 'https://example.com/b'])
})

test('parses a fixture from markup', async t => {
  const html = await readFile(path.join(__dirname, 'fixtures/sitemap.xml'), 'utf8')
  const urls = await xmlUrls(html)
  t.true(urls.includes('http://www.sitemappro.com/'))
  t.true(urls.includes('http://www.sitemappro.com/examples/example1.html'))
  t.is(urls.length, 23)
})

test('accepts a fetcher that returns text', async t => {
  const urls = await xmlUrls('https://example.com/sitemap.xml', {
    fetcher: () => '<urlset><loc>https://example.com/a</loc></urlset>'
  })
  t.deepEqual(urls, ['https://example.com/a'])
})
