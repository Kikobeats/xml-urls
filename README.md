# xml-urls

[![Last version](https://img.shields.io/github/v/tag/Kikobeats/xml-urls?style=flat-square)](https://github.com/Kikobeats/xml-urls/releases)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/Kikobeats/xml-urls?style=flat-square)](https://coveralls.io/github/Kikobeats/xml-urls)
[![NPM Status](https://img.shields.io/npm/dm/xml-urls?style=flat-square)](https://www.npmjs.com/package/xml-urls)

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

By default, URLs are loaded with [`html-get`](https://github.com/Kikobeats/html-get). Nested sitemap indexes are walked until every page `loc` is collected.

Pass markup when you already have the first document; nested `.xml` locs are still fetched:

```js
const urls = await xmlUrls(xml, { url: 'https://example.com/sitemap.xml' })
```

In a [Microlink Function](https://microlink.io/docs/api/parameters/function), pass a `fetcher` so the isolate HTTP client is used instead of `html-get`:

```js
const maps = require('robots-parser')(robotsUrl, body).getSitemaps()
return require('xml-urls')(maps, { fetcher: fetch })
```

See more at [examples](/examples).

## API

### xmlUrls(input, [options])

#### input

*Required*<br>
Type: `string` | `string[]`

A sitemap/feed URL, XML/HTML markup (a string that starts with `<`), or a list of them.

#### options

Type: `object`

When `input` is a URL and no `fetcher` is set, extra options are forwarded to [`html-get`](https://github.com/Kikobeats/html-get#options).

##### fetcher

Type: `function`<br>
Default: [`html-get`](https://github.com/Kikobeats/html-get)

`(url, opts) => string | { html } | Response | Promise<…>`. Return XML/HTML text, an `html-get` result, or a Fetch [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) (gzip is decoded).

##### html

Type: `string`

Parse this markup instead of fetching `input`. Nested `.xml` locs are still fetched. Use it with a URL `input` (or `options.url`) so relative locs resolve correctly.

##### url

Type: `string`

Base URL when `input` is markup.

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

> [kikobeats.com](https://kikobeats.com) · GitHub [@Kiko Beats](https://github.com/Kikobeats) · X [@Kikobeats](https://x.com/Kikobeats)
