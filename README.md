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
  const url = process.argv[2] // e.g. https://kikobeats.com/sitemap.xml
  if (!url) throw new TypeError('Need to provide an url as first argument.')
  const urls = await xmlUrls(url, { prerender: false })

  urls.forEach(url => console.log(url))

  // => [
  //  'https://kikobeats.com/construyendo-un-hackintosh-basado-en-amd-parte-i/',
  //  'https://kikobeats.com/hackintosh-setup/',
  //  'https://kikobeats.com/experiencias-microatx/',
  //  'https://kikobeats.com/frases-que-te-haran-un-mejor-programador/',
  //  ...
  // ]
})()
```

You don't need to know the sitemap URL beforehand: pass the website and it will be discovered for you.

```js
const xmlUrls = require('xml-urls')

const urls = await xmlUrls.fromRoot('https://kikobeats.com', { prerender: false })

// => [
//  'https://kikobeats.com/construyendo-un-hackintosh-basado-en-amd-parte-i/',
//  'https://kikobeats.com/hackintosh-setup/',
//  'https://kikobeats.com/experiencias-microatx/',
//  'https://kikobeats.com/frases-que-te-haran-un-mejor-programador/',
//  ...
// ]
```

See more at [examples](/examples).

## API

### xmlUrls(urls, [options])

#### urls

*Required*<br>
Type: `string|Array<string>`

One or more XML markup URLs.

#### options

Type: `object`

Use it for providing [html-get#options](https://github.com/Kikobeats/html-get#options).

Sitemaps are static markup, so `prerender: false` is enough for most websites. Prerendering them with a real browser is what gets you past bot protection, and it needs [browserless](https://github.com/microlinkhq/browserless):

```js
const createBrowserless = require('browserless')

const browserlessFactory = createBrowserless()
const urls = await xmlUrls(url, { getBrowserless: () => browserlessFactory })
await browserlessFactory.close()
```

##### whitelist

Type: `array`<br>
Default: `[]`

A list of links to be excluded from the final output. It supports regex patterns.

See [matcher](https://github.com/sindresorhus/matcher#matcher-= for know more.

### xmlUrls.fromRoot(urls, [options])

Same as `xmlUrls`, but it receives a website instead of an XML markup URL, resolving its sitemaps first via [xmlUrls.getSitemaps](#xmlurlsgetsitemapsurls-options).

Any URL of the website works, since only its origin is used:

```js
await xmlUrls.fromRoot('kikobeats.com', { prerender: false })
await xmlUrls.fromRoot('https://kikobeats.com', { prerender: false })
await xmlUrls.fromRoot('https://kikobeats.com/blog/some-post?utm_source=rss', { prerender: false })
```

When the website has no sitemap, it resolves an empty array.

#### urls

*Required*<br>
Type: `string|Array<string>`

One or more websites. A URL without protocol is assumed to be `https`. Any other protocol than `http` or `https` throws a `TypeError`.

#### options

Type: `object`

The same options as `xmlUrls`, plus the ones from [xmlUrls.getSitemaps](#xmlurlsgetsitemapsurls-options).

### xmlUrls.getSitemaps(urls, [options])

The sitemap discovery behind `xmlUrls.fromRoot`, exposed on its own. It resolves the list of sitemap URLs found for a website:

```js
await xmlUrls.getSitemaps('https://kikobeats.com')

// => ['https://kikobeats.com/sitemap.xml']
```

The discovery is done in two steps, stopping at the first one that yields a result:

1. The `Sitemap` directives declared at `/robots.txt`, which is the [standard](https://www.sitemaps.org/protocol.html#submit_robots) way of announcing them. Relative values are resolved against the origin.
2. A set of well known pathnames (`/sitemap.xml`, `/sitemap_index.xml`, `/sitemap-index.xml`, `/sitemap/sitemap.xml`, `/sitemap/index.xml`, `/wp-sitemap.xml`), probed in parallel. A pathname is kept only when it replies a successful status code and the payload is a `<urlset>` or `<sitemapindex>` document, so soft 404s are discarded.

Sitemaps declared at `/robots.txt` are trusted as-is: they are not probed, since the sitemap itself may be served only to a real browser, which is what `xmlUrls` uses to fetch it.

#### urls

*Required*<br>
Type: `string|Array<string>`

#### options

Type: `object`

##### timeout

Type: `number`<br>
Default: `8000`

The maximum time in milliseconds to wait for `/robots.txt` and for each well known pathname probe.

##### headers

Type: `object`<br>
Default: `{ 'user-agent': '<a desktop Chrome user agent>' }`

The headers used during the discovery. Note these are the headers of the discovery requests, not the ones used later to fetch the sitemaps.

### xmlUrls.isXmlUrl(url)

Returns `true` when the URL or path points to an `.xml` file.

## Related

- [html-urls](https://github.com/Kikobeats/html-urls) – Get all urls from a HTML markup.
- [css-urls](https://github.com/Kikobeats/css-urls) – Get all URLs referenced from stylesheet files.

## License

**xml-urls** © [Kiko Beats](https://kikobeats.com), released under the [MIT](https://github.com/Kikobeats/xml-urls/blob/master/LICENSE.md) License.<br>
Authored and maintained by Kiko Beats with help from [contributors](https://github.com/Kikobeats/xml-urls/contributors).

> [kikobeats.com](https://kikobeats.com) · GitHub [@Kiko Beats](https://github.com/Kikobeats) · X [@Kikobeats](https://x.com/Kikobeats)
