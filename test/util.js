'use strict'

const createBrowserless = require('browserless')
const { onExit } = require('signal-exit')

const browserlessFactory = createBrowserless()
onExit(browserlessFactory.close)

module.exports = {
  getBrowserless: () => browserlessFactory
}
