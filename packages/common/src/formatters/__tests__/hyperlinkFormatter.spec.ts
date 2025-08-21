import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Column, GridOption } from '../../interfaces/index.js';
import { hyperlinkFormatter } from '../hyperlinkFormatter.js';
import * as utils from '../../core/utils.js';
import type { TrustedHTML } from 'trusted-types/lib/index.js';

describe('the Hyperlink Formatter', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'runOptionalHtmlSanitizer').mockImplementation((dirtyHtml: unknown, sanitizer?: (str: string) => string | TrustedHTML) => {
      if (sanitizer) {
        // Coerce TrustedHTML to string for testing
        const result = sanitizer(String(dirtyHtml));
        return typeof result === 'string' ? result : String(result);
      }
      return String(dirtyHtml);
    });
  });

  it('should return empty string when value is not an hyperlink and is empty', () => {
    const result = hyperlinkFormatter(0, 0, '', {} as Column, {}, {} as GridOption);
    expect(result).toBe('');
  });

  it('should return original value when value is not an hyperlink', () => {
    const result = hyperlinkFormatter(0, 0, 'anything', {} as Column, {}, {} as GridOption);
    expect(result).toBe('anything');
  });

  it('should return original value when URL passed through the generic params "hyperlinkUrl" is not a valid hyperlink', () => {
    const hyperlinkUrl1 = '';
    const inputValue = 'Company Name';
    const result1 = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl: hyperlinkUrl1 } } as Column, {}, {} as GridOption);
    expect(result1).toBe(inputValue);
  });

  it('should return original value when value is not a valid hyperlink', () => {
    const inputValue1 = 'http:/something.com';
    const inputValue2 = 'https//something.com';
    const inputValue3 = 'ftpp://something.com';

    const result1 = hyperlinkFormatter(0, 0, inputValue1, {} as Column, {}, {} as GridOption);
    const result2 = hyperlinkFormatter(0, 0, inputValue2, {} as Column, {}, {} as GridOption);
    const result3 = hyperlinkFormatter(0, 0, inputValue3, {} as Column, {}, {} as GridOption);

    expect(result1).toBe(inputValue1);
    expect(result2).toBe(inputValue2);
    expect(result3).toBe(inputValue3);
  });

  it('should return an href link when input value is a valid hyperlink', () => {
    const inputValue1 = 'http://something.com';
    const inputValue2 = 'https://something.com';
    const inputValue3 = 'ftp://something.com';

    const result1 = hyperlinkFormatter(0, 0, inputValue1, {} as Column, {}, {} as GridOption);
    const result2 = hyperlinkFormatter(0, 0, inputValue2, {} as Column, {}, {} as GridOption);
    const result3 = hyperlinkFormatter(0, 0, inputValue3, {} as Column, {}, {} as GridOption);

    expect((result1 as HTMLElement).outerHTML).toBe(`<a href="${inputValue1}">${inputValue1}</a>`);
    expect((result2 as HTMLElement).outerHTML).toBe(`<a href="${inputValue2}">${inputValue2}</a>`);
    expect((result3 as HTMLElement).outerHTML).toBe(`<a href="${inputValue3}">${inputValue3}</a>`);
  });

  it('should return an href link with a different text when input value is a valid hyperlink and has the generic params "hyperlinkText" provided', () => {
    const inputValue1 = 'http://something.com';
    const inputValue2 = 'https://something.com';
    const inputValue3 = 'ftp://something.com';
    const linkText = 'Company Website';

    const result1 = hyperlinkFormatter(0, 0, inputValue1, { params: { hyperlinkText: linkText } } as Column, {}, {} as GridOption);
    const result2 = hyperlinkFormatter(0, 0, inputValue2, { params: { hyperlinkText: linkText } } as Column, {}, {} as GridOption);
    const result3 = hyperlinkFormatter(0, 0, inputValue3, { params: { hyperlinkText: linkText } } as Column, {}, {} as GridOption);

    expect((result1 as HTMLElement).outerHTML).toBe(`<a href="${inputValue1}">${linkText}</a>`);
    expect((result2 as HTMLElement).outerHTML).toBe(`<a href="${inputValue2}">${linkText}</a>`);
    expect((result3 as HTMLElement).outerHTML).toBe(`<a href="${inputValue3}">${linkText}</a>`);
  });

  it('should return an href link with a different url than value it is provided as a valid hyperlink through the generic params "hyperlinkUrl"', () => {
    const hyperlinkUrl1 = 'http://something.com';
    const hyperlinkUrl2 = 'https://something.com';
    const hyperlinkUrl3 = 'ftp://something.com';
    const inputValue = 'Company Name';

    const result1 = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl: hyperlinkUrl1 } } as Column, {}, {} as GridOption);
    const result2 = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl: hyperlinkUrl2 } } as Column, {}, {} as GridOption);
    const result3 = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl: hyperlinkUrl3 } } as Column, {}, {} as GridOption);

    expect((result1 as HTMLElement).outerHTML).toBe(`<a href="${hyperlinkUrl1}">${inputValue}</a>`);
    expect((result2 as HTMLElement).outerHTML).toBe(`<a href="${hyperlinkUrl2}">${inputValue}</a>`);
    expect((result3 as HTMLElement).outerHTML).toBe(`<a href="${hyperlinkUrl3}">${inputValue}</a>`);
  });

  it('should return an href link when hyperlink URL & Text are provided through the generic params "hyperlinkUrl" and "hyperlinkText"', () => {
    const hyperlinkUrl1 = 'http://something.com';
    const hyperlinkUrl2 = 'https://something.com';
    const hyperlinkUrl3 = 'ftp://something.com';
    const linkText1 = 'Company ABC';
    const linkText2 = 'Company DEF';
    const linkText3 = 'Company XYZ';
    const inputValue = 'anything';

    const result1 = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl: hyperlinkUrl1, hyperlinkText: linkText1 } } as Column, {}, {} as GridOption);
    const result2 = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl: hyperlinkUrl2, hyperlinkText: linkText2 } } as Column, {}, {} as GridOption);
    const result3 = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl: hyperlinkUrl3, hyperlinkText: linkText3 } } as Column, {}, {} as GridOption);

    expect((result1 as HTMLElement).outerHTML).toBe(`<a href="${hyperlinkUrl1}">${linkText1}</a>`);
    expect((result2 as HTMLElement).outerHTML).toBe(`<a href="${hyperlinkUrl2}">${linkText2}</a>`);
    expect((result3 as HTMLElement).outerHTML).toBe(`<a href="${hyperlinkUrl3}">${linkText3}</a>`);
  });

  it('should sanitize href link when sanitizer is provided in grid options', () => {
    const hyperlinkText = 'Company ABC';
    const hyperlinkUrl = 'http://something.com';
    const linkText = 'Company ABC';
    const inputValue = 'anything';
    const gridOptions: GridOption = { sanitizer: (str: string) => `${str}-sanitized` };

    const result = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl, hyperlinkText } } as Column, {}, gridOptions);

    expect((result as HTMLElement).outerHTML).toBe(`<a href="${hyperlinkUrl}-sanitized">${linkText}-sanitized</a>`);
  });

  it('should not sanitize href link when no sanitizer is provided in grid options', () => {
    const hyperlinkText = 'Company ABC';
    const hyperlinkUrl = 'http://something.com';
    const linkText = 'Company ABC';
    const inputValue = 'anything';

    const result = hyperlinkFormatter(0, 0, inputValue, { params: { hyperlinkUrl, hyperlinkText } } as Column, {}, {} as GridOption);

    expect((result as HTMLElement).outerHTML).toBe(`<a href="${hyperlinkUrl}">${linkText}</a>`);
  });
});
