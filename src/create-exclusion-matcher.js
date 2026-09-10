'use strict'

const NEGATION_PREFIX = '!'

const ESCAPED_WILDCARD = '\\*'

const ANY_CHARACTERS = '[\\s\\S]*'

const REGEX_SPECIAL_CHARACTERS = /[|\\{}()[\]^$+*?.]/g

const compilePattern = pattern => {
  const negated = pattern.startsWith(NEGATION_PREFIX)
  const glob = negated ? pattern.slice(NEGATION_PREFIX.length) : pattern
  const source = glob
    .replace(REGEX_SPECIAL_CHARACTERS, '\\$&')
    .replaceAll(ESCAPED_WILDCARD, ANY_CHARACTERS)
  return { negated, regex: new RegExp(`^${source}$`, 'i') }
}

module.exports = patterns => {
  const compiledPatterns = [].concat(patterns || []).map(compilePattern)
  if (compiledPatterns.length === 0) return () => false

  const excludedByDefault = compiledPatterns[0].negated

  return url =>
    compiledPatterns.reduce(
      (excluded, { negated, regex }) => (regex.test(url) ? !negated : excluded),
      excludedByDefault
    )
}
