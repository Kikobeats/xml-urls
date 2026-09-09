'use strict'

const createBrowserless = require('browserless')
const { onExit } = require('signal-exit')
const { createServer } = require('http')

let browserlessFactory

/**
 * tests files at: https://gist.github.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b
 */
const fixtures = {
  sitemap:
    'https://gist.githubusercontent.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/69f37258c61cc8114d25a86238bca572d5f81c30/sitemap.xml',
  sitemaWithDuplicates:
    'https://gist.githubusercontent.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/69f37258c61cc8114d25a86238bca572d5f81c30/sitemap_with_duplicates.xml',
  sitemapOfSitemaps:
    'https://gist.githubusercontent.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/69f37258c61cc8114d25a86238bca572d5f81c30/sitemap_of_sitemaps.xml'
}

const urlset = locations => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locations.map(location => `  <url><loc>${location}</loc></url>`).join('\n')}
</urlset>`

const sitemapindex = locations => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locations.map(location => `  <sitemap><loc>${location}</loc></sitemap>`).join('\n')}
</sitemapindex>`

const robots = body => ({ contentType: 'text/plain', body })

const OPTS = { prerender: false }

/**
 * A route body can be a function receiving the origin, since the port is unknown
 * until the server is listening. Beyond `{ statusCode, contentType, body }`:
 *
 * `location` replies a 302, `truncated` drops the socket mid body, `chunks`
 * writes each item as its own flush, and `delay` waits before replying. The `*`
 * route builds a route from the pathname for anything not matched exactly.
 */
const createTestServer = async (t, routes) => {
  const requests = []

  const server = createServer(async (req, res) => {
    const origin = `http://${req.headers.host}`
    const { pathname } = new URL(req.url, origin)
    requests.push({ url: req.url, headers: req.headers })
    const route = routes[pathname] ?? routes['*']?.(pathname, origin)

    if (route === undefined) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      return res.end('Not Found')
    }

    const {
      statusCode = 200,
      contentType = 'application/xml',
      body = '',
      chunks,
      delay,
      location,
      truncated
    } = route

    if (location !== undefined) {
      res.writeHead(302, { location: typeof location === 'function' ? location(origin) : location })
      return res.end()
    }

    if (truncated) {
      res.writeHead(statusCode, { 'content-type': contentType, 'content-length': '1024' })
      res.flushHeaders()
      return res.socket.destroy()
    }

    if (delay !== undefined) await new Promise(resolve => setTimeout(resolve, delay))

    if (chunks !== undefined) {
      res.writeHead(statusCode, { 'content-type': contentType })
      for (const chunk of chunks) {
        res.write(typeof chunk === 'function' ? chunk(origin) : chunk)
        await new Promise(resolve => setTimeout(resolve, 25))
      }
      return res.end()
    }

    res.writeHead(statusCode, { 'content-type': contentType })
    res.end(typeof body === 'function' ? body(origin) : body)
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))

  t.teardown(() => {
    server.closeAllConnections()
    server.close()
  })

  return { origin: `http://127.0.0.1:${server.address().port}`, requests }
}

const getBrowserless = () => {
  if (browserlessFactory === undefined) {
    browserlessFactory = createBrowserless()
    onExit(browserlessFactory.close)
  }
  return browserlessFactory
}

module.exports = {
  OPTS,
  createTestServer,
  fixtures,
  getBrowserless,
  robots,
  sitemapindex,
  urlset
}
