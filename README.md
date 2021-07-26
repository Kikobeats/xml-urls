# xml-urls

![Last version](https://img.shields.io/github/tag/Kikobeats/xml-urls.svg?style=flat-square)
[![Coverage Status](https://img.shields.io/coveralls/Kikobeats/xml-urls.svg?style=flat-square)](https://coveralls.io/github/Kikobeats/xml-urls)
[![NPM Status](https://img.shields.io/npm/dm/xml-urls.svg?style=flat-square)](https://www.npmjs.org/package/xml-urls)

> Get all URLs detected inside a Feed/Atom/RSS/Sitemap xml markup.

## Install

```bash
$ npm install xml-urls --save
```

## Usage

```js
const xmlUrls = require('xml-urls')

;(async () => {
  const url = process.argv[2]
  if (!url) throw new TypeError('Need to provide an url as first argument.')
  const urls = await xmlUrls(url)

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

Type: `object`

Use it for providing [html-get#options](https://github.com/Kikobeats/html-get#options).

##### whitelist

Type: `array`<br>
Default: `[]`

A list of links to be excluded from the final output. It supports regex patterns.

See [matcher](https://github.com/sindresorhus/matcher#matcher-= for know more.

## Related

- [html-urls](https://github.com/Kikobeats/html-urls) – Get all urls from a HTML markup.
- [css-urls](https://github.com/Kikobeats/css-urls) – Get all URLs referenced from stylesheet files.

## License

**xml-urls** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/Kikobeats/xml-urls/blob/master/LICENSE.md) License.<br>
Authored and maintained by Kiko Beats with help from [contributors](https://github.com/Kikobeats/xml-urls/contributors).

> [kikobeats.com](https://kikobeats.com) · GitHub [@Kiko Beats](https://github.com/Kikobeats) · Twitter [@Kikobeats](https://twitter.com/Kikobeats)
