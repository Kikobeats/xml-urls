# xml-urls

![Last version](https://img.shields.io/github/tag/Kikobeats/xml-urls.svg?style=flat-square)
[![Build Status](https://img.shields.io/travis/Kikobeats/xml-urls/master.svg?style=flat-square)](https://travis-ci.org/Kikobeats/xml-urls)
[![Coverage Status](https://img.shields.io/coveralls/Kikobeats/xml-urls.svg?style=flat-square)](https://coveralls.io/github/Kikobeats/xml-urls)
[![Dependency status](https://img.shields.io/david/Kikobeats/xml-urls.svg?style=flat-square)](https://david-dm.org/Kikobeats/xml-urls)
[![Dev Dependencies Status](https://img.shields.io/david/dev/Kikobeats/xml-urls.svg?style=flat-square)](https://david-dm.org/Kikobeats/xml-urls#info=devDependencies)
[![NPM Status](https://img.shields.io/npm/dm/xml-urls.svg?style=flat-square)](https://www.npmjs.org/package/xml-urls)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg?style=flat-square)](https://paypal.me/Kikobeats)

> Get all urls from a Feed/Atom/RSS/Sitemap xml markup.

## Install

```bash
$ npm install xml-urls --save
```

## Usage

```js
const xmlUrls = require('xml-urls')

;(async() => {
  const url = process.argv[2]
  if (!url) throw new TypeError('Need to provide an url as first argument.')
  const urls = xmlUrls(url)

  urls.forEach(url => console.log(url))

  // => [
  //  'http://www.sitemappro.com/',
  //  'http://www.sitemappro.com/download.html',
  //  'http://www.sitemappro.com/register.html',
  //  'http://www.sitemappro.com/examples.html',
  //  'http://www.sitemappro.com/company.html',
  //  'http://www.sitemappro.com/contact.html',
  //  ...
  // ]
})()
```

See more at [examples](/examples).

## API

### xmlUrls(urls, [options])

#### url

*Required*<br>
Type: `string`

#### options

Use it for providing [got#options](https://github.com/sindresorhus/got#goturl-options).

## License

**xml-urls** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/Kikobeats/xml-urls/blob/master/LICENSE.md) License.<br>
Authored and maintained by Kiko Beats with help from [contributors](https://github.com/Kikobeats/xml-urls/contributors).

> [kikobeats.com](https://kikobeats.com) · GitHub [@Kiko Beats](https://github.com/Kikobeats) · Twitter [@Kikobeats](https://twitter.com/Kikobeats)
