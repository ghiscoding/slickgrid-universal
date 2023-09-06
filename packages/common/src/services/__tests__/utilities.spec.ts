import 'jest-extended';
import { EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { of } from 'rxjs';

import { FieldType, OperatorType } from '../../enums/index';
import { Column, GridOption } from '../../interfaces/index';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub';
import {
  addTreeLevelByMutation,
  addTreeLevelAndAggregatorsByMutation,
  cancellablePromise,
  CancelledException,
  castObservableToPromise,
  flattenToParentChildArray,
  unflattenParentChildArrayToTree,
  decimalFormatted,
  findItemInTreeStructure,
  findOrDefault,
  formatNumber,
  getColumnFieldType,
  getDescendantProperty,
  getTranslationPrefix,
  isColumnDateType,
  mapMomentDateFormatWithFieldType,
  mapFlatpickrDateFormatWithFieldType,
  mapOperatorByFieldType,
  mapOperatorToShorthandDesignation,
  mapOperatorType,
  parseUtcDate,
  thousandSeparatorFormatted,
  unsubscribeAll,
} from '../utilities';
import { SumAggregator } from '../../aggregators';

describe('Service/Utilies', () => {
  describe('unflattenParentChildArrayToTree method', () => {
    it('should take a parent/child array and return a hierarchical array structure', () => {
      const input = [
        { id: 18, size: 90, dateModified: '2015-03-03', file: 'something.txt', parentId: null, },
        { id: 11, file: 'Music', parentId: null, },
        { id: 12, file: 'mp3', parentId: 11, },
        { id: 16, file: 'rock', parentId: 12, },
        { id: 17, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, parentId: 16, },
        { id: 14, file: 'pop', parentId: 12, },
        { id: 15, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, parentId: 14, },
      ];

      const output = unflattenParentChildArrayToTree(input, { parentPropName: 'parentId', childrenPropName: 'files' });

      expect(output).toEqual([
        {
          id: 11, __treeLevel: 0, __collapsed: false, parentId: null, file: 'Music', files: [{
            id: 12, __treeLevel: 1, __collapsed: false, parentId: 11, file: 'mp3', files: [
              { id: 14, __treeLevel: 2, __collapsed: false, parentId: 12, file: 'pop', files: [{ id: 15, __treeLevel: 3, parentId: 14, file: 'theme.mp3', dateModified: '2015-03-01', size: 85, }] },
              { id: 16, __treeLevel: 2, __collapsed: false, parentId: 12, file: 'rock', files: [{ id: 17, __treeLevel: 3, parentId: 16, file: 'soft.mp3', dateModified: '2015-05-13', size: 98, }] },
            ]
          }]
        },
        { id: 18, __treeLevel: 0, parentId: null, file: 'something.txt', dateModified: '2015-03-03', size: 90, },
      ]);
    });

    it('should take a parent/child array with aggregators and return a hierarchical array structure', () => {
      const input = [
        { id: 18, size: 90, dateModified: '2015-03-03', file: 'something.txt', parentId: null, },
        { id: 11, file: 'Music', parentId: null, __treeTotals: { count: { size: 2, }, sum: { size: (98 + 85), }, }, },
        { id: 12, file: 'mp3', parentId: 11, __treeTotals: { count: { size: 2, }, sum: { size: (98 + 85), }, }, },
        { id: 16, file: 'rock', parentId: 12, __treeTotals: { count: { size: 2, }, sum: { size: 98, }, }, },
        { id: 17, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, parentId: 16, },
        { id: 14, file: 'pop', parentId: 12, __treeTotals: { count: { size: 2, }, sum: { size: 85, }, }, },
        { id: 15, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, parentId: 14, },
      ];

      const output = unflattenParentChildArrayToTree(input, { aggregators: [new SumAggregator('size')], parentPropName: 'parentId', childrenPropName: 'files' });

      expect(output).toEqual([
        {
          id: 11, __treeLevel: 0, __collapsed: false, parentId: null, file: 'Music', __treeTotals: { count: { size: 2, }, sum: { size: (98 + 85), }, }, files: [{
            id: 12, __treeLevel: 1, __collapsed: false, parentId: 11, file: 'mp3', __treeTotals: { count: { size: 2, }, sum: { size: (98 + 85), }, }, files: [
              { id: 14, __treeLevel: 2, __collapsed: false, parentId: 12, file: 'pop', __treeTotals: { count: { size: 1, }, sum: { size: 85, }, }, files: [{ id: 15, __treeLevel: 3, parentId: 14, file: 'theme.mp3', dateModified: '2015-03-01', size: 85, }] },
              { id: 16, __treeLevel: 2, __collapsed: false, parentId: 12, file: 'rock', __treeTotals: { count: { size: 1, }, sum: { size: 98, }, }, files: [{ id: 17, __treeLevel: 3, parentId: 16, file: 'soft.mp3', dateModified: '2015-05-13', size: 98, }] },
            ]
          }]
        },
        { id: 18, __treeLevel: 0, parentId: null, file: 'something.txt', dateModified: '2015-03-03', size: 90, },
      ]);
    });
  });

  describe('cancellablePromise method', () => {
    let rxjs: RxJsResourceStub;
    beforeEach(() => {
      rxjs = new RxJsResourceStub();
    });

    it('should return the same input when it is not a Promise provided', () => {
      const notPromise = () => true;
      const wrappedOutput = cancellablePromise(notPromise as any);

      expect(wrappedOutput).toEqual(notPromise);
    });

    it('should throw a CancelledException when calling the "cancel" method on the wrapped cancellable promise', (done) => {
      const promise = new Promise((resolve) => resolve(true));
      const wrappedPromise = cancellablePromise(promise);

      wrappedPromise.promise.catch((e) => {
        expect(e).toEqual(new CancelledException('Cancelled Promise'));
        done();
      });
      const output = wrappedPromise.cancel();
      expect(output).toBeTrue();
    });

    it('should execute Promise as regular when it is not cancelled', (done) => {
      const promise = new Promise((resolve) => resolve(true));
      const wrappedPromise = cancellablePromise(promise);

      wrappedPromise.promise.then((output) => {
        expect(output).toBeTrue();
        done();
      });
    });
  });

  describe('castObservableToPromise method', () => {
    let rxjs: RxJsResourceStub;
    beforeEach(() => {
      rxjs = new RxJsResourceStub();
    });

    it('should throw an error when argument provided is not a Promise neither an Observable', async () => {
      expect(() => castObservableToPromise(rxjs, null as any)).toThrowError('Something went wrong,');
    });

    it('should return original Promise when argument is already a Promise', async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve('hello'), 1));
      const castPromise = castObservableToPromise(rxjs, promise);
      expect(promise).toBe(castPromise);
    });

    it('should be able to cast an Observable to a Promise', () => {
      const inputArray = ['hello', 'world'];
      const observable = of(inputArray);

      castObservableToPromise(rxjs, observable).then((outputArray) => {
        expect(outputArray).toBe(inputArray);
      });
    });
  });

  describe('flattenToParentChildArray method', () => {
    let mockTreeArray;

    beforeEach(() => {
      mockTreeArray = [
        { id: 18, file: 'something.txt', dateModified: '2015-03-03', size: 90 },
        {
          id: 11, file: 'Music', files: [{
            id: 12, file: 'mp3', files: [
              { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13', size: 98, }] },
              { id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01', size: 85, }] },
            ]
          }]
        },
      ];
    });

    it('should return a flat array from a hierarchical structure', () => {
      addTreeLevelByMutation(mockTreeArray, { childrenPropName: 'files', levelPropName: '__treeLevel' });
      const output = flattenToParentChildArray(mockTreeArray, { childrenPropName: 'files' });
      expect(output).toEqual([
        { id: 18, size: 90, __treeLevel: 0, dateModified: '2015-03-03', file: 'something.txt', __parentId: null, __hasChildren: false },
        { id: 11, __treeLevel: 0, file: 'Music', __parentId: null, __hasChildren: true },
        { id: 12, __treeLevel: 1, file: 'mp3', __parentId: 11, __hasChildren: true },
        { id: 16, __treeLevel: 2, file: 'rock', __parentId: 12, __hasChildren: true },
        { id: 17, __treeLevel: 3, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, __parentId: 16, __hasChildren: false },
        { id: 14, __treeLevel: 2, file: 'pop', __parentId: 12, __hasChildren: true },
        { id: 15, __treeLevel: 3, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, __parentId: 14, __hasChildren: false },
      ]);
    });

    it('should return a flat array from a hierarchical structure and tree totals aggregation', () => {
      const aggregator = new SumAggregator('size');
      addTreeLevelAndAggregatorsByMutation(mockTreeArray, { aggregator, childrenPropName: 'files', levelPropName: '__treeLevel' });
      const output = flattenToParentChildArray(mockTreeArray, { childrenPropName: 'files' });
      expect(output).toEqual([
        { id: 18, size: 90, __treeLevel: 0, dateModified: '2015-03-03', file: 'something.txt', __parentId: null, __hasChildren: false },
        { id: 11, __treeLevel: 0, file: 'Music', __parentId: null, __hasChildren: true, __treeTotals: { count: { size: 2, }, sum: { size: (98 + 85), }, }, },
        { id: 12, __treeLevel: 1, file: 'mp3', __parentId: 11, __hasChildren: true, __treeTotals: { count: { size: 2, }, sum: { size: (98 + 85), }, }, },
        { id: 16, __treeLevel: 2, file: 'rock', __parentId: 12, __hasChildren: true, __treeTotals: { count: { size: 1, }, sum: { size: 98, }, }, },
        { id: 17, __treeLevel: 3, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, __parentId: 16, __hasChildren: false },
        { id: 14, __treeLevel: 2, file: 'pop', __parentId: 12, __hasChildren: true, __treeTotals: { count: { size: 1, }, sum: { size: 85, }, } },
        { id: 15, __treeLevel: 3, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, __parentId: 14, __hasChildren: false },
      ]);
    });

    it('should return a flat array from a hierarchical structure and tree totals aggregation and tree level number as well', () => {
      const aggregator = new SumAggregator('size');
      addTreeLevelAndAggregatorsByMutation(mockTreeArray, { aggregator, childrenPropName: 'files', levelPropName: '__treeLevel' });
      const output = flattenToParentChildArray(mockTreeArray, { childrenPropName: 'files', shouldAddTreeLevelNumber: true, aggregators: [aggregator] });
      expect(output).toEqual([
        { id: 18, size: 90, __treeLevel: 0, dateModified: '2015-03-03', file: 'something.txt', __parentId: null, __hasChildren: false },
        { id: 11, __treeLevel: 0, file: 'Music', __parentId: null, __hasChildren: true, __treeTotals: { count: { size: 2, }, sum: { size: (98 + 85), }, }, },
        { id: 12, __treeLevel: 1, file: 'mp3', __parentId: 11, __hasChildren: true, __treeTotals: { count: { size: 2, }, sum: { size: (98 + 85), }, }, },
        { id: 16, __treeLevel: 2, file: 'rock', __parentId: 12, __hasChildren: true, __treeTotals: { count: { size: 1, }, sum: { size: 98, }, }, },
        { id: 17, __treeLevel: 3, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, __parentId: 16, __hasChildren: false },
        { id: 14, __treeLevel: 2, file: 'pop', __parentId: 12, __hasChildren: true, __treeTotals: { count: { size: 1, }, sum: { size: 85, }, } },
        { id: 15, __treeLevel: 3, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, __parentId: 14, __hasChildren: false },
      ]);
    });
  });

  describe('findItemInTreeStructure method', () => {
    let mockColumns;

    beforeEach(() => {
      mockColumns = [
        { id: 18, file: 'something.txt', dateModified: '2015-03-03', size: 90 },
        {
          id: 11, file: 'Music', files: [{
            id: 12, file: 'mp3', files: [
              { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13', size: 98, }] },
              { id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01', size: 85, }] },
            ]
          }]
        },
      ];
    });

    it('should throw an error when the children property name argument is missing', () => {
      expect(() => findItemInTreeStructure(mockColumns, x => x.file === 'pop', '')).toThrowError('findRecursive requires parameter "childrenPropertyName"');
    });

    it('should find an item from a hierarchical array', () => {
      const item = findItemInTreeStructure(mockColumns, x => x.file === 'pop', 'files');
      expect(item).toEqual({ id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01', size: 85, }] });
    });

    it('should return undefined when item is not found', () => {
      const item = findItemInTreeStructure(mockColumns, x => x.file === 'pop2', 'files');
      expect(item).toEqual(undefined as any);
    });
  });

  describe('findOrDefault method', () => {
    it('should return original input when it is not an array provided', () => {
      const input = 'a';
      const searchValue = '';
      const output = findOrDefault(input as any, (val) => val === searchValue);
      expect(output).toBe(input);
    });

    it('should find an element in the array given a provided logic to find such element', () => {
      const collection = ['a', 'c', 'b', 1];
      const searchValue = 'c';
      const output = findOrDefault(collection, (val) => val === searchValue);
      expect(output).toBe(searchValue);
    });

    it('should find an object in an array of objects given a provided logic to find such element', () => {
      const collection = [{ id: 1, name: 'a', order: 3 }, { id: 2, name: 'def', order: 45 }, { id: 3, name: 'xyz', order: 99 }];
      const searchProperty = 'id';
      const searchId = 2;

      const output = findOrDefault(collection, (item) => {
        if (item && item.hasOwnProperty(searchProperty)) {
          return item[searchProperty] === searchId;
        }
        return false;
      });

      expect(output).toEqual({ id: 2, name: 'def', order: 45 });
    });

    it('should return default value when element is not found in the array', () => {
      const collection = ['a', 'c', 'b', 1];
      const searchValue = 'z';
      const defaultValue = 'a';
      const output = findOrDefault(collection, ((val) => val === searchValue), defaultValue);
      expect(output).toBe(defaultValue);
    });
  });

  describe('decimalFormatted method', () => {
    it('should return original input when the argument is not a number', () => {
      const input = 'abc';
      const output = decimalFormatted(input, 2, 2);
      expect(output).toBe(input);
    });

    it('should return a string with a number formatted with 2 decimals when only a number is provided', () => {
      const input = 123;
      const output = decimalFormatted(input);
      expect(output).toBe('123.00');
    });

    it('should return a string with a number formatted with 2 decimals when the number provided is a string', () => {
      const input = '456';
      const output = decimalFormatted(input);
      expect(output).toBe('456.00');
    });

    it('should return a string without any decimals when the minDecimal is set to 0 and the provided is an integer', () => {
      const input = '456';
      const output = decimalFormatted(input, 0);
      expect(output).toBe('456');
    });

    it('should return a string with a number formatted and rounded to 4 decimals when maxDecimal is set to 4 and the number provided has extra decimals', () => {
      const input = 456.4567899;
      const output = decimalFormatted(input, 0, 4);
      expect(output).toBe('456.4568');
    });

    it('should return a string with a number formatted to 2 decimals minDecimal is set to 2 and maxDecimal is set to any number greater than 2', () => {
      const input = 456.4;
      const output = decimalFormatted(input, 2, 4);
      expect(output).toBe('456.40');
    });

    it('should return a string with a negative number formatted to 2 decimals minDecimal is set to 2', () => {
      const input = -456.4;
      const output = decimalFormatted(input, 2, 4);
      expect(output).toBe('-456.40');
    });

    it('should return a string with comma as decimal separator when separator is set and maxDecimal is set and will round the decimal', () => {
      const input = 1234567890.44566;
      const output = decimalFormatted(input, 2, 4, ',');
      expect(output).toBe('1234567890,4457');
    });

    it('should return a string with dot as decimal separator when separator is set and maxDecimal is set and will round the decimal', () => {
      const input = '1234567890.44566';
      const output = decimalFormatted(input, 2, 4, ',');
      expect(output).toBe('1234567890,4457');
    });

    it('should return a string with thousand separator when separator is set and maxDecimal is set and will round the decimal', () => {
      const input = 1234567890.44566;
      const output = decimalFormatted(input, 2, 4, '.', ',');
      expect(output).toBe('1,234,567,890.4457');
    });
  });

  describe('formatNumber method', () => {
    it('should return original value when input provided is not a number', () => {
      const input = 'abc';
      const output = formatNumber(input);
      expect(output).toBe(input);
    });

    it('should return original value when input provided is not a number even if thousand separator is set', () => {
      const input = 'abc';
      const decimalSeparator = ',';
      const thousandSeparator = '_';
      const output = formatNumber(input, undefined, undefined, false, '', '', decimalSeparator, thousandSeparator);
      expect(output).toBe(input);
    });

    it('should return a string with a number formatted to 2 decimals when minDecimal is set to 2', () => {
      const input = 12345678;
      const output = formatNumber(input, 2);
      expect(output).toBe('12345678.00');
    });

    it('should return a string with thousand separator and a number formatted to 2 decimals when minDecimal is set to 2', () => {
      const input = 12345678;
      const decimalSeparator = '.';
      const thousandSeparator = ',';
      const output = formatNumber(input, 2, undefined, false, '', '', decimalSeparator, thousandSeparator);
      expect(output).toBe('12,345,678.00');
    });

    it('should return a string with a number formatted and rounded to 4 decimals when maxDecimal is set to 4 and the number provided has extra decimals', () => {
      const input = 12345678.4567899;
      const output = formatNumber(input, 0, 4);
      expect(output).toBe('12345678.4568');
    });

    it('should return a string with thousand separator and a number formatted and rounded to 4 decimals when maxDecimal is set to 4 and the number provided has extra decimals', () => {
      const input = 12345678.4567899;
      const decimalSeparator = ',';
      const thousandSeparator = ' ';
      const output = formatNumber(input, 0, 4, false, '', '', decimalSeparator, thousandSeparator);
      expect(output).toBe('12 345 678,4568');
    });

    it('should return a string without decimals when these arguments are null or undefined and the input provided is an integer', () => {
      const input = 12345678;
      const output1 = formatNumber(input);
      const output2 = formatNumber(input, null as any, null as any);
      const output3 = formatNumber(input, undefined, undefined);

      expect(output1).toBe('12345678');
      expect(output2).toBe('12345678');
      expect(output3).toBe('12345678');
    });

    it('should return a string without decimals and thousand separator when these arguments are null or undefined and the input provided is an integer', () => {
      const input = 12345678;
      const decimalSeparator = '.';
      const thousandSeparator = ',';
      const output1 = formatNumber(input, null as any, null as any, false, '', '', decimalSeparator, thousandSeparator);
      const output2 = formatNumber(input, undefined, undefined, false, '', '', decimalSeparator, thousandSeparator);

      expect(output1).toBe('12,345,678');
      expect(output2).toBe('12,345,678');
    });

    it('should return a string without decimals but using dot (.) as thousand separator when these arguments are null or undefined and the input provided is an integer', () => {
      const input = 12345678;
      const decimalSeparator = ',';
      const thousandSeparator = '.';
      const output1 = formatNumber(input, null as any, null as any, false, '', '', decimalSeparator, thousandSeparator);
      const output2 = formatNumber(input, undefined, undefined, false, '', '', decimalSeparator, thousandSeparator);

      expect(output1).toBe('12.345.678');
      expect(output2).toBe('12.345.678');
    });

    it('should return a formatted string wrapped in parentheses when the input number is negative and the displayNegativeNumberWithParentheses argument is enabled', () => {
      const input = -123;
      const displayNegativeNumberWithParentheses = true;
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses);
      expect(output).toBe('(123.00)');
    });

    it('should return a formatted string and thousand separator wrapped in parentheses when the input number is negative and the displayNegativeNumberWithParentheses argument is enabled', () => {
      const input = -12345678;
      const displayNegativeNumberWithParentheses = true;
      const decimalSeparator = ',';
      const thousandSeparator = '_';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, '', '', decimalSeparator, thousandSeparator);
      expect(output).toBe('(12_345_678,00)');
    });

    it('should return a formatted currency string when the input number is negative and symbol prefix is provided', () => {
      const input = -123;
      const displayNegativeNumberWithParentheses = false;
      const currencyPrefix = '$';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix);
      expect(output).toBe('-$123.00');
    });

    it('should return a formatted currency string and thousand separator when the input number is negative and symbol prefix is provided', () => {
      const input = -12345678;
      const displayNegativeNumberWithParentheses = false;
      const currencyPrefix = '$';
      const decimalSeparator = '.';
      const thousandSeparator = ',';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix, '', decimalSeparator, thousandSeparator);
      expect(output).toBe('-$12,345,678.00');
    });

    it('should return a formatted currency string and thousand separator using dot (.) and decimal using comma (,) when those are provided', () => {
      const input = -12345678.32;
      const displayNegativeNumberWithParentheses = false;
      const currencyPrefix = '$';
      const decimalSeparator = ',';
      const thousandSeparator = '.';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix, '', decimalSeparator, thousandSeparator);
      expect(output).toBe('-$12.345.678,32');
    });

    it('should return a formatted currency string with symbol prefix/suffix wrapped in parentheses when the input number is negative, when all necessary arguments are filled', () => {
      const input = -1234;
      const displayNegativeNumberWithParentheses = true;
      const currencyPrefix = '$';
      const currencySuffix = ' CAD';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix, currencySuffix);
      expect(output).toBe('($1234.00 CAD)');
    });

    it('should return a formatted currency string with symbol prefix/suffix and thousand separator wrapped in parentheses when the input number is negative, when all necessary arguments are filled', () => {
      const input = -12345678;
      const displayNegativeNumberWithParentheses = true;
      const currencyPrefix = '$';
      const currencySuffix = ' CAD';
      const decimalSeparator = ',';
      const thousandSeparator = ' ';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix, currencySuffix, decimalSeparator, thousandSeparator);
      expect(output).toBe('($12 345 678,00 CAD)');
    });

    it('should return a formatted currency string with symbol prefix/suffix but without decimals when these arguments are not provided, then wrapped in parentheses when the input number is negative, when all necessary arguments are filled', () => {
      const input = -1234;
      const displayNegativeNumberWithParentheses = true;
      const currencyPrefix = '$';
      const currencySuffix = ' CAD';
      const output = formatNumber(input, null as any, null as any, displayNegativeNumberWithParentheses, currencyPrefix, currencySuffix);
      expect(output).toBe('($1234 CAD)');
    });

    it('should return a formatted currency string with symbol prefix/suffix and thousand separator but without decimals when these arguments are not provided, then wrapped in parentheses when the input number is negative, when all necessary arguments are filled', () => {
      const input = -12345678;
      const displayNegativeNumberWithParentheses = true;
      const currencyPrefix = '$';
      const currencySuffix = ' CAD';
      const decimalSeparator = ',';
      const thousandSeparator = '_';
      const output = formatNumber(input, null as any, null as any, displayNegativeNumberWithParentheses, currencyPrefix, currencySuffix, decimalSeparator, thousandSeparator);
      expect(output).toBe('($12_345_678 CAD)');
    });
  });

  describe('getColumnFieldType() method', () => {
    it('should return field type when type is defined', () => {
      const result = getColumnFieldType({ type: FieldType.dateIso } as Column);
      expect(result).toEqual(FieldType.dateIso);
    });

    it('should return outputType when both field type and outputType are defined', () => {
      const result = getColumnFieldType({ outputType: FieldType.number, type: FieldType.dateIso } as Column);
      expect(result).toEqual(FieldType.number);
    });

    it('should return string field type when neither type nor outputType are defined', () => {
      const result = getColumnFieldType({ field: 'startDate' } as Column);
      expect(result).toEqual(FieldType.string);
    });
  });

  describe('getDescendantProperty() method', () => {
    let obj = {};
    beforeEach(() => {
      obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', address: { number: 123, street: 'Broadway' } } };
    });

    it('should return original object when no path is provided', () => {
      const output = getDescendantProperty(obj, undefined);
      expect(output).toBe(obj);
    });

    it('should return undefined when search argument is not part of the input object', () => {
      const output = getDescendantProperty(obj, 'users');
      expect(output).toBe(undefined as any);
    });

    it('should return the object descendant even when path given is not a dot notation', () => {
      const output = getDescendantProperty(obj, 'user');
      expect(output).toEqual(obj['user']);
    });

    it('should return the object descendant when using dot notation', () => {
      const output = getDescendantProperty(obj, 'user.firstName');
      expect(output).toEqual('John');
    });

    it('should return the object descendant when using multiple levels of dot notation', () => {
      const output = getDescendantProperty(obj, 'user.address.street');
      expect(output).toEqual('Broadway');
    });
  });

  describe('getTranslationPrefix method', () => {
    it('should return empty Translation Prefix when no Grid Options are provided', () => {
      const output = getTranslationPrefix(null as any);
      expect(output).toBe('');
    });

    it('should return Translation Prefix without separator when only namespace defined in the Grid Options', () => {
      const gridOptions = { translationNamespace: 'App1' } as GridOption;
      const output = getTranslationPrefix(gridOptions);
      expect(output).toBe('App1');
    });

    it('should return Translation Prefix with separator when defined in the Grid Options', () => {
      const gridOptions = { translationNamespace: 'App1', translationNamespaceSeparator: ':' } as GridOption;
      const output = getTranslationPrefix(gridOptions);
      expect(output).toBe('App1:');
    });
  });

  describe('isColumnDateType() method', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return True when FieldType.date is provided', () => {
      const result = isColumnDateType(FieldType.date);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTime is provided', () => {
      const result = isColumnDateType(FieldType.dateTime);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeIso is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeIso);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeShortIso is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeShortIso);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeIsoAmPm is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeIsoAmPm);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeIsoAM_PM is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeIsoAM_PM);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateEuro is provided', () => {
      const result = isColumnDateType(FieldType.dateEuro);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateEuroShort is provided', () => {
      const result = isColumnDateType(FieldType.dateEuroShort);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeEuro is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeEuro);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeShortEuro is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeShortEuro);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeEuroAmPm is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeEuroAmPm);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeEuroAM_PM is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeEuroAM_PM);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeEuroShort is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeEuroShort);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeEuroShortAM_PM is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeEuroShortAM_PM);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeEuroShortAmPm is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeEuroShortAmPm);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateUs is provided', () => {
      const result = isColumnDateType(FieldType.dateUs);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateUsShort is provided', () => {
      const result = isColumnDateType(FieldType.dateUsShort);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeUs is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeUs);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeShortUs is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeShortUs);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeUsAmPm is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeUsAmPm);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeUsShortAM_PM is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeUsShortAM_PM);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeUsAM_PM is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeUsAM_PM);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeUsShort is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeUsShort);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateTimeUsShortAmPm is provided', () => {
      const result = isColumnDateType(FieldType.dateTimeUsShortAmPm);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateUtc is provided', () => {
      const result = isColumnDateType(FieldType.dateUtc);
      expect(result).toBe(true);
    });

    it('should return True when FieldType.dateIso is provided', () => {
      const result = isColumnDateType(FieldType.dateIso);
      expect(result).toBe(true);
    });
  });

  describe('mapMomentDateFormatWithFieldType method', () => {
    it('should return a moment.js dateTime/dateTimeIso format', () => {
      const output1 = mapMomentDateFormatWithFieldType(FieldType.dateTime);
      const output2 = mapMomentDateFormatWithFieldType(FieldType.dateTimeIso);
      expect(output1).toBe('YYYY-MM-DD HH:mm:ss');
      expect(output2).toBe('YYYY-MM-DD HH:mm:ss');
    });

    it('should return a moment.js dateTimeShortIso format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeShortIso);
      expect(output).toBe('YYYY-MM-DD HH:mm');
    });

    it('should return a moment.js dateTimeIsoAmPm format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeIsoAmPm);
      expect(output).toBe('YYYY-MM-DD hh:mm:ss a');
    });

    it('should return a moment.js dateTimeIsoAM_PM format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeIsoAM_PM);
      expect(output).toBe('YYYY-MM-DD hh:mm:ss A');
    });

    it('should return a moment.js dateEuro format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateEuro);
      expect(output).toBe('DD/MM/YYYY');
    });

    it('should return a moment.js dateEuroShort format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateEuroShort);
      expect(output).toBe('D/M/YY');
    });

    it('should return a moment.js dateTimeEuro format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeEuro);
      expect(output).toBe('DD/MM/YYYY HH:mm:ss');
    });

    it('should return a moment.js dateTimeShortEuro format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeShortEuro);
      expect(output).toBe('DD/MM/YYYY HH:mm');
    });

    it('should return a moment.js dateTimeEuroAmPm format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeEuroAmPm);
      expect(output).toBe('DD/MM/YYYY hh:mm:ss a');
    });

    it('should return a moment.js dateTimeEuroAM_PM format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeEuroAM_PM);
      expect(output).toBe('DD/MM/YYYY hh:mm:ss A');
    });

    it('should return a moment.js dateTimeEuroShort format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeEuroShort);
      expect(output).toBe('D/M/YY H:m:s');
    });

    it('should return a moment.js dateTimeEuroShortAmPm format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeEuroShortAmPm);
      expect(output).toBe('D/M/YY h:m:s a');
    });

    it('should return a moment.js dateUs format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateUs);
      expect(output).toBe('MM/DD/YYYY');
    });

    it('should return a moment.js dateUsShort format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateUsShort);
      expect(output).toBe('M/D/YY');
    });

    it('should return a moment.js dateTimeUs format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeUs);
      expect(output).toBe('MM/DD/YYYY HH:mm:ss');
    });

    it('should return a moment.js dateTimeShortUs format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeShortUs);
      expect(output).toBe('MM/DD/YYYY HH:mm');
    });

    it('should return a moment.js dateTimeUsAmPm format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeUsAmPm);
      expect(output).toBe('MM/DD/YYYY hh:mm:ss a');
    });

    it('should return a moment.js dateTimeUsAM_PM format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeUsAM_PM);
      expect(output).toBe('MM/DD/YYYY hh:mm:ss A');
    });

    it('should return a moment.js dateTimeUsShort format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeUsShort);
      expect(output).toBe('M/D/YY H:m:s');
    });

    it('should return a moment.js dateTimeUsShortAmPm format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateTimeUsShortAmPm);
      expect(output).toBe('M/D/YY h:m:s a');
    });

    it('should return a moment.js dateUtc format', () => {
      const output = mapMomentDateFormatWithFieldType(FieldType.dateUtc);
      expect(output).toBe('YYYY-MM-DDTHH:mm:ss.SSSZ');
    });

    it('should return a moment.js date/dateIso format', () => {
      const output1 = mapMomentDateFormatWithFieldType(FieldType.date);
      const output2 = mapMomentDateFormatWithFieldType(FieldType.dateIso);
      expect(output1).toBe('YYYY-MM-DD');
      expect(output2).toBe('YYYY-MM-DD');
    });
  });

  describe('mapFlatpickrDateFormatWithFieldType method', () => {
    it('should return a Flatpickr dateTime format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTime);
      expect(output).toBe('Y-m-d H:i:S');
    });

    it('should return a Flatpickr dateTimeShortIso format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeShortIso);
      expect(output).toBe('Y-m-d H:i');
    });

    it('should return a Flatpickr dateTimeIsoAmPm/dateTimeIsoAM_PM format', () => {
      const output1 = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeIsoAmPm);
      const output2 = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeIsoAM_PM);
      expect(output1).toBe('Y-m-d h:i:S K');
      expect(output2).toBe('Y-m-d h:i:S K');
    });

    it('should return a Flatpickr dateEuro format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateEuro);
      expect(output).toBe('d/m/Y');
    });

    it('should return a Flatpickr dateEuroShort format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateEuroShort);
      expect(output).toBe('d/m/y');
    });

    it('should return a Flatpickr dateTimeEuro format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeEuro);
      expect(output).toBe('d/m/Y H:i:S');
    });

    it('should return a Flatpickr dateTimeShortEuro format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeShortEuro);
      expect(output).toBe('d/m/y H:i');
    });

    it('should return a Flatpickr dateTimeEuroAmPm format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeEuroAmPm);
      expect(output).toBe('d/m/Y h:i:S K');
    });

    it('should return a Flatpickr dateTimeEuroAM_PM format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeEuroAM_PM);
      expect(output).toBe('d/m/Y h:i:s K');
    });

    it('should return a Flatpickr dateTimeEuroShort format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeEuroShort);
      expect(output).toBe('d/m/y H:i:s');
    });

    it('should return a Flatpickr dateTimeEuroShortAmPm format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeEuroShortAmPm);
      expect(output).toBe('d/m/y h:i:s K');
    });

    it('should return a Flatpickr dateUs format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateUs);
      expect(output).toBe('m/d/Y');
    });

    it('should return a Flatpickr dateUsShort format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateUsShort);
      expect(output).toBe('m/d/y');
    });

    it('should return a Flatpickr dateTimeUs format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeUs);
      expect(output).toBe('m/d/Y H:i:S');
    });

    it('should return a Flatpickr dateTimeShortUs format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeShortUs);
      expect(output).toBe('m/d/y H:i');
    });

    it('should return a Flatpickr dateTimeUsAmPm format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeUsAmPm);
      expect(output).toBe('m/d/Y h:i:S K');
    });

    it('should return a Flatpickr dateTimeUsAM_PM format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeUsAM_PM);
      expect(output).toBe('m/d/Y h:i:s K');
    });

    it('should return a Flatpickr dateTimeUsShort format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeUsShort);
      expect(output).toBe('m/d/y H:i:s');
    });

    it('should return a Flatpickr dateTimeUsShortAmPm format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateTimeUsShortAmPm);
      expect(output).toBe('m/d/y h:i:s K');
    });

    it('should return a Flatpickr dateUtc format', () => {
      const output = mapFlatpickrDateFormatWithFieldType(FieldType.dateUtc);
      expect(output).toBe('Z');
    });

    it('should return a Flatpickr dateédateIso format', () => {
      const output1 = mapFlatpickrDateFormatWithFieldType(FieldType.date);
      const output2 = mapFlatpickrDateFormatWithFieldType(FieldType.dateIso);
      expect(output1).toBe('Y-m-d');
      expect(output2).toBe('Y-m-d');
    });
  });

  describe('mapOperatorType method', () => {
    it('should return OperatoryType associated to "<"', () => {
      const expectation = OperatorType.lessThan;

      const output1 = mapOperatorType('<');
      const output2 = mapOperatorType('LT');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "<="', () => {
      const expectation = OperatorType.lessThanOrEqual;

      const output1 = mapOperatorType('<=');
      const output2 = mapOperatorType('LE');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to ">"', () => {
      const expectation = OperatorType.greaterThan;

      const output1 = mapOperatorType('>');
      const output2 = mapOperatorType('GT');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to ">="', () => {
      const expectation = OperatorType.greaterThanOrEqual;

      const output1 = mapOperatorType('>=');
      const output2 = mapOperatorType('GE');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "<>", "!=", "neq" or "NEQ"', () => {
      const expectation = OperatorType.notEqual;

      const output1 = mapOperatorType('<>');
      const output2 = mapOperatorType('!=');
      const output3 = mapOperatorType('NE');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });

    it('should return OperatoryType associated to "*", "a*", ".*", "startsWith"', () => {
      const expectation = OperatorType.startsWith;

      const output1 = mapOperatorType('*');
      const output2 = mapOperatorType('a*');
      const output3 = mapOperatorType('StartsWith');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });

    it('should return OperatoryType associated to "*.", "*z", "endsWith"', () => {
      const expectation = OperatorType.endsWith;

      const output1 = mapOperatorType('*z');
      const output2 = mapOperatorType('EndsWith');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "=", "==", "eq" or "EQ"', () => {
      const expectation = OperatorType.equal;

      const output1 = mapOperatorType('=');
      const output2 = mapOperatorType('==');
      const output3 = mapOperatorType('EQ');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });

    it('should return OperatoryType associated to "in", "IN"', () => {
      const expectation = OperatorType.in;

      const output1 = mapOperatorType('IN');

      expect(output1).toBe(expectation);
    });

    it('should return OperatoryType associated to "notIn", "NIN", "NOT_IN"', () => {
      const expectation = OperatorType.notIn;

      const output1 = mapOperatorType('NIN');
      const output2 = mapOperatorType('NOT_IN');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "not_contains", "Not_Contains", "notContains"', () => {
      const expectation = OperatorType.notContains;

      const output1 = mapOperatorType('Not_Contains');
      const output2 = mapOperatorType('NOT_CONTAINS');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return default OperatoryType associated to contains', () => {
      const expectation = OperatorType.contains;

      const output1 = mapOperatorType('');
      const output2 = mapOperatorType('Contains');
      const output3 = mapOperatorType('CONTAINS');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });
  });

  describe('mapOperatorToShorthandDesignation method', () => {
    it('should return Operator shorthand of ">"', () => {
      const expectation = '>';
      const output1 = mapOperatorToShorthandDesignation(OperatorType.greaterThan);
      const output2 = mapOperatorToShorthandDesignation('>');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of ">="', () => {
      const expectation = '>=';
      const output1 = mapOperatorToShorthandDesignation(OperatorType.greaterThanOrEqual);
      const output2 = mapOperatorToShorthandDesignation('>=');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of "<"', () => {
      const expectation = '<';
      const output1 = mapOperatorToShorthandDesignation(OperatorType.lessThan);
      const output2 = mapOperatorToShorthandDesignation('<');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of "<="', () => {
      const expectation = '<=';
      const output1 = mapOperatorToShorthandDesignation(OperatorType.lessThanOrEqual);
      const output2 = mapOperatorToShorthandDesignation('<=');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of "<>"', () => {
      const expectation = '<>';
      const output1 = mapOperatorToShorthandDesignation(OperatorType.notEqual);
      const output2 = mapOperatorToShorthandDesignation('<>');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of "="', () => {
      const expectation = '=';
      const output1 = mapOperatorToShorthandDesignation(OperatorType.equal);
      const output2 = mapOperatorToShorthandDesignation('=');
      const output3 = mapOperatorToShorthandDesignation('==');
      const output4 = mapOperatorToShorthandDesignation('EQ');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
      expect(output4).toBe(expectation);
    });

    it('should return Operator shorthand of "a*" to represent starts with', () => {
      const expectation = 'a*';
      const output1 = mapOperatorToShorthandDesignation(OperatorType.startsWith);
      const output2 = mapOperatorToShorthandDesignation('a*');
      const output3 = mapOperatorToShorthandDesignation('*');
      const output4 = mapOperatorToShorthandDesignation('StartsWith');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
      expect(output4).toBe(expectation);
    });

    it('should return Operator shorthand of "*z" to represent ends with', () => {
      const expectation = '*z';
      const output1 = mapOperatorToShorthandDesignation(OperatorType.endsWith);
      const output2 = mapOperatorToShorthandDesignation('*z');
      const output3 = mapOperatorToShorthandDesignation('EndsWith');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });

    it('should return same input Operator when no shorthand is found', () => {
      const output1 = mapOperatorToShorthandDesignation(OperatorType.in);
      const output2 = mapOperatorToShorthandDesignation(OperatorType.contains);
      const output3 = mapOperatorToShorthandDesignation(OperatorType.notContains);
      const output4 = mapOperatorToShorthandDesignation(OperatorType.rangeExclusive);
      const output5 = mapOperatorToShorthandDesignation(OperatorType.rangeInclusive);

      expect(output1).toBe(OperatorType.in);
      expect(output2).toBe(OperatorType.contains);
      expect(output3).toBe(OperatorType.notContains);
      expect(output4).toBe(OperatorType.rangeExclusive);
      expect(output5).toBe(OperatorType.rangeInclusive);
    });
  });

  describe('mapOperatorByFieldType method', () => {
    it('should return default OperatoryType associated to contains', () => {
      const output1 = mapOperatorByFieldType(FieldType.string);
      const output2 = mapOperatorByFieldType(FieldType.unknown);

      expect(output1).toBe(OperatorType.contains);
      expect(output2).toBe(OperatorType.contains);
    });

    it('should return default OperatoryType associated to equal', () => {
      const output2 = mapOperatorByFieldType(FieldType.float);
      const output3 = mapOperatorByFieldType(FieldType.number);
      const output4 = mapOperatorByFieldType(FieldType.date);
      const output5 = mapOperatorByFieldType(FieldType.dateIso);
      const output6 = mapOperatorByFieldType(FieldType.date);
      const output7 = mapOperatorByFieldType(FieldType.dateUtc);
      const output8 = mapOperatorByFieldType(FieldType.dateTime);
      const output9 = mapOperatorByFieldType(FieldType.dateTimeIso);
      const output10 = mapOperatorByFieldType(FieldType.dateTimeIsoAmPm);
      const output11 = mapOperatorByFieldType(FieldType.dateTimeIsoAM_PM);
      const output12 = mapOperatorByFieldType(FieldType.dateEuro);
      const output13 = mapOperatorByFieldType(FieldType.dateEuroShort);
      const output14 = mapOperatorByFieldType(FieldType.dateTimeEuro);
      const output15 = mapOperatorByFieldType(FieldType.dateTimeEuroAmPm);
      const output16 = mapOperatorByFieldType(FieldType.dateTimeEuroAM_PM);
      const output17 = mapOperatorByFieldType(FieldType.dateTimeEuroShort);
      const output18 = mapOperatorByFieldType(FieldType.dateTimeEuroShortAmPm);
      const output19 = mapOperatorByFieldType(FieldType.dateTimeEuroShortAM_PM);
      const output20 = mapOperatorByFieldType(FieldType.dateUs);
      const output21 = mapOperatorByFieldType(FieldType.dateUsShort);
      const output22 = mapOperatorByFieldType(FieldType.dateTimeUs);
      const output23 = mapOperatorByFieldType(FieldType.dateTimeUsAmPm);
      const output24 = mapOperatorByFieldType(FieldType.dateTimeUsAM_PM);
      const output25 = mapOperatorByFieldType(FieldType.dateTimeUsShort);
      const output26 = mapOperatorByFieldType(FieldType.dateTimeUsShortAmPm);
      const output27 = mapOperatorByFieldType(FieldType.dateTimeUsShortAM_PM);

      expect(output2).toBe(OperatorType.equal);
      expect(output3).toBe(OperatorType.equal);
      expect(output4).toBe(OperatorType.equal);
      expect(output5).toBe(OperatorType.equal);
      expect(output6).toBe(OperatorType.equal);
      expect(output7).toBe(OperatorType.equal);
      expect(output8).toBe(OperatorType.equal);
      expect(output9).toBe(OperatorType.equal);
      expect(output10).toBe(OperatorType.equal);
      expect(output11).toBe(OperatorType.equal);
      expect(output12).toBe(OperatorType.equal);
      expect(output13).toBe(OperatorType.equal);
      expect(output14).toBe(OperatorType.equal);
      expect(output15).toBe(OperatorType.equal);
      expect(output16).toBe(OperatorType.equal);
      expect(output17).toBe(OperatorType.equal);
      expect(output18).toBe(OperatorType.equal);
      expect(output19).toBe(OperatorType.equal);
      expect(output20).toBe(OperatorType.equal);
      expect(output21).toBe(OperatorType.equal);
      expect(output22).toBe(OperatorType.equal);
      expect(output23).toBe(OperatorType.equal);
      expect(output24).toBe(OperatorType.equal);
      expect(output25).toBe(OperatorType.equal);
      expect(output26).toBe(OperatorType.equal);
      expect(output27).toBe(OperatorType.equal);
    });

    it('should return default OperatoryType associated to contains', () => {
      const output = mapOperatorByFieldType('' as any);
      expect(output).toBe(OperatorType.equal);
    });
  });

  describe('parseUtcDate method', () => {
    it('should return null when date provided is not an ISO date (date only accepted)', () => {
      const input1 = '2012-01-01 02:02:02';
      const input2 = '2012-01-01T02:02:02Z';

      const output1 = parseUtcDate(input1);
      const output2 = parseUtcDate(input2);

      expect(output1).toBe('');
      expect(output2).toBe('');
    });

    it('should return a date parsed as UTC when input is a date (without time) of ISO format', () => {
      const input = '2012-01-01';
      const output = parseUtcDate(input, true);
      expect(output).toBe('2012-01-01T00:00:00Z');
    });
  });

  describe('thousandSeparatorFormatted method', () => {
    it('should return original value when input provided is null', () => {
      const input = null as any;
      const output = thousandSeparatorFormatted(input, ',');
      expect(output).toBe(input);
    });

    it('should return original value when input provided is undefined', () => {
      const input = undefined as any;
      const output = thousandSeparatorFormatted(input, ',');
      expect(output).toBe(input);
    });

    it('should return original value when input provided is not a number', () => {
      const input = 'abc';
      const output = thousandSeparatorFormatted(input, ',');
      expect(output).toBe(input);
    });

    it('should return a string with a number formatted with every thousand separated with a comma when separator is not defined', () => {
      const input = 12345678;
      const output = thousandSeparatorFormatted(input);
      expect(output).toBe('12,345,678');
    });

    it('should return a string with a number formatted with every thousand separated with a custom space defined as separator', () => {
      const input = 12345678;
      const output = thousandSeparatorFormatted(input, ' ');
      expect(output).toBe('12 345 678');
    });

    it('should return a string with a number formatted with every thousand separated with a custom underscore defined as separator', () => {
      const input = 12345678;
      const output = thousandSeparatorFormatted(input, '_');
      expect(output).toBe('12_345_678');
    });
  });

  describe('unsubscribeAll method', () => {
    it('should return original array when array of subscriptions is empty', () => {
      const output = unsubscribeAll([]);
      expect(output).toEqual([]);
    });

    it('should be able to unsubscribe all Observables', () => {
      const subscriptions: EventSubscription[] = [];
      const observable1 = of([1, 2]);
      const observable2 = of([1, 2]);
      subscriptions.push(observable1.subscribe(), observable2.subscribe());
      const output = unsubscribeAll(subscriptions);
      expect(output).toHaveLength(0);
    });

    it('should be able to unsubscribe all PubSub events or anything that has an unsubscribe method', () => {
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();
      const mockSubscription1 = { unsubscribe: mockUnsubscribe1 };
      const mockSubscription2 = { unsubscribe: mockUnsubscribe2 };
      const mockSubscriptions = [mockSubscription1, mockSubscription2];

      unsubscribeAll(mockSubscriptions);

      expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    });
  });
});
