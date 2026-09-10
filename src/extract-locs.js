'use strict'

const LOC_TAG_NAME = 'loc'

const TAG_OPEN = '<'
const TAG_CLOSE = '>'
const END_TAG_MARKER = '/'
const COMMENT_OPEN = '<!--'
const COMMENT_CLOSE = '-->'
const CDATA_OPEN = '<![CDATA['
const CDATA_CLOSE = ']]>'

const MAX_CODE_POINT = 0x10ffff

const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

const REGEX_ENTITY = /&#[xX]([\da-fA-F]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/g

const REGEX_TAG_NAME_END = /[\s/>]/

const fromCodePoint = (codePoint, entity) =>
  codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : entity

const decodeEntity = (entity, hexCodePoint, decimalCodePoint, name) => {
  if (hexCodePoint !== undefined) return fromCodePoint(parseInt(hexCodePoint, 16), entity)
  if (decimalCodePoint !== undefined) return fromCodePoint(parseInt(decimalCodePoint, 10), entity)
  return XML_ENTITIES[name]
}

const decodeEntities = text => text.replace(REGEX_ENTITY, decodeEntity)

const indexAfter = (xml, token, from) => {
  const index = xml.indexOf(token, from)
  return index === -1 ? xml.length : index + token.length
}

const isLocTagName = (xml, nameStart) =>
  xml.slice(nameStart, nameStart + LOC_TAG_NAME.length).toLowerCase() === LOC_TAG_NAME &&
  REGEX_TAG_NAME_END.test(xml.charAt(nameStart + LOC_TAG_NAME.length))

const isLocStartTag = (xml, tagStart, tagEnd) =>
  isLocTagName(xml, tagStart + TAG_OPEN.length) && xml[tagEnd - 1] !== END_TAG_MARKER

const isLocEndTag = (xml, tagStart) =>
  xml[tagStart + TAG_OPEN.length] === END_TAG_MARKER &&
  isLocTagName(xml, tagStart + TAG_OPEN.length + END_TAG_MARKER.length)

const readLocContent = (xml, contentStart) => {
  let text = ''
  let position = contentStart

  while (true) {
    const tagStart = xml.indexOf(TAG_OPEN, position)
    if (tagStart === -1) return { end: xml.length }

    text += decodeEntities(xml.slice(position, tagStart))

    if (xml.startsWith(CDATA_OPEN, tagStart)) {
      const cdataStart = tagStart + CDATA_OPEN.length
      const cdataEnd = xml.indexOf(CDATA_CLOSE, cdataStart)
      if (cdataEnd === -1) return { end: xml.length }
      text += xml.slice(cdataStart, cdataEnd)
      position = cdataEnd + CDATA_CLOSE.length
    } else if (xml.startsWith(COMMENT_OPEN, tagStart)) {
      position = indexAfter(xml, COMMENT_CLOSE, tagStart + COMMENT_OPEN.length)
    } else {
      const tagEnd = xml.indexOf(TAG_CLOSE, tagStart)
      if (tagEnd === -1) return { end: xml.length }
      position = tagEnd + TAG_CLOSE.length
      if (isLocEndTag(xml, tagStart)) return { end: position, text: text.trim() }
    }
  }
}

module.exports = xml => {
  const locs = []
  let position = 0

  while (position < xml.length) {
    const tagStart = xml.indexOf(TAG_OPEN, position)
    if (tagStart === -1) break

    if (xml.startsWith(CDATA_OPEN, tagStart)) {
      position = indexAfter(xml, CDATA_CLOSE, tagStart + CDATA_OPEN.length)
    } else if (xml.startsWith(COMMENT_OPEN, tagStart)) {
      position = indexAfter(xml, COMMENT_CLOSE, tagStart + COMMENT_OPEN.length)
    } else {
      const tagEnd = xml.indexOf(TAG_CLOSE, tagStart)
      if (tagEnd === -1) break
      position = tagEnd + TAG_CLOSE.length

      if (isLocStartTag(xml, tagStart, tagEnd)) {
        const loc = readLocContent(xml, position)
        position = loc.end
        if (loc.text) locs.push(loc.text)
      }
    }
  }

  return locs
}
