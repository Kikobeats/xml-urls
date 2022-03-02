'use strict'

const createBrowserless = require('browserless')
const exitHook = require('exit-hook')

const browserlessFactory = createBrowserless()
exitHook(browserlessFactory.close)

module.exports = {
  getBrowserless: () => browserlessFactory
}
