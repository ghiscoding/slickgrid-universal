import { describe, expect, it } from 'vitest';

import type { Column } from '../../interfaces/index';
import { progressBarFormatter } from '../progressBarFormatter';

describe('the Progress Bar Formatter', () => {
  it('should return an empty string when no value is provided', () => {
    const output = progressBarFormatter(1, 1, '', {} as Column, {}, {} as any);
    expect(output).toBe('');
  });

  it('should return empty string when non-numeric value is provided', () => {
    const output = progressBarFormatter(1, 1, 'hello', {} as Column, {}, {} as any);
    expect(output).toBe('');
  });

  it('should display a red color bar formatter when number 0 is provided', () => {
    const inputValue = 0;
    const barType = 'danger';
    const template = `<div class="progress"><div class="progress-bar progress-bar-${barType} bg-${barType}" role="progressbar" aria-valuenow="${inputValue}" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em; width: ${inputValue}%;">${inputValue}%</div></div>`;
    const output = progressBarFormatter(1, 1, inputValue, {} as Column, {}, {} as any) as HTMLDivElement;
    const innerDiv = output.querySelector('div.progress-bar') as HTMLDivElement;

    expect(output.outerHTML).toBe(template.trim());
    expect(innerDiv.className).toBe(`progress-bar progress-bar-${barType} bg-${barType}`);
    expect(innerDiv.role).toBe('progressbar');
    expect(innerDiv.ariaValueNow).toBe(String(inputValue));
    expect(innerDiv.ariaValueMin).toBe('0');
    expect(innerDiv.ariaValueMax).toBe('100');
  });

  it('should display a red color bar when value is a negative number', () => {
    const inputValue = -15;
    const barType = 'danger';
    const template = `<div class="progress"><div class="progress-bar progress-bar-${barType} bg-${barType}" role="progressbar" aria-valuenow="${inputValue}" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em; width: ${inputValue}%;">${inputValue}%</div></div>`;
    const output = progressBarFormatter(1, 1, inputValue, {} as Column, {}, {} as any) as HTMLDivElement;
    const innerDiv = output.querySelector('div.progress-bar') as HTMLDivElement;

    expect(output.outerHTML).toBe(template.trim());
    expect(innerDiv.className).toBe(`progress-bar progress-bar-${barType} bg-${barType}`);
    expect(innerDiv.role).toBe('progressbar');
    expect(innerDiv.ariaValueNow).toBe(String(inputValue));
    expect(innerDiv.ariaValueMin).toBe('0');
    expect(innerDiv.ariaValueMax).toBe('100');
  });

  it('should display a red color bar when value is between 30 and 69', () => {
    const inputValue1 = 30;
    const inputValue2 = 69;
    const barType = 'warning';
    const template1 = `<div class="progress"><div class="progress-bar progress-bar-${barType} bg-${barType}" role="progressbar" aria-valuenow="${inputValue1}" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em; width: ${inputValue1}%;">${inputValue1}%</div></div>`;
    const template2 = `<div class="progress"><div class="progress-bar progress-bar-${barType} bg-${barType}" role="progressbar" aria-valuenow="${inputValue2}" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em; width: ${inputValue2}%;">${inputValue2}%</div></div>`;

    const output1 = progressBarFormatter(1, 1, inputValue1, {} as Column, {}, {} as any) as HTMLDivElement;
    const output2 = progressBarFormatter(1, 1, inputValue2, {} as Column, {}, {} as any) as HTMLDivElement;
    const innerDiv1 = output1.querySelector('div.progress-bar') as HTMLDivElement;
    const innerDiv2 = output2.querySelector('div.progress-bar') as HTMLDivElement;

    expect(output1.outerHTML).toBe(template1.trim());
    expect(innerDiv1.className).toBe(`progress-bar progress-bar-${barType} bg-${barType}`);
    expect(innerDiv1.role).toBe('progressbar');
    expect(innerDiv1.ariaValueNow).toBe(String(inputValue1));
    expect(innerDiv1.ariaValueMin).toBe('0');
    expect(innerDiv1.ariaValueMax).toBe('100');

    expect(output2.outerHTML).toBe(template2.trim());
    expect(innerDiv2.className).toBe(`progress-bar progress-bar-${barType} bg-${barType}`);
    expect(innerDiv2.role).toBe('progressbar');
    expect(innerDiv2.ariaValueNow).toBe(String(inputValue2));
    expect(innerDiv2.ariaValueMin).toBe('0');
    expect(innerDiv2.ariaValueMax).toBe('100');
  });

  it('should display a green color bar when value greater or equal to 70 and is a type string', () => {
    const inputValue = '70';
    const barType = 'success';
    const template = `<div class="progress"><div class="progress-bar progress-bar-${barType} bg-${barType}" role="progressbar" aria-valuenow="${inputValue}" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em; width: ${inputValue}%;">${inputValue}%</div></div>`;
    const output = progressBarFormatter(1, 1, inputValue, {} as Column, {}, {} as any) as HTMLDivElement;
    const innerDiv = output.querySelector('div.progress-bar') as HTMLDivElement;

    expect(output.outerHTML).toBe(template.trim());
    expect(innerDiv.className).toBe(`progress-bar progress-bar-${barType} bg-${barType}`);
    expect(innerDiv.role).toBe('progressbar');
    expect(innerDiv.ariaValueNow).toBe(String(inputValue));
    expect(innerDiv.ariaValueMin).toBe('0');
    expect(innerDiv.ariaValueMax).toBe('100');
  });

  it('should display a green color percentage of 100% when number is greater than 100 is provided', () => {
    const inputValue = 125;
    const inputMaxValue = 100;
    const barType = 'success';
    const template = `<div class="progress"><div class="progress-bar progress-bar-${barType} bg-${barType}" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em; width: ${inputMaxValue}%;">${inputMaxValue}%</div></div>`;
    const output = progressBarFormatter(1, 1, inputValue, {} as Column, {}, {} as any) as HTMLElement;
    const innerDiv = output.querySelector('div.progress-bar') as HTMLDivElement;

    expect(output.outerHTML).toBe(template.trim());
    expect(innerDiv.className).toBe(`progress-bar progress-bar-${barType} bg-${barType}`);
    expect(innerDiv.role).toBe('progressbar');
    expect(innerDiv.ariaValueNow).toBe(String(inputMaxValue));
    expect(innerDiv.ariaValueMin).toBe('0');
    expect(innerDiv.ariaValueMax).toBe('100');
  });
});
