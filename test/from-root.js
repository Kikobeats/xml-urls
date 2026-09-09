'use strict'

const test = require('ava')
const xmlUrls = require('..')

const { OPTS, createTestServer, robots, sitemapindex, urlset } = require('./util')

test('get every url of a website from its root', async t => {
  const { origin } = await createTestServer(t, {
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
  const { origin } = await createTestServer(t, {
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

test('follow a child sitemap carrying a query string', async t => {
  const { origin } = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/sitemap.xml\n`),
    '/sitemap.xml': {
      body: origin => sitemapindex([`${origin}/sitemap_products_1.xml?from=1&amp;to=99`])
    },
    '/sitemap_products_1.xml': {
      body: urlset(['https://shop.example/products/one', 'https://shop.example/products/two'])
    }
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, OPTS), [
    'https://shop.example/products/one',
    'https://shop.example/products/two'
  ])
})

test('merge every sitemap declared at robots.txt', async t => {
  const { origin } = await createTestServer(t, {
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
  const { origin } = await createTestServer(t, {
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
  const { origin } = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/sitemap.xml\n`),
    '/sitemap.xml': {
      body: origin => sitemapindex([`${origin}/sitemap.xml`, `${origin}/pages.xml`])
    },
    '/pages.xml': { body: origin => sitemapindex([`${origin}/sitemap.xml`]) }
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, OPTS), [])
})

test('stop when a website chains sitemaps without end', async t => {
  const { origin, requests } = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/chain-0.xml\n`),
    '*': (pathname, origin) => {
      const [, link] = /^\/chain-(\d+)\.xml$/.exec(pathname) ?? []
      return link === undefined
        ? undefined
        : { body: sitemapindex([`${origin}/chain-${Number(link) + 1}.xml`]) }
    }
  })

  const urls = await xmlUrls.fromRoot(origin, OPTS)

  t.deepEqual(urls, [])
  t.true(requests.length < 1100, `expected a bounded amount of requests, got ${requests.length}`)
})

test('fetch a sitemap once when it is reachable more than once', async t => {
  const { origin, requests } = await createTestServer(t, {
    '/sitemap.xml': { body: urlset(['https://example.com/']) }
  })

  const sitemap = `${origin}/sitemap.xml`
  t.deepEqual(await xmlUrls([sitemap, sitemap], OPTS), ['https://example.com/'])

  t.is(requests.filter(({ url }) => url === '/sitemap.xml').length, 1)
})

test('return no urls when the website has no sitemap', async t => {
  const { origin } = await createTestServer(t, {
    '/robots.txt': robots('User-agent: *\nAllow: /\n')
  })

  t.deepEqual(await xmlUrls.fromRoot(origin, OPTS), [])
})
