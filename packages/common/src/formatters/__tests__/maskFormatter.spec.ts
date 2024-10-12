import { describe, expect, it, vi } from 'vitest';

import type { SlickGrid } from '../../core/index.js';
import type { Column } from '../../interfaces/index.js';
import { maskFormatter } from '../maskFormatter.js';

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  focus: vi.fn(),
  getActiveCell: vi.fn(),
  getOptions: vi.fn(),
  getColumns: vi.fn(),
} as unknown as SlickGrid;

describe('the ArrayObjectToCsv Formatter', () => {
  it('should throw an error when omitting to pass "propertyNames" to "params"', () => {
    expect(() => maskFormatter(0, 0, 'anything', {} as Column, {}, {} as any))
      .toThrow('You must provide a "mask" via the generic "params" options');
  });

  it('should throw an error when omitting to pass "propertyNames" to "params"', () => {
    const params = { mask: '' };
    expect(() => maskFormatter(0, 0, 'anything', { field: 'user', params } as Column, {}, gridStub))
      .toThrow('You must provide a "mask" via the generic "params" options');
  });

  it('should return null when no value is provided', () => {
    const input = null;
    const params = { mask: '(000) 000-0000' };
    const result = maskFormatter(0, 0, input, { field: 'user', params } as Column, {}, gridStub);

    expect(result).toBe(null);
  });

  it('should return formatted output according to mask when mask includes only numbers', () => {
    const params = { mask: '(000) 000-0000' };
    const inputValue = '123456789013';
    const result = maskFormatter(0, 0, inputValue, { field: 'user', params } as Column, {}, gridStub);

    expect((result as DocumentFragment).textContent).toBe('(123) 456-7890');
  });

  it('should return formatted output without extra digits that are not included in the mask', () => {
    const params = { mask: '(000) 000-0000' };
    const inputValue = '1234567890135455454';
    const result = maskFormatter(0, 0, inputValue, { field: 'user', params } as Column, {}, gridStub);

    expect((result as DocumentFragment).textContent).toBe('(123) 456-7890');
  });

  it('should return partially formatted output when input (digits only) length is shorter than mask', () => {
    const params = { mask: '(000) 000-0000' };
    const inputValue = '123456';
    const result = maskFormatter(0, 0, inputValue, { field: 'user', params } as Column, {}, gridStub);

    expect((result as DocumentFragment).textContent).toBe('(123) 456-');
  });

  it('should return formatted output (postal code) according to mask when mask includes both numbers and characters', () => {
    const params = { mask: 'A0A 0A0' };
    const inputValue = 'H0H0H0';
    const result = maskFormatter(0, 0, inputValue, { field: 'user', params } as Column, {}, gridStub);

    expect((result as DocumentFragment).textContent).toBe('H0H 0H0');
  });

  it('should return formatted output (postal code) without extra characters that are not included in the mask', () => {
    const params = { mask: 'A0A 0A0' };
    const inputValue = 'H0H0H0324343asdds';
    const result = maskFormatter(0, 0, inputValue, { field: 'user', params } as Column, {}, gridStub);

    expect((result as DocumentFragment).textContent).toBe('H0H 0H0');
  });

  it('should return partially formatted output when input (characters only) length is shorter than mask', () => {
    const params = { mask: 'A0A 0A0' };
    const inputValue = 'H0H0';
    const result = maskFormatter(0, 0, inputValue, { field: 'user', params } as Column, {}, gridStub);

    expect((result as DocumentFragment).textContent).toBe('H0H 0');
  });

  it('should wrap the formatter output in a span element when "allowDocumentFragmentUsage" grid option is disabled', () => {
    const params = { mask: '(000) 000-0000' };
    const inputValue = '123456789013';
    vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce({ preventDocumentFragmentUsage: true });

    const result = maskFormatter(0, 0, inputValue, { field: 'user', params } as Column, {}, gridStub);

    expect((result as HTMLElement).outerHTML).toBe('<span>(123) 456-7890</span>');
  });
});
