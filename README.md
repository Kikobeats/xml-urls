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

See more at [examples](/examples).

## API

### xmlUrls(urls, [options])

Every `<loc>` is resolved against the origin of the sitemap it appears in. Locations ending in `.xml` are fetched and expanded recursively, each distinct URL at most once; every other location is normalized with [@metascraper/helpers](https://github.com/microlinkhq/metascraper/tree/master/packages/metascraper-helpers). Fetched without prerendering, a sitemap that fails to load, answers with an error status, or times out contributes no URLs.

#### urls

*Required*<br>
Type: `string` | `string[]`

The sitemap URL, or a list of them.

#### options

Type: `object`

Any other option is forwarded to [html-get](https://github.com/Kikobeats/html-get#options) for every sitemap, including nested ones, e.g. `headers` or `gotOpts`. Without `getBrowserless`, sitemaps are fetched with `prerender: false` unless you set it to a value other than `null` or `undefined`; pass html-get's `getBrowserless` and its own `prerender` default applies.

##### cheerioOpts

Type: `object`

[cheerio](https://cheerio.js.org) options used to read the `<loc>` values of every sitemap, including nested ones, e.g. `{ decodeEntities: false }`.

##### whitelist

Type: `string` | `string[]`<br>
Default: `[]`

Patterns of locations to exclude from the output, matched with [matcher](https://github.com/sindresorhus/matcher) against the text of each `<loc>` (trimmed, entities decoded), before it is resolved. Excluded `.xml` locations are not fetched.

```js
await xmlUrls(url, { whitelist: ['*examples*', '!*examples/keep*'] })
```

## Related

- [html-urls](https://github.com/Kikobeats/html-urls) – Get all urls from a HTML markup.
- [css-urls](https://github.com/Kikobeats/css-urls) – Get all URLs referenced from stylesheet files.

## License

**xml-urls** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/Kikobeats/xml-urls/blob/master/LICENSE.md) License.<br>
Authored and maintained by Kiko Beats with help from [contributors](https://github.com/Kikobeats/xml-urls/contributors).

> [kikobeats.com](https://kikobeats.com) · GitHub [@Kiko Beats](https://github.com/Kikobeats) · X [@Kikobeats](https://x.com/Kikobeats)
