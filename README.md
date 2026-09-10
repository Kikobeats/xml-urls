# xml-urls

[![Last version](https://img.shields.io/github/v/tag/Kikobeats/xml-urls?style=flat-square)](https://github.com/Kikobeats/xml-urls/releases)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/Kikobeats/xml-urls?style=flat-square)](https://coveralls.io/github/Kikobeats/xml-urls)
[![NPM Status](https://img.shields.io/npm/dm/xml-urls?style=flat-square)](https://www.npmjs.com/package/xml-urls)

> Get all URLs detected inside a Feed/Atom/RSS/Sitemap xml markup.

## Install

```bash
$ npm install xml-urls --save
```

It has no dependencies and requires Node.js 18 or later (it uses the built-in `fetch`).

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

Every `<loc>` found is resolved against the sitemap origin and normalized: credentials, `utm_*` query parameters, text fragments, and duplicate path slashes are removed. Locations ending in `.xml` are fetched and expanded recursively, each sitemap at most once. A sitemap that fails to load, answers with an error status, or times out contributes no URLs.

#### urls

*Required*<br>
Type: `string` | `string[]`

The sitemap URL, or a list of them.

#### options

Type: `object`

Any other option is forwarded to [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit), e.g. `headers`.

##### timeout

Type: `number`<br>
Default: `8000`

Milliseconds to wait for each sitemap before giving up on it.

##### whitelist

Type: `string` | `string[]`<br>
Default: `[]`

Patterns of locations to exclude from the output. Excluded `.xml` locations are not fetched.

Each pattern matches the whole location, case-insensitively, where `*` matches any characters. A pattern starting with `!` re-includes what earlier patterns excluded; when the first pattern is negated, everything it does not match is excluded.

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
