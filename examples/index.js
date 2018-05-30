'use strict'

// const sitemaps = [
//   'https://kikobeats.com/sitemap.xml',
//   'https://audiense.com/sitemap_index.xml'
// ]

const xmlUrls = require('..')
;(async () => {
  const url = process.argv[2]
  if (!url) throw new TypeError('Need to provide an url as first argument.')
  const urls = await xmlUrls(url)
  console.log(urls)
  console.log(urls.length)
})()
