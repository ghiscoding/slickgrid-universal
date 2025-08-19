import { describe, expect, it, vi } from 'vitest';

import type { SlickGrid } from '../../core/index.js';
import type { Column, FormatterResultWithHtml } from '../../interfaces/index.js';
import { htmlDecodeFormatter } from '../htmlDecodeFormatter.js';

const gridStub = {
  focus: vi.fn(),
  getActiveCell: vi.fn(),
  getOptions: vi.fn(),
  getColumns: vi.fn(),
} as unknown as SlickGrid;

describe('HTML Decode Formatter', () => {
  it('should return null when no value is provided', () => {
    const input = null;
    const result = htmlDecodeFormatter(0, 0, input, { field: 'user' } as Column, {}, gridStub);

    expect(result).toBe('');
  });

  it('should return decoded format output when input value is encoded', () => {
    const inputValue = '&lt;div&gt;Hello&lt;/div&gt;';
    const result = htmlDecodeFormatter(0, 0, inputValue, { field: 'user' } as Column, {}, gridStub) as FormatterResultWithHtml;

    expect(result.html.textContent).toBe('<div>Hello</div>');
  });

  it('should return decoded format output when input value is encoded with multiple entities', () => {
    const inputValue = '&lt;div&gt;Hello &amp; Welcome&lt;/div&gt;';
    const result = htmlDecodeFormatter(0, 0, inputValue, { field: 'user' } as Column, {}, gridStub) as FormatterResultWithHtml;

    expect(result.html.textContent).toBe('<div>Hello & Welcome</div>');
  });

  it('should wrap the formatter output in a span element when "allowDocumentFragmentUsage" grid option is disabled', () => {
    const inputValue = '&lt;div&gt;Hello&lt;/div&gt;';
    vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce({ preventDocumentFragmentUsage: true });

    const result = htmlDecodeFormatter(0, 0, inputValue, { field: 'user' } as Column, {}, gridStub) as FormatterResultWithHtml;

    expect(result.html.textContent).toBe('<div>Hello</div>');
    expect((result.html as HTMLElement).outerHTML).toBe('<span>&lt;div&gt;Hello&lt;/div&gt;</span>'); // becomes encoded when passed to textContent
  });
});
