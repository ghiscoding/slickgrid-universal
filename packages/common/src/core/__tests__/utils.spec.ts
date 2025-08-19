import { describe, expect, it } from 'vitest';

import { runOptionalHtmlSanitizer } from '../utils.js';

describe('Sanitizer', () => {
  it('should use sanitizer when provided in grid options and expect <script> to be removed', () => {
    const sanitizer = (dirtyHtml: string) =>
      typeof dirtyHtml === 'string'
        ? dirtyHtml.replace(
            /(\b)(on[a-z]+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script(>*)|(&lt;)(\/*)(script|script defer)(.*)(&gt;|&gt;">)/gi,
            ''
          )
        : dirtyHtml;

    const dirtyHtml = '<div class="some-class"><script>alert("hello world")</script></div>';
    const cleanHtml = '<div class="some-class"></div>';

    expect(runOptionalHtmlSanitizer(dirtyHtml, { sanitizer })).toBe(cleanHtml);
  });

  it('should return same input string when no sanitizer provided', () => {
    const dirtyHtml = '<div class="some-class"><script>alert("hello world")</script></div>';

    expect(runOptionalHtmlSanitizer(dirtyHtml, { sanitizer: undefined })).toBe(dirtyHtml);
  });
});
