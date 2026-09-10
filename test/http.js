'use strict'

const test = require('ava')

const xmlUrls = require('..')

const { createServer, serveXml } = require('./util')

const NO_RETRY = { retry: 0 }

const UNREACHABLE_SITEMAP_URL = 'http://127.0.0.1:1/sitemap.xml'

const SELF_REFERENCE_HIT_LIMIT = 2

const BASIC_AUTH = `Basic ${Buffer.from('u:p').toString('base64')}`

const urlset = (...locs) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset>${locs
    .map(loc => `<url><loc>${loc}</loc></url>`)
    .join('')}</urlset>`

const hits = new Map()

const countHits = route => (req, res, origin) => {
  hits.set(req.url, (hits.get(req.url) || 0) + 1)
  return route(req, res, origin)
}

const notFoundAfter = (limit, route) => (req, res, origin) => {
  if (hits.get(req.url) <= limit) return route(req, res, origin)
  res.statusCode = 404
  res.end()
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
    '/self.xml': countHits(
      notFoundAfter(
        SELF_REFERENCE_HIT_LIMIT,
        serveXml(urlset('{{origin}}/self.xml', 'https://a.com/self'))
      )
    ),
    '/self-upper.xml': countHits(
      notFoundAfter(
        SELF_REFERENCE_HIT_LIMIT,
        serveXml(urlset('{{origin}}/self-upper.xml', 'https://a.com/self-upper'))
      )
    ),
    '/self-loc-upper.xml': countHits(
      notFoundAfter(SELF_REFERENCE_HIT_LIMIT, (req, res, origin) =>
        serveXml(
          urlset(
            `${origin.replace('http://', 'HTTP://')}/self-loc-upper.xml`,
            'https://a.com/self-loc-upper'
          )
        )(req, res, origin)
      )
    ),
    '/twice.xml': countHits(serveXml(urlset('https://a.com/twice'))),
    '/utm.xml': serveXml(urlset('{{origin}}/feed.xml?utm_source=rss')),
    '/feed.xml': countHits(serveXml(urlset('https://a.com/from-feed'))),
    '/auth.xml': (req, res, origin) =>
      serveXml(urlset(`${origin.replace('://', '://u:p@')}/secret.xml`))(req, res, origin),
    '/secret.xml': (req, res, origin) => {
      if (req.headers.authorization === BASIC_AUTH) {
        return serveXml(urlset('https://a.com/secret'))(req, res, origin)
      }
      res.statusCode = 401
      res.end()
    },
    '/relative.xml': serveXml(
      urlset(
        'page.html',
        '/section/',
        'nested/child.xml',
        '',
        '   ',
        'http://[bad',
        'http://[bad.xml',
        'mailto:x@a.com'
      )
    ),
    '/nested/child.xml': serveXml(urlset('https://a.com/child')),
    '/cdata.xml': serveXml(urlset('<![CDATA[https://a.com/cdata]]>')),
    '/entity.xml': serveXml(urlset('https://a.com/?a=1&amp;b=2')),
    '/nested-entity.xml': serveXml(urlset('{{origin}}/entity.xml')),
    '/nested-echo-header.xml': serveXml(urlset('{{origin}}/echo-header.xml')),
    '/dir/sub.xml': serveXml(urlset('page.html', 'child.xml')),
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

test('does not prerender when prerender is undefined or null', async t => {
  const url = `${t.context.server.url}/sitemap_with_duplicates.xml`
  t.deepEqual(await xmlUrls(url, { prerender: undefined }), ['http://www.sitemappro.com/'])
  t.deepEqual(await xmlUrls(url, { prerender: null }), ['http://www.sitemappro.com/'])
})

test('rejects prerendering without getBrowserless, as html-get does', async t => {
  const url = `${t.context.server.url}/sitemap_with_duplicates.xml`
  await t.throwsAsync(xmlUrls(url, { prerender: true }), { instanceOf: TypeError })
})

test('merges URLs from every input sitemap in order', async t => {
  const { url } = t.context.server
  const urls = await xmlUrls([`${url}/sitemap_with_duplicates.xml`, `${url}/nested/child.xml`])
  t.deepEqual(urls, ['http://www.sitemappro.com/', 'https://a.com/child'])
})

test('returns no URLs for a sitemap answering with an error status', async t => {
  const opts = { gotOpts: NO_RETRY }
  t.deepEqual(await xmlUrls(`${t.context.server.url}/not-found.xml`, opts), [])
  t.deepEqual(await xmlUrls(`${t.context.server.url}/server-error.xml`, opts), [])
})

test('returns no URLs for an unreachable sitemap', async t => {
  t.deepEqual(await xmlUrls(UNREACHABLE_SITEMAP_URL, { gotOpts: NO_RETRY }), [])
})

test('returns no URLs when the request times out', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/hang.xml`, {
    gotOpts: { ...NO_RETRY, timeout: 50 }
  })
  t.deepEqual(urls, [])
})

test('follows redirects', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/redirect.xml`)
  t.deepEqual(urls, ['http://www.sitemappro.com/'])
})

test('forwards html-get options to every sitemap', async t => {
  const { url } = t.context.server
  const opts = { headers: { 'x-token': 'secret' } }
  t.deepEqual(await xmlUrls(`${url}/echo-header.xml`, opts), ['https://a.com/secret'])
  t.deepEqual(await xmlUrls(`${url}/nested-echo-header.xml`, opts), ['https://a.com/secret'])
})

test('forwards cheerio options to every sitemap', async t => {
  const { url } = t.context.server
  const cheerioOpts = { decodeEntities: false }
  t.deepEqual(await xmlUrls(`${url}/entity.xml`), ['https://a.com/?a=1&b=2'])
  t.deepEqual(await xmlUrls(`${url}/entity.xml`, { cheerioOpts }), ['https://a.com/?a=1&amp;b=2'])
  t.deepEqual(await xmlUrls(`${url}/nested-entity.xml`, { cheerioOpts }), [
    'https://a.com/?a=1&amp;b=2'
  ])
})

test('rejects an invalid sitemap URL', async t => {
  await t.throwsAsync(xmlUrls('not a url'), { instanceOf: TypeError })
})

test('fetches a self-referencing sitemap once', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/self.xml`)
  t.deepEqual(urls, ['https://a.com/self'])
  t.is(hits.get('/self.xml'), 1)
})

test('fetches a sitemap once however its URL is spelled', async t => {
  const { url } = t.context.server
  const fromUpperSchemeInput = await xmlUrls(`${url}/self-upper.xml`.replace('http://', 'HTTP://'))
  t.deepEqual(fromUpperSchemeInput, ['https://a.com/self-upper'])
  t.is(hits.get('/self-upper.xml'), 1)
  const fromUpperSchemeLoc = await xmlUrls(`${url}/self-loc-upper.xml`)
  t.deepEqual(fromUpperSchemeLoc, ['https://a.com/self-loc-upper'])
  t.is(hits.get('/self-loc-upper.xml'), 1)
})

test('fetches an input sitemap given twice once', async t => {
  const sitemapUrl = `${t.context.server.url}/twice.xml`
  t.deepEqual(await xmlUrls([sitemapUrl, sitemapUrl]), ['https://a.com/twice'])
  t.is(hits.get('/twice.xml'), 1)
})

test('leaves the prerender default to html-get when getBrowserless is given', async t => {
  const url = `${t.context.server.url}/nested/child.xml`
  const prerenderModes = []
  const getMode = (_, { prerender }) => {
    prerenderModes.push(prerender)
    return 'fetch'
  }
  const getBrowserless = () => {}
  t.deepEqual(await xmlUrls(url, { getBrowserless, getMode }), ['https://a.com/child'])
  t.deepEqual(await xmlUrls(url, { getBrowserless, getMode, prerender: false }), [
    'https://a.com/child'
  ])
  t.deepEqual(prerenderModes, ['auto', false])
})

test('resolves relative locations against the sitemap origin and drops empty and invalid ones', async t => {
  const { url } = t.context.server
  const urls = await xmlUrls(`${url}/relative.xml`)
  t.deepEqual(urls, [
    `${url}/page.html`,
    `${url}/section/`,
    'https://a.com/child',
    'mailto:x@a.com'
  ])
})

test('resolves locations of a sitemap in a subdirectory against its origin', async t => {
  const { url } = t.context.server
  const urls = await xmlUrls(`${url}/dir/sub.xml`)
  t.deepEqual(urls, [`${url}/page.html`, 'https://a.com/keep', 'https://a.com/drop-me'])
})

test('matches whitelist patterns against the location as written in the sitemap', async t => {
  const { url } = t.context.server
  const sitemapUrl = `${url}/dir/sub.xml`
  const nested = ['https://a.com/keep', 'https://a.com/drop-me']
  t.deepEqual(await xmlUrls(sitemapUrl, { whitelist: 'page.html' }), nested)
  t.deepEqual(await xmlUrls(sitemapUrl, { whitelist: `${url}/page.html` }), [
    `${url}/page.html`,
    ...nested
  ])
})

test('applies the whitelist to nested sitemaps', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/index.xml`, {
    whitelist: ['*drop-me*', '*skip.xml']
  })
  t.deepEqual(urls, ['https://a.com/keep'])
  t.is(hits.get('/skip.xml'), undefined)
})

test('accepts a single whitelist pattern', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/child.xml`, { whitelist: '*drop-me*' })
  t.deepEqual(urls, ['https://a.com/keep'])
})

test('treats a sitemap location with a query string as a page URL', async t => {
  const { url } = t.context.server
  const urls = await xmlUrls(`${url}/utm.xml`)
  t.deepEqual(urls, [`${url}/feed.xml`])
  t.is(hits.get('/feed.xml'), undefined)
})

test('keeps the credentials of a nested sitemap location', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/auth.xml`)
  t.deepEqual(urls, ['https://a.com/secret'])
})

test.failing('reads CDATA locations', async t => {
  const urls = await xmlUrls(`${t.context.server.url}/cdata.xml`)
  t.deepEqual(urls, ['https://a.com/cdata'])
})
