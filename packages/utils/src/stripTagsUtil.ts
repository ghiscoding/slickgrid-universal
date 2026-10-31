/**
 * This stripTags function is a lib that already existed on NPM
 * but was not written as TypeScript and was not ESM friendly.
 * So I ported the code into the project and removed any legacy browser code that we don't need for our project since we dropped IE browsers support.
 * The function also accept more input types without throwing like the original one does,
 * the code below accepts `string | number | boolean | HTMLElement` while original code only accepted string.
 *
 * The previous lib can be found here at this Github link:
 *     https://github.com/ericnorris/striptags/
 * With an MIT licence that and can be found at this link:
 *     https://github.com/ericnorris/striptags/blob/main/LICENSE
 */

import { isNumber } from './utils.js';

const STATE_PLAINTEXT = Symbol('plaintext');
const STATE_HTML = Symbol('html');
const STATE_COMMENT = Symbol('comment');
const ALLOWED_TAGS_REGEX = /<(\w*)>/g;
const NORMALIZE_TAG_REGEX = /<\/?([^\s/>]+)/;

export function stripTags(
  htmlText: string | number | boolean | HTMLElement,
  allowableTags?: string | string[],
  tagReplacement?: string
): string {
  // Preserve numeric coercion and boolean conversion before validating other inputs.
  if (typeof htmlText !== 'string' && (isNumber(htmlText) || typeof htmlText === 'boolean')) {
    return String(htmlText);
  }
  if (htmlText instanceof HTMLElement) {
    htmlText = htmlText.innerHTML;
  }
  if (typeof htmlText !== 'string' && htmlText !== undefined && htmlText !== null) {
    throw new TypeError(`'html' parameter must be a string`);
  }

  const html = htmlText || '';
  if (!html.includes('<')) {
    return html;
  }

  const allowable_tags = parse_allowable_tags(allowableTags || '');
  const tag_replacement = tagReplacement || '';
  let state = STATE_PLAINTEXT;
  let tag_buffer = '';
  let depth = 0;
  let in_quote_char = '';
  let output = '';

  for (let idx = 0, length = html.length; idx < length; idx++) {
    const char = html[idx];

    if (state === STATE_PLAINTEXT) {
      if (char === '<') {
        state = STATE_HTML;
        tag_buffer = '<';
      } else {
        output += char;
      }
    } else if (state === STATE_HTML) {
      switch (char) {
        case '<':
          // ignore '<' if inside a quote
          if (in_quote_char) {
            break;
          }
          // we're seeing a nested '<'
          depth++;
          break;
        case '>':
          // ignore '>' if inside a quote
          if (in_quote_char) {
            break;
          }
          // something like this is happening: '<<>>'
          if (depth) {
            depth--;
            break;
          }
          // this is closing the tag in tag_buffer
          state = STATE_PLAINTEXT;
          tag_buffer += '>';

          output += allowable_tags.size && allowable_tags.has(normalize_tag(tag_buffer)) ? tag_buffer : tag_replacement;
          tag_buffer = '';
          break;
        case '"':
        case "'":
          // catch both single and double quotes
          if (char === in_quote_char) {
            in_quote_char = '';
          } else {
            in_quote_char = in_quote_char || char;
          }
          tag_buffer += char;
          break;
        case '-':
          if (tag_buffer === '<!-') {
            state = STATE_COMMENT;
          }
          tag_buffer += char;
          break;
        case ' ':
        case '\n':
          if (tag_buffer === '<') {
            state = STATE_PLAINTEXT;
            output += '< ';
            tag_buffer = '';
            break;
          }
          tag_buffer += char;
          break;
        default:
          tag_buffer += char;
          break;
      }
    } else {
      if (char === '>') {
        if (tag_buffer.endsWith('--')) {
          state = STATE_PLAINTEXT;
        }
        tag_buffer = '';
      } else {
        tag_buffer += char;
      }
    }
  }

  return output;
}

function parse_allowable_tags(allowable_tags: string | string[]): Set<string | null> {
  if (Array.isArray(allowable_tags)) {
    return new Set(allowable_tags);
  }
  const tag_set = new Set<string | null>();

  if (typeof allowable_tags === 'string') {
    let match;
    while ((match = ALLOWED_TAGS_REGEX.exec(allowable_tags))) {
      tag_set.add(match[1]);
    }
  }

  return tag_set;
}

function normalize_tag(tag_buffer: string) {
  const match = NORMALIZE_TAG_REGEX.exec(tag_buffer);
  return match ? match[1].toLowerCase() : null;
}
