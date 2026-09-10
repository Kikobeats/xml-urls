'use strict'

const test = require('ava')

const extractLocs = require('../src/extract-locs')

test('reads every loc element in document order', t => {
  const xml =
    '<urlset><url><loc>https://a.com/1</loc></url><url><loc>https://a.com/2</loc></url></urlset>'
  t.deepEqual(extractLocs(xml), ['https://a.com/1', 'https://a.com/2'])
})

test('trims surrounding whitespace', t => {
  t.deepEqual(extractLocs('<loc>\n  https://a.com/\n</loc>'), ['https://a.com/'])
})

test('reads CDATA content verbatim', t => {
  const xml = '<loc><![CDATA[ https://a.com/?a=1&amp;b=2 ]]></loc>'
  t.deepEqual(extractLocs(xml), ['https://a.com/?a=1&amp;b=2'])
})

test('decodes XML entities and character references', t => {
  const xml = '<loc>https://a.com/?a=1&amp;b=&#50;&#x33;&lt;&gt;&quot;&apos;</loc>'
  t.deepEqual(extractLocs(xml), ['https://a.com/?a=1&b=23<>"\''])
})

test('leaves unknown entities and out of range references untouched', t => {
  const xml = '<loc>https://a.com/&nbsp;&#x110000;&AMP;</loc>'
  t.deepEqual(extractLocs(xml), ['https://a.com/&nbsp;&#x110000;&AMP;'])
})

test('ignores commented out loc elements', t => {
  const xml =
    '<urlset><!-- <url><loc>https://a.com/old</loc></url> --><url><loc>https://a.com/new</loc></url></urlset>'
  t.deepEqual(extractLocs(xml), ['https://a.com/new'])
  t.deepEqual(extractLocs('<loc>https://a.com/<!-- </loc> -->path</loc>'), ['https://a.com/path'])
})

test('matches loc elements case-insensitively and with attributes', t => {
  const xml = '<LOC>https://a.com/upper</LOC><loc id="x">https://a.com/attrs</loc >'
  t.deepEqual(extractLocs(xml), ['https://a.com/upper', 'https://a.com/attrs'])
})

test('ignores prefixed, similarly named, and self-closing elements', t => {
  const xml = '<image:loc>https://a.com/img.png</image:loc><locale>es</locale><loc/><loc />'
  t.deepEqual(extractLocs(xml), [])
})

test('skips empty loc elements', t => {
  t.deepEqual(extractLocs('<loc></loc><loc>  </loc><loc><![CDATA[]]></loc>'), [])
})

test('keeps only the text of markup nested inside loc', t => {
  t.deepEqual(extractLocs('<loc><b>https://a.com/</b></loc>'), ['https://a.com/'])
})

test('returns nothing for markup without loc elements', t => {
  t.deepEqual(extractLocs(''), [])
  t.deepEqual(extractLocs('<rss><channel><link>https://a.com/</link></channel></rss>'), [])
})

test('drops a loc element that is never closed', t => {
  t.deepEqual(extractLocs('<loc>https://a.com/1</loc><loc>https://a.com/2'), ['https://a.com/1'])
  t.deepEqual(extractLocs('<loc><![CDATA[https://a.com/'), [])
  t.deepEqual(extractLocs('<loc>https://a.com/<b'), [])
})

test('skips markup outside loc elements, including CDATA and processing instructions', t => {
  const xml =
    '<?xml version="1.0"?><!DOCTYPE urlset><x><![CDATA[<loc>https://a.com/hidden</loc>]]></x><loc>https://a.com/</loc>'
  t.deepEqual(extractLocs(xml), ['https://a.com/'])
})

test('scans hostile markup in linear time', t => {
  const HOSTILE_INPUT_BYTES = 1_000_000
  const TIME_BUDGET_MS = 1000
  const repeatTo = unit => unit.repeat(HOSTILE_INPUT_BYTES / unit.length)

  const hostileInputs = [
    repeatTo('<loc>'),
    repeatTo('<loc '),
    repeatTo('<!--'),
    '<loc>' + repeatTo('<![CDATA['),
    '<loc>' + repeatTo('<b>') + '</loc>',
    '<loc>' + repeatTo('&#x1') + '</loc>',
    repeatTo('<a') + '>'
  ]

  for (const xml of hostileInputs) {
    const start = performance.now()
    extractLocs(xml)
    t.true(performance.now() - start < TIME_BUDGET_MS, xml.slice(0, 16))
  }
})
