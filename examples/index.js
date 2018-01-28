'use strict'

const xmlUrls = require('..')
;(async () => {
  const urls = await xmlUrls('https://audiense.com/sitemap_index.xml')
  console.log(urls)
  console.log(urls.length)
})()
