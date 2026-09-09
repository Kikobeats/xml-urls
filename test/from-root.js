'use strict'

const test = require('ava')
const xmlUrls = require('..')

const { OPTS, createTestServer, robots, sitemapindex, urlset } = require('./util')

test('get every url of a website from its root', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/sitemap.xml\n`),
    '/sitemap.xml': {
      body: urlset(['https://example.com/', 'https://example.com/about'])
    }
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, OPTS), [
    'https://example.com/',
    'https://example.com/about'
  ])
})

test('get every url of a website behind a sitemap index', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/sitemap.xml\n`),
    '/sitemap.xml': {
      body: origin => sitemapindex([`${origin}/pages.xml`, `${origin}/posts.xml`])
    },
    '/pages.xml': { body: urlset(['https://example.com/', 'https://example.com/about']) },
    '/posts.xml': { body: urlset(['https://example.com/blog/hello']) }
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, OPTS), [
    'https://example.com/',
    'https://example.com/about',
    'https://example.com/blog/hello'
  ])
})

test('merge every sitemap declared at robots.txt', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/pages.xml\nSitemap: ${origin}/posts.xml\n`),
    '/pages.xml': { body: urlset(['https://example.com/']) },
    '/posts.xml': { body: urlset(['https://example.com/blog/hello']) }
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, OPTS), [
    'https://example.com/',
    'https://example.com/blog/hello'
  ])
})

test('exclude urls based on pattern across nested sitemaps', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/sitemap.xml\n`),
    '/sitemap.xml': { body: origin => sitemapindex([`${origin}/pages.xml`]) },
    '/pages.xml': {
      body: urlset([
        'https://example.com/',
        'https://example.com/private/one',
        'https://example.com/private/two'
      ])
    }
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, { ...OPTS, whitelist: ['*private*'] }), [
    'https://example.com/'
  ])
})

test('stop when a sitemap index references itself', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/sitemap.xml\n`),
    '/sitemap.xml': {
      body: origin => sitemapindex([`${origin}/sitemap.xml`, `${origin}/pages.xml`])
    },
    '/pages.xml': { body: origin => sitemapindex([`${origin}/sitemap.xml`]) }
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, OPTS), [])
})

test('return no urls when the website has no sitemap', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots('User-agent: *\nAllow: /\n')
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, OPTS), [])
})
