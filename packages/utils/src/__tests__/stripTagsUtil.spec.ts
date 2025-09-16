import { describe, expect, it } from 'vitest';

import { stripTags } from '../stripTagsUtil.js';

describe('stripTags()', () => {
  describe('with no optional parameters', () => {
    it('should not strip invalid tags', () => {
      const text = 'lorem ipsum < a> < div>';

      expect(stripTags(text)).toEqual(text);
    });

    it('should not strip when open tag without closing tag', () => {
      const text = 'lorem ipsum 1 < 3 and 3 > 5';

      expect(stripTags(text)).toEqual(text);
    });

    it('should remove simple HTML tags', () => {
      const html = '<a href="">lorem <strong>ipsum</strong></a>';
      const text = 'lorem ipsum';

      expect(stripTags(html)).toEqual(text);
    });

    it('should remove comments', () => {
      const html = '<!-- lorem -- ipsum -- --> dolor sit amet';
      const text = ' dolor sit amet';

      expect(stripTags(html)).toEqual(text);
    });

    it('should strip tags within comments', () => {
      const html = '<!-- <strong>lorem ipsum</strong> --> dolor sit';
      const text = ' dolor sit';

      expect(stripTags(html)).toEqual(text);
    });

    it('should not fail with nested quotes', () => {
      const html = '<article attr="foo \'bar\'">lorem</article> ipsum';
      const text = 'lorem ipsum';

      expect(stripTags(html)).toEqual(text);
    });

    it('should return html text content but html escaped when input is an instance of HTMLElement', () => {
      const text = 'I <3 TypeScript';
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = text;
      div.appendChild(span);

      expect(stripTags(div)).toEqual('I &lt;3 TypeScript'); // same text but html escaped
    });
  });

  describe('#allowed_tags', () => {
    it('should parse a string', () => {
      const html = '<strong>lorem ipsum</strong>';
      const allowed_tags = '<strong>';

      expect(stripTags(html, allowed_tags)).toEqual(html);
    });

    it('should take an array', () => {
      const html = '<strong>lorem <em>ipsum</em></strong>';
      const allowed_tags = ['strong', 'em'];

      expect(stripTags(html, allowed_tags)).toEqual(html);
    });
  });

  describe('with allowable_tags parameter', () => {
    it('should leave attributes when allowing HTML', () => {
      const html = '<a href="https://example.com">lorem ipsum</a>';
      const allowed_tags = '<a>';

      expect(stripTags(html, allowed_tags)).toEqual(html);
    });

    it('should strip extra < within tags', () => {
      const html = '<div<>>lorem ipsum</div>';
      const text = '<div>lorem ipsum</div>';
      const allowed_tags = '<div>';

      expect(stripTags(html, allowed_tags)).toEqual(text);
    });

    it('should strip <> within quotes', () => {
      const html = '<a href="<script>">lorem ipsum</a>';
      const text = '<a href="script">lorem ipsum</a>';
      const allowed_tags = '<a>';

      expect(stripTags(html, allowed_tags)).toEqual(text);
    });
  });

  describe('with tag_replacement parameter', () => {
    it('should replace tags with that parameter', () => {
      const html = 'Line One<br>Line Two';
      const allowed_tags: string[] = [];
      const tag_replacement = '\n';
      const text = 'Line One\nLine Two';

      expect(stripTags(html, allowed_tags, tag_replacement)).toEqual(text);
    });
  });

  describe('with input types not evaluated ', () => {
    it('should return same number input but converted as string', () => {
      const input = 0;
      expect(stripTags(input)).toBe('0');
    });

    it('should return same boolean input but converted as string', () => {
      const input = false;
      expect(stripTags(input)).toBe('false');
    });
  });

  describe('with errors', () => {
    it('should throw when input is not a string neither a number', () => {
      expect(() => stripTags(['type-confusion'] as any)).toThrow(`'html' parameter must be a string`);
    });
  });
});
