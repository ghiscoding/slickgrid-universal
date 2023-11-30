/**
 * This stripTags function is a lib that already existed
 * but was not TypeScript and ESM friendly.
 * So I ported the code into the project and removed any old code like IE11 that we don't need for our project.
 * I also accept more input types without throwing, the code below accepts `string | number | boolean | HTMLElement` while original code only accepted string.
 *
 * The previous lib can be found here at this Github link:
 *     https://github.com/ericnorris/striptags/
 * With an MIT licence that and can be found at
 *     https://github.com/ericnorris/striptags/blob/main/LICENSE
 */

import { isNumber } from './utils';

const STATE_PLAINTEXT = Symbol('plaintext');
const STATE_HTML = Symbol('html');
const STATE_COMMENT = Symbol('comment');
const ALLOWED_TAGS_REGEX = /<(\w*)>/g;
const NORMALIZE_TAG_REGEX = /<\/?([^\s\/>]+)/;

interface Context {
  allowable_tags: Set<string | null>;
  tag_replacement: string;
  state: symbol;
  tag_buffer: string;
  depth: number;
  in_quote_char: string;
}

export function stripTags(htmlText: string | number | boolean | HTMLElement, allowableTags?: string | string[], tagReplacement?: string) {

  /** main init function that will be executed when calling the global function */
  function init(html: string | number | boolean | HTMLElement, allowable_tags?: string | string[], tag_replacement?: string) {
    // number/boolean should be accepted but converted to string and returned on the spot
    // since there's no html tags to be found but we still expect a string output
    if (typeof html !== 'string' && (isNumber(html) || typeof html === 'boolean')) {
      return String(html);
    }
    if (html instanceof HTMLElement) {
      html = html.innerHTML;
    }
    if (typeof html !== 'string') {
      throw new TypeError(`'html' parameter must be a string`);
    }

    return striptags_internal(
      html || '',
      init_context(allowable_tags || '', tag_replacement || '')
    );
  }

  function init_context(allowable_tags: string | string[], tag_replacement: string): Context {
    return {
      allowable_tags: parse_allowable_tags(allowable_tags),
      tag_replacement,
      state: STATE_PLAINTEXT,
      tag_buffer: '',
      depth: 0,
      in_quote_char: ''
    };
  }

  function striptags_internal(html: string, context: Context): string {
    const allowable_tags = context.allowable_tags;
    const tag_replacement = context.tag_replacement;

    let state = context.state;
    let tag_buffer = context.tag_buffer;
    let depth = context.depth;
    let in_quote_char = context.in_quote_char;
    let output = '';

    for (let idx = 0, length = html.length; idx < length; idx++) {
      const char = html[idx];

      if (state === STATE_PLAINTEXT) {
        switch (char) {
          case '<':
            state = STATE_HTML;
            tag_buffer += char;
            break;
          default:
            output += char;
            break;
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
            in_quote_char = '';
            state = STATE_PLAINTEXT;
            tag_buffer += '>';

            if (allowable_tags.has(normalize_tag(tag_buffer))) {
              output += tag_buffer;
            } else {
              output += tag_replacement;
            }
            tag_buffer = '';
            break;
          case '"':
          case '\'':
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
      } else if (state === STATE_COMMENT) {
        switch (char) {
          case '>':
            if (tag_buffer.slice(-2) === '--') {
              // close the comment
              state = STATE_PLAINTEXT;
            }
            tag_buffer = '';
            break;
          default:
            tag_buffer += char;
            break;
        }
      }
    }

    // save the context for future iterations
    context.state = state;
    context.tag_buffer = tag_buffer;
    context.depth = depth;
    context.in_quote_char = in_quote_char;
    return output;
  }

  function parse_allowable_tags(allowable_tags: string | string[]): Set<string | null> {
    let tag_set = new Set<string>();

    if (typeof allowable_tags === 'string') {
      let match;
      while ((match = ALLOWED_TAGS_REGEX.exec(allowable_tags))) {
        tag_set.add(match[1]);
      }
    } else if (typeof allowable_tags[Symbol.iterator] === 'function') {
      tag_set = new Set(allowable_tags);
    }
    return tag_set;
  }

  function normalize_tag(tag_buffer: string) {
    const match = NORMALIZE_TAG_REGEX.exec(tag_buffer);
    return match ? match[1].toLowerCase() : null;
  }

  // init
  return init(htmlText, allowableTags, tagReplacement);
}