'use strict'

const test = require('ava')

const { isXml } = require('..')

test('from url', t => {
  t.is(true, isXml('https://kikobeats.com/sitemap.xml'))
  t.is(false, isXml('https://kikobeats.com/style.css'))
})

test('from path', t => {
  t.is(true, isXml('/user/root/sitemap.xml'))
  t.is(false, isXml('/user/root/style.css'))
})
