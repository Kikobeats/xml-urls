'use strict'

const test = require('ava')

const createExclusionMatcher = require('../src/create-exclusion-matcher')

test('excludes nothing without patterns', t => {
  for (const patterns of [undefined, false, '', []]) {
    t.false(createExclusionMatcher(patterns)('https://a.com/'))
  }
})

test('matches the whole URL, with * as a wildcard', t => {
  const isExcluded = createExclusionMatcher(['*examples*'])
  t.true(isExcluded('http://a.com/examples/1.html'))
  t.false(isExcluded('http://a.com/1.html'))
  t.false(createExclusionMatcher('https://a.com')('https://a.com/x'))
})

test('accepts a single pattern string', t => {
  t.true(createExclusionMatcher('*.pdf')('https://a.com/file.pdf'))
})

test('matches case-insensitively', t => {
  t.true(createExclusionMatcher('*EXAMPLES*')('http://a.com/examples/'))
})

test('treats regular expression characters literally', t => {
  const isExcluded = createExclusionMatcher('https://a.com/?q=(1)+[2]')
  t.true(isExcluded('https://a.com/?q=(1)+[2]'))
  t.false(createExclusionMatcher('https://a.c*')('https://aXc.com/'))
})

test('a negated pattern re-includes URLs excluded by earlier patterns', t => {
  const isExcluded = createExclusionMatcher(['*a.com*', '!*keep*'])
  t.false(isExcluded('https://a.com/keep'))
  t.true(isExcluded('https://a.com/drop'))
  t.false(isExcluded('https://b.com/drop'))
})

test('a leading negated pattern excludes every URL it does not match', t => {
  const isExcluded = createExclusionMatcher(['!*keep*'])
  t.false(isExcluded('https://a.com/keep'))
  t.true(isExcluded('https://a.com/drop'))
})
