'use strict'

const { readFile } = require('fs/promises')
const http = require('http')
const path = require('path')

const FIXTURES_DIRECTORY = path.join(__dirname, '..', 'fixtures')

const createServer = () =>
  new Promise(resolve => {
    const server = http.createServer(async (req, res) => {
      const origin = `http://${req.headers.host}`
      const { pathname } = new URL(req.url, origin)

      try {
        const xml = await readFile(path.join(FIXTURES_DIRECTORY, path.basename(pathname)), 'utf8')
        res.setHeader('content-type', 'application/xml')
        res.end(xml.replace(/\{\{origin\}\}/g, origin))
      } catch (_) {
        res.statusCode = 404
        res.end()
      }
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

module.exports = { createServer }
