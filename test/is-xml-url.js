'use strict'

const test = require('ava')

const { isXmlUrl } = require('..')

test('from url', t => {
  t.is(true, isXmlUrl('https://kikobeats.com/sitemap.xml'))
  t.is(false, isXmlUrl('https://kikobeats.com/style.css'))
})

test('from path', t => {
  t.is(true, isXmlUrl('/user/root/sitemap.xml'))
  t.is(false, isXmlUrl('/user/root/style.css'))
})
