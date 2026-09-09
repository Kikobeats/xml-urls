'use strict'

const test = require('ava')
const xmlUrls = require('..')

const { createTestServer, robots, urlset } = require('./util')

const UNREACHABLE_ORIGIN = '127.0.0.1:1'

test('discover the sitemaps declared at robots.txt', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(
      origin =>
        `User-agent: *\nAllow: /\n\nSitemap: ${origin}/pages.xml\nSitemap: ${origin}/posts.xml\n`
    )
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/pages.xml`, `${origin}/posts.xml`])
})

test('resolve relative sitemap directives against the origin', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots('Sitemap: /nested/sitemap.xml\n')
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/nested/sitemap.xml`])
})

test('resolve relative sitemap directives against the redirected origin', async t => {
  const canonical = await createTestServer(t, {
    '/robots.txt': robots('Sitemap: /a.xml\n')
  })

  const origin = await createTestServer(t, {
    '/robots.txt': { location: `${canonical}/robots.txt` }
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${canonical}/a.xml`])
})

test('read sitemap directives case insensitively and across CRLF endings', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(
      origin => `User-agent: *\r\n  SITEMAP :   ${origin}/a.xml\r\nsitemap:${origin}/b.xml\r\n`
    )
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/a.xml`, `${origin}/b.xml`])
})

test('remove duplicated sitemap directives', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/a.xml\nSitemap: ${origin}/a.xml\n`)
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/a.xml`])
})

test('fallback to well known pathnames when robots.txt is missing', async t => {
  const origin = await createTestServer(t, {
    '/sitemap.xml': { body: urlset(['https://example.com/']) }
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/sitemap.xml`])
})

test('fallback to well known pathnames when robots.txt has no sitemap directive', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots('User-agent: *\nDisallow: /private/\n'),
    '/wp-sitemap.xml': { body: urlset(['https://example.com/']) }
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/wp-sitemap.xml`])
})

test('discard well known pathnames that do not serve sitemap markup', async t => {
  const origin = await createTestServer(t, {
    '/sitemap.xml': { contentType: 'text/html', body: '<html><body>Not found</body></html>' },
    '/sitemap_index.xml': { body: urlset(['https://example.com/']) }
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/sitemap_index.xml`])
})

test('discard well known pathnames replying a non successful status code', async t => {
  const origin = await createTestServer(t, {
    '/sitemap.xml': { statusCode: 403, body: urlset(['https://example.com/']) }
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [])
})

test('discard well known pathnames dropping the connection', async t => {
  const origin = await createTestServer(t, {
    '/sitemap.xml': { truncated: true },
    '/sitemap_index.xml': { body: urlset(['https://example.com/']) }
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/sitemap_index.xml`])
})

test('discard well known pathnames replying an empty payload', async t => {
  const origin = await createTestServer(t, {
    '/sitemap.xml': { body: '' },
    '/sitemap_index.xml': { statusCode: 204 }
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [])
})

test('ignore sitemap directives that are not parseable as url', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: http://[nope\nSitemap: ${origin}/a.xml\n`)
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [`${origin}/a.xml`])
})

test('return no sitemaps when the website has none', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots('User-agent: *\nAllow: /\n')
  })

  t.deepEqual(await xmlUrls.getSitemaps(origin), [])
})

test('reduce any url of the website into its origin', async t => {
  const origin = await createTestServer(t, {
    '/robots.txt': robots(origin => `Sitemap: ${origin}/a.xml\n`)
  })

  t.deepEqual(await xmlUrls.getSitemaps(`${origin}/deep/page?query=1#hash`), [`${origin}/a.xml`])
})

test('discover the sitemaps of more than one website', async t => {
  const [one, two] = await Promise.all([
    createTestServer(t, { '/robots.txt': robots(origin => `Sitemap: ${origin}/a.xml\n`) }),
    createTestServer(t, { '/robots.txt': robots(origin => `Sitemap: ${origin}/b.xml\n`) })
  ])

  t.deepEqual(await xmlUrls.getSitemaps([one, two]), [`${one}/a.xml`, `${two}/b.xml`])
})

test('assume https when the url has no protocol', async t => {
  t.deepEqual(await xmlUrls.getSitemaps(UNREACHABLE_ORIGIN), [])
})

test('return no sitemaps when the website is unreachable', async t => {
  t.deepEqual(await xmlUrls.getSitemaps(`http://${UNREACHABLE_ORIGIN}`), [])
})

test('throw when the url is not parseable', async t => {
  await t.throwsAsync(xmlUrls.getSitemaps('not an url'), { instanceOf: TypeError })
})

test('throw when the url protocol is not http(s)', async t => {
  await t.throwsAsync(xmlUrls.getSitemaps('ftp://example.com/pub'), { instanceOf: TypeError })
  await t.throwsAsync(xmlUrls.getSitemaps('file:///etc/passwd'), { instanceOf: TypeError })
})
