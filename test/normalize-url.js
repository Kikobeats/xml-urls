'use strict'

const test = require('ava')

const normalizeUrl = require('../src/normalize-url')

const BASE_URL = 'https://example.com'

const normalizesTo = test.macro((t, input, expected) =>
  t.is(normalizeUrl(input, BASE_URL), expected)
)

test(
  'keeps a canonical URL as it is',
  normalizesTo,
  'http://www.sitemappro.com/',
  'http://www.sitemappro.com/'
)
test('keeps trailing slashes', normalizesTo, 'https://a.com/a/b/', 'https://a.com/a/b/')
test(
  'resolves a root-relative location',
  normalizesTo,
  '/relative/path',
  'https://example.com/relative/path'
)
test('lowercases scheme and host', normalizesTo, 'HTTPS://WWW.A.COM/Path', 'https://www.a.com/Path')
test('strips credentials', normalizesTo, 'https://user:pass@a.com/', 'https://a.com/')
test('drops default ports', normalizesTo, 'https://a.com:443/', 'https://a.com/')
test(
  'drops a trailing host dot and keeps explicit ports',
  normalizesTo,
  'https://a.com.:8080/x',
  'https://a.com:8080/x'
)
test(
  'collapses duplicate slashes in the path',
  normalizesTo,
  'https://a.com//x//y/',
  'https://a.com/x/y/'
)
test(
  'keeps protocols embedded in the path',
  normalizesTo,
  'https://a.com/go//https://b.com//c',
  'https://a.com/go/https://b.com/c'
)
test(
  'decodes unreserved percent-encoded path characters',
  normalizesTo,
  'https://a.com/%7Efoo/b%20c/é',
  'https://a.com/~foo/b%20c/%C3%A9'
)
test(
  'keeps malformed percent-encoding in the path',
  normalizesTo,
  'https://a.com/%E0%A4%A',
  'https://a.com/%E0%A4%A'
)
test(
  'removes utm tracking parameters',
  normalizesTo,
  'https://a.com/p?utm_source=x&b=1&UTM_medium=y&a=2',
  'https://a.com/p?b=1&a=2'
)
test(
  'removes an emptied query string',
  normalizesTo,
  'https://a.com/p?utm_source=x',
  'https://a.com/p'
)
test(
  'keeps parameter order and empty values',
  normalizesTo,
  'https://a.com/?b=1&a&c=',
  'https://a.com/?b=1&a&c='
)
test('drops empty query segments', normalizesTo, 'https://a.com/?a&&b', 'https://a.com/?a&b')
test('strips text fragments', normalizesTo, 'https://a.com/p#:~:text=hi', 'https://a.com/p')
test('keeps regular fragments', normalizesTo, 'https://a.com/p#section', 'https://a.com/p#section')
test('passes mailto URLs through', normalizesTo, 'mailto:x@a.com', 'mailto:x@a.com')
test('passes ftp URLs through', normalizesTo, 'ftp://a.com//f', 'ftp://a.com//f')
test('returns undefined for an invalid URL', normalizesTo, 'http://[bad', undefined)

test('parseUrl returns undefined instead of throwing', t => {
  t.is(normalizeUrl.parseUrl('http://[bad'), undefined)
  t.is(normalizeUrl.parseUrl('/x.xml', BASE_URL).href, 'https://example.com/x.xml')
})
