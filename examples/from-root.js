'use strict'

// const websites = ['https://kikobeats.com', 'https://audiense.com']

const createBrowserless = require('browserless')
const xmlUrls = require('..')

;(async () => {
  const url = process.argv[2]
  if (!url) throw new TypeError('Need to provide an url as first argument.')

  const browserlessFactory = createBrowserless()

  try {
    const sitemaps = await xmlUrls.getSitemaps(url)
    console.log(sitemaps)

    const urls = await xmlUrls.fromRoot(url, { getBrowserless: () => browserlessFactory })
    console.log(urls)
    console.log(urls.length)
  } finally {
    await browserlessFactory.close()
  }
})()
