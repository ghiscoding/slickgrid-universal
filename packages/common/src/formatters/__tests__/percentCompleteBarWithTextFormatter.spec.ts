import { describe, expect, it } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { percentCompleteBarWithTextFormatter } from '../percentCompleteBarWithTextFormatter.js';

describe('the Percent Complete with Text Formatter', () => {
  it('should return an empty string when no value is provided', () => {
    const output = percentCompleteBarWithTextFormatter(1, 1, '', {} as Column, {}, {} as any);
    expect(output).toBe('');
  });

  it('should return empty string when non-numeric value is provided', () => {
    const output = percentCompleteBarWithTextFormatter(1, 1, 'hello', {} as Column, {}, {} as any);
    expect(output).toBe('');
  });

  it('should display a red color bar formatter when number 0 is provided', () => {
    const input = 0;
    const color = 'red';
    const output = percentCompleteBarWithTextFormatter(1, 1, input, {} as Column, {}, {} as any);
    expect((output as HTMLElement).outerHTML).toBe(
      `<div class="percent-complete-bar-with-text" title="${input}%" style="background: ${color}; width: ${input}%;">${input}%</div>`
    );
  });

  it('should display a red color bar when value is a negative number', () => {
    const input = -15;
    const color = 'red';
    const output = percentCompleteBarWithTextFormatter(1, 1, input, {} as Column, {}, {} as any);
    expect((output as HTMLElement).outerHTML).toBe(
      `<div class="percent-complete-bar-with-text" title="${input}%" style="background: ${color};">${input}%</div>`
    );
  });

  it('should display a silver color bar when value is between 30 and 69', () => {
    const input1 = 30;
    const input2 = 69;
    const color = 'silver';
    const output1 = percentCompleteBarWithTextFormatter(1, 1, input1, {} as Column, {}, {} as any);
    const output2 = percentCompleteBarWithTextFormatter(1, 1, input2, {} as Column, {}, {} as any);
    expect((output1 as HTMLElement).outerHTML).toBe(
      `<div class="percent-complete-bar-with-text" title="${input1}%" style="background: ${color}; width: ${input1}%;">${input1}%</div>`
    );
    expect((output2 as HTMLElement).outerHTML).toBe(
      `<div class="percent-complete-bar-with-text" title="${input2}%" style="background: ${color}; width: ${input2}%;">${input2}%</div>`
    );
  });

  it('should display a green color bar when value greater or equal to 70 and is a type string', () => {
    const input = '70';
    const color = 'green';
    const output = percentCompleteBarWithTextFormatter(1, 1, input, {} as Column, {}, {} as any);
    expect((output as HTMLElement).outerHTML).toBe(
      `<div class="percent-complete-bar-with-text" title="${input}%" style="background: ${color}; width: ${input}%;">${input}%</div>`
    );
  });

  it('should display a green color bar with percentage of 100% when number is greater than 100 is provided', () => {
    const input = 125;
    const color = 'green';
    const output = percentCompleteBarWithTextFormatter(1, 1, input, {} as Column, {}, {} as any);
    expect((output as HTMLElement).outerHTML).toBe(
      `<div class="percent-complete-bar-with-text" title="100%" style="background: ${color}; width: 100%;">100%</div>`
    );
  });
});
