import { describe, expect, it } from 'vitest';

import type { Column, GridOption } from '../../interfaces/index.js';
import { percentCompleteBarFormatter } from '../percentCompleteBarFormatter.js';

describe('the Percent Complete Formatter', () => {
  it('should return an empty string when no value is provided', () => {
    const output = percentCompleteBarFormatter(1, 1, '', {} as Column, {}, {} as GridOption);
    expect(output).toBe('');
  });

  it('should return empty string when non-numeric value is provided', () => {
    const output = percentCompleteBarFormatter(1, 1, 'hello', {} as Column, {}, {} as GridOption);
    expect(output).toBe('');
  });

  it('should display a red color bar formatter when number 0 is provided', () => {
    const input = 0;
    const color = 'red';
    const output = percentCompleteBarFormatter(1, 1, input, {} as Column, {}, {} as GridOption);
    expect((output as HTMLElement).outerHTML).toBe(
      `<span class="percent-complete-bar" title="${input}%" style="background: ${color}; width: ${input}%;"></span>`
    );
  });

  it('should display a red color bar when value is a negative number', () => {
    const input = -15;
    const color = 'red';
    const output = percentCompleteBarFormatter(1, 1, input, {} as Column, {}, {} as GridOption);
    expect((output as HTMLElement).outerHTML).toBe(`<span class="percent-complete-bar" title="${input}%" style="background: ${color};"></span>`);
  });

  it('should display a silver color bar when value is between 30 and 69', () => {
    const input1 = 30;
    const input2 = 69;
    const color = 'silver';
    const output1 = percentCompleteBarFormatter(1, 1, input1, {} as Column, {}, {} as GridOption);
    const output2 = percentCompleteBarFormatter(1, 1, input2, {} as Column, {}, {} as GridOption);
    expect((output1 as HTMLElement).outerHTML).toBe(
      `<span class="percent-complete-bar" title="${input1}%" style="background: ${color}; width: ${input1}%;"></span>`
    );
    expect((output2 as HTMLElement).outerHTML).toBe(
      `<span class="percent-complete-bar" title="${input2}%" style="background: ${color}; width: ${input2}%;"></span>`
    );
  });

  it('should display a green color bar when value greater or equal to 70 and is a type string', () => {
    const input = '70';
    const color = 'green';
    const output = percentCompleteBarFormatter(1, 1, input, {} as Column, {}, {} as GridOption);
    expect((output as HTMLElement).outerHTML).toBe(
      `<span class="percent-complete-bar" title="${input}%" style="background: ${color}; width: ${input}%;"></span>`
    );
  });

  it('should display a green color bar with percentage of 100% when number is greater than 100 is provided', () => {
    const input = 125;
    const color = 'green';
    const output = percentCompleteBarFormatter(1, 1, input, {} as Column, {}, {} as GridOption);
    expect((output as HTMLElement).outerHTML).toBe(`<span class="percent-complete-bar" title="100%" style="background: ${color}; width: 100%;"></span>`);
  });
});
