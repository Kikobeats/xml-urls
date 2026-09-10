'use strict'

const { readFile } = require('fs/promises')
const createBrowserless = require('browserless')
const { onExit } = require('signal-exit')
const http = require('http')
const path = require('path')

const browserlessFactory = createBrowserless()
onExit(browserlessFactory.close)

const FIXTURES_DIRECTORY = path.join(__dirname, 'fixtures')

const REGEX_ORIGIN_PLACEHOLDER = /\{\{origin\}\}/g

const serveXml = xml => (req, res, origin) => {
  res.setHeader('content-type', 'application/xml')
  res.end(xml.replace(REGEX_ORIGIN_PLACEHOLDER, origin))
}

const serveFixture = async (pathname, req, res, origin) => {
  try {
    const xml = await readFile(path.join(FIXTURES_DIRECTORY, path.basename(pathname)), 'utf8')
    serveXml(xml)(req, res, origin)
  } catch (_) {
    res.statusCode = 404
    res.end()
  }
}

const createServer = (routes = {}) =>
  new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const origin = `http://${req.headers.host}`
      const { pathname } = new URL(req.url, origin)
      const route = routes[pathname]
      return route ? route(req, res, origin) : serveFixture(pathname, req, res, origin)
    })

    const close = () =>
      new Promise(resolve => {
        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections()
        }
        server.close(resolve)
      })

    server.listen(0, '127.0.0.1', () =>
      resolve({ url: `http://127.0.0.1:${server.address().port}`, close })
    )
  })

module.exports = {
  createServer,
  getBrowserless: () => browserlessFactory,
  serveXml
}
