'use strict'

const createBrowserless = require('browserless')
const { onExit } = require('signal-exit')

const browserlessFactory = createBrowserless()
onExit(browserlessFactory.close)

/**
 * tests files at: https://gist.github.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b
 */
const fixtures = {
  sitemap:
    'https://gist.githubusercontent.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/023496c5bb402df8854c995eec4f6db2a8f131e3/sitemap.xml',
  sitemaWithDuplicates:
    'https://gist.githubusercontent.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/023496c5bb402df8854c995eec4f6db2a8f131e3/sitemap_with_duplicates.xml',
  sitemapOfSitemaps:
    'https://gist.githubusercontent.com/Kikobeats/317550e76f1cbd399cebe3bddc0c146b/raw/023496c5bb402df8854c995eec4f6db2a8f131e3/sitemap_of_sitemaps.xml'
}

module.exports = {
  fixtures,
  getBrowserless: () => browserlessFactory
}
