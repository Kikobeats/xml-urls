'use strict'

const test = require('ava')

const xmlUrls = require('..')

const { createServer, serveXml } = require('./util')

const urlset = (...locs) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset>${locs
    .map(loc => `<url><loc>${loc}</loc></url>`)
    .join('')}</urlset>`

const hits = new Map()

const countHits = route => (req, res, origin) => {
  hits.set(req.url, (hits.get(req.url) || 0) + 1)
  return route(req, res, origin)
}

test.before(async t => {
  t.context.server = await createServer({
    '/not-found.xml': (req, res) => {
      res.statusCode = 404
      res.end(urlset('https://a.com/404'))
    },
    '/server-error.xml': (req, res) => {
      res.statusCode = 500
      res.end(urlset('https://a.com/500'))
    },
    '/redirect.xml': (req, res) => {
      res.statusCode = 301
      res.setHeader('location', '/sitemap_with_duplicates.xml')
      res.end()
    },
    '/hang.xml': () => {},
    '/echo-header.xml': (req, res) => res.end(urlset(`https://a.com/${req.headers['x-token']}`)),
    '/self.xml': countHits(serveXml(urlset('{{origin}}/self.xml', 'https://a.com/self'))),
    '/relative.xml': serveXml(
      urlset('page.html', '/section/', 'nested/child.xml', 'http://[bad', 'mailto:x@a.com')
    ),
    '/nested/child.xml': serveXml(urlset('https://a.com/child')),
    '/index.xml': serveXml(urlset('{{origin}}/child.xml', '{{origin}}/skip.xml')),
    '/child.xml': serveXml(urlset('https://a.com/keep', 'https://a.com/drop-me')),
    '/skip.xml': countHits(serveXml(urlset('https://a.com/from-skipped')))
  })
})

test.after.always(t => t.context.server.close())

test('works without any options', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap_with_duplicates.xml`)
  t.deepEqual(urls, ['http://www.sitemappro.com/'])
})

test('ignores options from the previous html-get based API', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/sitemap_with_duplicates.xml`, {
    prerender: false,
    getBrowserless: () => {},
    cheerioOpts: {}
  })
  t.deepEqual(urls, ['http://www.sitemappro.com/'])
})

test('returns no URLs for a sitemap answering with an error status', async t => {
  t.deepEqual(await xmlUrls(`${t.context.server.url}/not-found.xml`), [])
  t.deepEqual(await xmlUrls(`${t.context.server.url}/server-error.xml`), [])
})

test('returns no URLs for an unreachable sitemap', async t => {
  const { url, close } = await createServer()
  await close()
  t.deepEqual(await xmlUrls(`${url}/sitemap.xml`), [])
})

test('returns no URLs when the request times out', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/hang.xml`, { timeout: 50 })
  t.deepEqual(urls, [])
})

test('follows redirects', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/redirect.xml`)
  t.deepEqual(urls, ['http://www.sitemappro.com/'])
})

test('forwards fetch options', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/echo-header.xml`, {
    headers: { 'x-token': 'secret' }
  })
  t.deepEqual(urls, ['https://a.com/secret'])
})

test('rejects an invalid sitemap URL', async t => {
  await t.throwsAsync(xmlUrls('not a url'), { instanceOf: TypeError })
})

test('fetches a self-referencing sitemap once', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/self.xml`)
  t.deepEqual(urls, ['https://a.com/self'])
  t.is(hits.get('/self.xml'), 1)
})

test('resolves relative locations against the sitemap origin and drops invalid ones', async t => {
  const { url } = t.context.server
  const urls = await xmlUrls(`${url}/relative.xml`)
  t.deepEqual(urls, [
    `${url}/page.html`,
    `${url}/section/`,
    'https://a.com/child',
    'mailto:x@a.com'
  ])
})

test('applies the whitelist to nested sitemaps', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/index.xml`, {
    whitelist: ['*drop-me*', '*skip.xml']
  })
  t.deepEqual(urls, ['https://a.com/keep'])
  t.is(hits.get('/skip.xml'), undefined)
})
