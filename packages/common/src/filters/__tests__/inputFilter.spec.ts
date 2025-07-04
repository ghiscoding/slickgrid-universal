import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InputFilter } from '../inputFilter.js';
import type { BackendServiceApi, Column, FilterArguments, GridOption } from '../../interfaces/index.js';
import { Filters } from '../filters.index.js';
import type { SlickGrid } from '../../core/index.js';

vi.useFakeTimers();

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getHeaderRowColumn: vi.fn(),
  render: vi.fn(),
} as unknown as SlickGrid;

describe('InputFilter', () => {
  let divContainer: HTMLDivElement;
  let filter: InputFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'duration', field: 'duration', filterable: true, filter: { model: Filters.input } };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: vi.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id),
    };

    filter = new InputFilter({} as any);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should initialize the filter', () => {
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('input.filter-duration').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.inputType).toBe('text');
  });

  it('should have an aria-label when creating the filter', () => {
    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

    expect(filterInputElm.ariaLabel).toBe('Duration Search Filter');
  });

  it('should have a placeholder when defined in its column definition', () => {
    const testValue = 'test placeholder';
    mockColumn.filter!.placeholder = testValue;

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

    expect(filterElm.placeholder).toBe(testValue);
  });

  describe('setValues method', () => {
    afterEach(() => {
      filter.destroy();
    });

    it('should call "setValues" and expect that value to be in the callback when triggered', () => {
      const spyCallback = vi.spyOn(filterArguments, 'callback');

      filter.init(filterArguments);
      filter.setValues('abc');
      const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

      filterElm.focus();
      filterElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));
      const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-duration.filled');

      expect(filterFilledElms.length).toBe(1);
      expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['abc'], shouldTriggerQuery: true });
    });

    it('should call "setValues" and expect that value to be in the callback when triggered by ENTER key', () => {
      const spyCallback = vi.spyOn(filterArguments, 'callback');

      filter.init(filterArguments);
      filter.setValues('abc');
      const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

      filterElm.focus();
      const event = new (window.window as any).Event('keyup', { bubbles: true, cancelable: true });
      event.key = 'Enter';
      filterElm.dispatchEvent(event);
      const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-duration.filled');

      expect(filterFilledElms.length).toBe(1);
      expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['abc'], shouldTriggerQuery: true });
    });

    it('should call "setValues" with an operator and with extra spaces at the beginning of the searchTerms and trim value when "enableFilterTrimWhiteSpace" is enabled in grid options', () => {
      gridOptionMock.enableFilterTrimWhiteSpace = true;
      const spyCallback = vi.spyOn(filterArguments, 'callback');

      filter.init(filterArguments);
      filter.setValues('    abc ', 'EQ');
      const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

      filterElm.focus();
      filterElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));
      const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-duration.filled');

      expect(filterFilledElms.length).toBe(1);
      expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['=abc'], shouldTriggerQuery: true });
    });

    it('should call "setValues" with extra spaces at the beginning of the searchTerms and trim value when "enableTrimWhiteSpace" is enabled in the column filter', () => {
      gridOptionMock.enableFilterTrimWhiteSpace = false;
      mockColumn.filter!.enableTrimWhiteSpace = true;
      const spyCallback = vi.spyOn(filterArguments, 'callback');

      filter.init(filterArguments);
      filter.setValues('    abc ');
      const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

      filterElm.focus();
      filterElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));
      const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-duration.filled');

      expect(filterFilledElms.length).toBe(1);
      expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['abc'], shouldTriggerQuery: true });
    });

    it('should be able to call "setValues" and set empty values and the input to not have the "filled" css class', () => {
      filter.init(filterArguments);
      filter.setValues('9');
      let filledInputElm = divContainer.querySelector('.search-filter.filter-duration.filled') as HTMLInputElement;

      expect(filledInputElm).toBeTruthy();

      filter.setValues('');
      filledInputElm = divContainer.querySelector('.search-filter.filter-duration.filled') as HTMLInputElement;
      expect(filledInputElm).toBeFalsy();
    });

    it('should be able to call "setValues" and call an event trigger', () => {
      const spyCallback = vi.spyOn(filterArguments, 'callback');
      filter.init(filterArguments);
      filter.setValues('9', '>', true);
      const filledInputElm = divContainer.querySelector('.search-filter.filter-duration.filled') as HTMLInputElement;

      expect(filledInputElm).toBeTruthy();
      expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: '', searchTerms: ['>9'], shouldTriggerQuery: true });
    });

    it('should call "setValues" and include an operator and expect the operator to show up in the output search string shown in the filter input text value', () => {
      filter.init(filterArguments);

      filter.setValues('abc', '<>');
      expect(filter.getValues()).toBe('<>abc');

      filter.setValues('abc', '!=');
      expect(filter.getValues()).toBe('!=abc');

      filter.setValues('abc', '=');
      expect(filter.getValues()).toBe('=abc');

      filter.setValues('abc', '==');
      expect(filter.getValues()).toBe('==abc');

      filter.setValues(123, '<');
      expect(filter.getValues()).toBe('<123');

      filter.setValues(123, '<=');
      expect(filter.getValues()).toBe('<=123');

      filter.setValues(123, '>');
      expect(filter.getValues()).toBe('>123');

      filter.setValues(123, '>=');
      expect(filter.getValues()).toBe('>=123');

      filter.setValues('', '=');
      expect(filter.getValues()).toBe('=');

      filter.setValues('', '!=');
      expect(filter.getValues()).toBe('!=');

      filter.setValues('abc', 'EndsWith');
      expect(filter.getValues()).toBe('*abc');

      filter.setValues('abc', '*z');
      expect(filter.getValues()).toBe('*abc');

      filter.setValues('abc', 'StartsWith');
      expect(filter.getValues()).toBe('abc*');

      filter.setValues('abc', 'a*');
      expect(filter.getValues()).toBe('abc*');

      filter.setValues('abc', 'EQ');
      expect(filter.getValues()).toBe('=abc');

      filter.setValues('abc', 'GE');
      expect(filter.getValues()).toBe('>=abc');

      filter.setValues('abc', 'GT');
      expect(filter.getValues()).toBe('>abc');

      filter.setValues('abc', 'NE');
      expect(filter.getValues()).toBe('!=abc');

      filter.setValues('abc', 'LE');
      expect(filter.getValues()).toBe('<=abc');

      filter.setValues('abc', 'LT');
      expect(filter.getValues()).toBe('<abc');
    });
  });

  it('should trigger the callback method when user types something in the input', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

    filterElm.focus();
    filterElm.value = 'a';
    filterElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['a'], shouldTriggerQuery: true });
  });

  it('should trigger the callback method with a delay when "filterTypingDebounce" is set in grid options and user types something in the input', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    gridOptionMock.filterTypingDebounce = 2;

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

    filterElm.focus();
    filterElm.value = 'a';
    filterElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    vi.advanceTimersByTime(2);

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['a'], shouldTriggerQuery: true });
  });

  it('should trigger the callback method with a delay when BackendService is used with a "filterTypingDebounce" is set in grid options and user types something in the input', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    gridOptionMock.defaultBackendServiceFilterTypingDebounce = 2;
    gridOptionMock.backendServiceApi = {
      service: {},
    } as unknown as BackendServiceApi;

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

    filterElm.focus();
    filterElm.value = 'a';
    filterElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    vi.advanceTimersByTime(2);

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['a'], shouldTriggerQuery: true });
  });

  it('should create the input filter with a default search term when passed as a filter argument', () => {
    filterArguments.searchTerms = ['xyz'];
    mockColumn.filter!.operator = 'EQ';

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;

    expect(filterElm.value).toBe('=xyz');
  });

  it('should expect the input not to have the "filled" css class when the search term provided is an empty string', () => {
    filterArguments.searchTerms = [''];
    mockColumn.filter!.operator = 'EQ';

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-duration.filled');

    expect(filterElm.value).toBe('=');
    expect(filterFilledElms.length).toBe(0);
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    filter.clear();
    const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-duration.filled');

    expect(filterElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    filter.clear(false);
    const filterElm = divContainer.querySelector('input.filter-duration') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-duration.filled');

    expect(filterElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });
});
