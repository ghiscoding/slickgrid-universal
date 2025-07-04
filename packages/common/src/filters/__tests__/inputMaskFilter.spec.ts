import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InputMaskFilter } from '../inputMaskFilter.js';
import type { Column, FilterArguments, GridOption } from '../../interfaces/index.js';
import { Filters } from '../filters.index.js';
import type { SlickGrid } from '../../core/index.js';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getHeaderRowColumn: vi.fn(),
  render: vi.fn(),
} as unknown as SlickGrid;

describe('InputMaskFilter', () => {
  let divContainer: HTMLDivElement;
  let filter: InputMaskFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'mask', field: 'mask', filterable: true, filter: { model: Filters.inputMask, operator: 'EQ' } };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: vi.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id),
    };

    filter = new InputMaskFilter({} as any);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should throw an error when no mask provided in params', () => {
    expect(() => filter.init(filterArguments)).toThrow('[Slickgrid-Universal] The Filters.inputMask requires the mask to be passed in the filter params');
  });

  it('should initialize the filter and expect an input of type text', () => {
    mockColumn.filter!.params = { mask: '000-000-0000' };
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('input.filter-mask').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.inputType).toBe('text');
    expect(filter.inputMask).toBe('000-000-0000');
  });

  it('should have an aria-label when creating the filter', () => {
    mockColumn.filter!.params = { mask: '000-000-0000' };
    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;

    expect(filterInputElm.ariaLabel).toBe('Mask Search Filter');
  });

  it('should initialize the filter and define the mask in the column definition instead and get the same output', () => {
    mockColumn.params = { mask: '000-000-0000' };
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('input.filter-mask').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.inputType).toBe('text');
    expect(filter.inputMask).toBe('000-000-0000');
  });

  it('should call "setValues" and expect that value to be in the callback when triggered', () => {
    mockColumn.filter!.params = { mask: '000-000-0000' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('1234567890');
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['1234567890'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with an operator and with 10 digits and expect input value to be formatted as a phone as the mask format specifies', () => {
    mockColumn.filter!.params = { mask: '(000) 000-0000' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('1234567890', 'EQ');
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    expect(filterElm.value).toBe('(123) 456-7890');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), {
      columnDef: mockColumn,
      operator: 'EQ',
      searchTerms: ['1234567890'],
      shouldTriggerQuery: true,
    });
  });

  it('should call "setValues" with 10 digits and other extra characters but still expect the value to be formatted as a phone as the mask format specifies', () => {
    mockColumn.filter!.params = { mask: '(000) 000-0000' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('1234567890abc');
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    expect(filterElm.value).toBe('(123) 456-7890');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['1234567890'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with 10 digits and expect it to work with using 9 instead of 0 in the mask', () => {
    mockColumn.filter!.params = { mask: '(999) 999-9999' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('1234567890');
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    expect(filterElm.value).toBe('(123) 456-7890');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['1234567890'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with a characters & numbers mask (e.g. postal code) and expect it to returned a formatted string', () => {
    mockColumn.filter!.params = { mask: 'A0A 0A0' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('H1H1H1');
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    expect(filterElm.value).toBe('H1H 1H1');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['H1H1H1'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with 10 digits and expect it to work even if input as extra spaces at the beginning when "enableFilterTrimWhiteSpace" is enabled in grid options', () => {
    mockColumn.filter!.params = { mask: '(999) 999-9999' };
    gridOptionMock.enableFilterTrimWhiteSpace = true;
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('   1234567890  ');
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    expect(filterElm.value).toBe('(123) 456-7890');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['1234567890'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with 10 digits and expect it to work even if input as extra spaces at the beginning when "enableTrimWhiteSpace" is enabled in the column filter', () => {
    mockColumn.filter!.params = { mask: '(999) 999-9999' };
    gridOptionMock.enableFilterTrimWhiteSpace = false;
    mockColumn.filter!.enableTrimWhiteSpace = true;
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('   1234567890  ');
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    expect(filterElm.value).toBe('(123) 456-7890');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['1234567890'], shouldTriggerQuery: true });
  });

  it('should call "setValues" all invalid characters and expect an empty shell as it does not match the mask', () => {
    mockColumn.filter!.params = { mask: '(000) 000-0000' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('abc');
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    expect(filterElm.value).toBe('() -');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: [''], shouldTriggerQuery: true });
  });

  it('should trigger the callback method when user types something in the input', () => {
    mockColumn.filter!.params = { mask: '(000) 000-0000' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;

    filterElm.focus();
    filterElm.value = '1';
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['1'], shouldTriggerQuery: true });
  });

  it('should create the input filter with a default search term when passed as a filter argument', () => {
    mockColumn.filter!.params = { mask: '(000) 000-0000' };
    filterArguments.searchTerms = ['123'];

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;

    expect(filterElm.value).toBe('=123');
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    mockColumn.filter!.params = { mask: '(000) 000-0000' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['123'];

    filter.init(filterArguments);
    filter.clear();
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;

    expect(filterElm.value).toBe('');
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    mockColumn.filter!.params = { mask: '(000) 000-0000' };
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['123'];

    filter.init(filterArguments);
    filter.clear(false);
    const filterElm = divContainer.querySelector('input.filter-mask') as HTMLInputElement;

    expect(filterElm.value).toBe('');
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });
});
