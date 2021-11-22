import 'jest-extended';
import { of } from 'rxjs';

import { FieldType, OperatorType } from '../../enums/index';
import { EventSubscription, GridOption } from '../../interfaces/index';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub';
import {
  addToArrayWhenNotExists,
  addTreeLevelByMutation,
  addWhiteSpaces,
  arrayRemoveItemByIndex,
  cancellablePromise,
  CancelledException,
  castObservableToPromise,
  flattenToParentChildArray,
  unflattenParentChildArrayToTree,
  decimalFormatted,
  deepCopy,
  deepMerge,
  emptyObject,
  findItemInHierarchicalStructure,
  findItemInTreeStructure,
  findOrDefault,
  formatNumber,
  getDescendantProperty,
  getTranslationPrefix,
  isEmptyObject,
  isNumber,
  isObjectEmpty,
  mapMomentDateFormatWithFieldType,
  mapFlatpickrDateFormatWithFieldType,
  mapOperatorByFieldType,
  mapOperatorToShorthandDesignation,
  mapOperatorType,
  parseBoolean,
  parseUtcDate,
  removeAccentFromText,
  setDeepValue,
  thousandSeparatorFormatted,
  titleCase,
  toCamelCase,
  toKebabCase,
  toSentenceCase,
  toSnakeCase,
  unsubscribeAll,
  uniqueArray,
  uniqueObjectArray,
} from '../utilities';

describe('Service/Utilies', () => {
  describe('addToArrayWhenNotExists', () => {
    it('should add an item to the array when input item has an "id" and is not in the array', () => {
      const array = [{ id: 1, firstName: 'John' }];
      addToArrayWhenNotExists(array, { id: 2, firstName: 'Jane' });
      expect(array).toEqual([{ id: 1, firstName: 'John' }, { id: 2, firstName: 'Jane' }]);
    });

    it('should add an item to the array when input item has custom Id property and is not in the array', () => {
      const array = [{ customId: 1, firstName: 'John' }];
      addToArrayWhenNotExists(array, { customId: 2, firstName: 'Jane' });
      expect(array).toEqual([{ customId: 1, firstName: 'John' }, { customId: 2, firstName: 'Jane' }]);
    });

    it('should add an item to the array when input item is not an object and and is not in the array', () => {
      const array = ['John'];
      addToArrayWhenNotExists(array, 'Jane');
      expect(array).toEqual(['John', 'Jane']);
    });

    it('should NOT add an item to the array when input item has an "id" and is not in the array', () => {
      const array = [{ id: 1, firstName: 'John' }];
      addToArrayWhenNotExists(array, { id: 1, firstName: 'John' });
      expect(array).toEqual([{ id: 1, firstName: 'John' }]);
    });

    it('should NOT add an item to the array when input item is not an object and and is not in the array', () => {
      const array = [0];
      addToArrayWhenNotExists(array, 0);
      expect(array).toEqual([0]);
    });
  });

  describe('addWhiteSpaces method', () => {
    it('should return the an empty string when argument provided is lower or equal to 0', () => {
      expect(addWhiteSpaces(-2)).toBe('');
      expect(addWhiteSpaces(0)).toBe('');
    });

    it('should return the a simple string with x spaces only where x is the number of spaces provided as argument', () => {
      expect(addWhiteSpaces(5)).toBe('     ');
    });

    it('should return the a simple html string with x &nbsp; separator where x is the number of spaces provided as argument', () => {
      expect(addWhiteSpaces(2, '&nbsp;')).toBe('&nbsp;&nbsp;');
    });
  });

  describe('arrayRemoveItemByIndex method', () => {
    it('should remove an item from the array', () => {
      const input = [{ field: 'field1', name: 'Field 1' }, { field: 'field2', name: 'Field 2' }, { field: 'field3', name: 'Field 3' }];
      const expected = [{ field: 'field1', name: 'Field 1' }, { field: 'field3', name: 'Field 3' }];

      const output = arrayRemoveItemByIndex(input, 1);
      expect(output).toEqual(expected);
    });
  });

  describe('isEmptyObject method', () => {
    it('should return True when comparing against an object that has properties', () => {
      const result = isEmptyObject({ firstName: 'John', lastName: 'Doe' });
      expect(result).toBeFalse();
    });

    it('should return False when comparing against an object is either empty, null or undefined', () => {
      const result1 = isEmptyObject({});
      const result2 = isEmptyObject(null);
      const result3 = isEmptyObject(undefined);

      expect(result1).toBeTrue();
      expect(result2).toBeTrue();
      expect(result3).toBeTrue();
    });
  });

  describe('isObjectEmpty method', () => {
    it('should return True when input is undefined', () => {
      const result = isObjectEmpty(undefined);
      expect(result).toBeTrue();
    });

    it('should return True when input is null', () => {
      const result = isObjectEmpty(null);
      expect(result).toBeTrue();
    });

    it('should return True when input is {} (empty object)', () => {
      const result = isObjectEmpty({});
      expect(result).toBeTrue();
    });

    it('should return False when input is an object with at least 1 property', () => {
      const result = isObjectEmpty({ name: 'John' });
      expect(result).toBeFalse();
    });
  });

  describe('isNumber method', () => {
    it('should return True when comparing a number from a number/string variable when strict mode is disable', () => {
      const result1 = isNumber(22);
      const result2 = isNumber('33');

      expect(result1).toBeTrue();
      expect(result2).toBeTrue();
    });

    it('should return False when comparing string that has a number but also other text within and the strict mode is disable', () => {
      const result = isNumber('33test');
      expect(result).toBeFalse();
    });

    it('should return False when comparing a number from a string variable with strict mode enabled', () => {
      const result1 = isNumber(null, true);
      const result2 = isNumber(undefined, true);
      const result3 = isNumber('33', true);
      const result4 = isNumber('33test', true);

      expect(result1).toBeFalse();
      expect(result2).toBeFalse();
      expect(result3).toBeFalse();
      expect(result4).toBeFalse();
    });
  });

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
      expect(() => castObservableToPromise(rxjs, null)).toThrowError('Something went wrong,');
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
  });

  describe('findItemInHierarchicalStructure method', () => {
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
      expect(() => findItemInHierarchicalStructure(mockColumns, x => x.file === 'pop', '')).toThrowError('findRecursive requires parameter "childrenPropertyName"');
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

  describe('deepCopy method', () => {
    it('should return original input when it is not an object neither an array', () => {
      const msg = 'hello world';
      const age = 20;

      expect(deepCopy(msg)).toBe(msg);
      expect(deepCopy(age)).toBe(age);
    });

    it('should do a deep copy of an object with properties having objects and changing object property should not affect original object', () => {
      const obj1 = { firstName: 'John', lastName: 'Doe', address: { zip: 123456 } };
      const obj2 = deepCopy(obj1);
      obj2.address.zip = 789123;

      expect(obj1.address.zip).toBe(123456);
      expect(obj2.address.zip).toBe(789123);
    });

    it('should do a deep copy of an array of objects with properties having objects and changing object property should not affect original object', () => {
      const obj1 = { firstName: 'John', lastName: 'Doe', address: { zip: 123456 } };
      const obj2 = { firstName: 'Jane', lastName: 'Doe', address: { zip: 222222 } };
      const arr1 = [obj1, obj2];
      const arr2 = deepCopy(arr1);
      arr2[0].address.zip = 888888;
      arr2[1].address.zip = 999999;

      expect(arr1[0].address.zip).toBe(123456);
      expect(arr1[1].address.zip).toBe(222222);
      expect(arr2[0].address.zip).toBe(888888);
      expect(arr2[1].address.zip).toBe(999999);
    });
  });

  describe('deepMerge method', () => {
    it('should return undefined when both inputs are undefined', () => {
      const obj1 = undefined;
      const obj2 = null;
      const output = deepMerge(obj1, obj2);
      expect(output).toEqual(undefined);
    });

    it('should merge object even when 1st input is undefined because 2nd input is an object', () => {
      const input1 = undefined;
      const input2 = { firstName: 'John' };
      const output = deepMerge(input1, input2);
      expect(output).toEqual({ firstName: 'John' });
    });

    it('should merge object even when 1st input is undefined because 2nd input is an object', () => {
      const input1 = { firstName: 'John' };
      const input2 = undefined;
      const output = deepMerge(input1, input2);
      expect(output).toEqual({ firstName: 'John' });
    });

    it('should provide empty object as input and expect output object to include 2nd object', () => {
      const input1 = {};
      const input2 = { firstName: 'John' };
      const output = deepMerge(input1, input2);
      expect(output).toEqual({ firstName: 'John' });
    });

    it('should provide filled object and return same object when 2nd object is also an object', () => {
      const input1 = { firstName: 'Jane' };
      const input2 = { firstName: { name: 'John' } };
      const output = deepMerge(input1, input2);
      expect(output).toEqual({ firstName: { name: 'John' } });
    });

    it('should provide input object with undefined property and expect output object to return merged object from 2nd object when that one is filled', () => {
      const input1 = { firstName: undefined };
      const input2 = { firstName: {} };
      const output = deepMerge(input1, input2);
      expect(output).toEqual({ firstName: {} });
    });

    it('should provide input object with undefined property and expect output object to return merged object from 2nd object when that one is filled', () => {
      const input1 = { firstName: { name: 'John' } };
      const input2 = { firstName: undefined };
      const output = deepMerge(input1, input2);
      expect(output).toEqual({ firstName: undefined });
    });

    it('should merge 2 objects and expect objects to be merged with both side', () => {
      const input1 = { a: 1, b: 1, c: { x: 1, y: 1 }, d: [1, 1] };
      const input2 = { b: 2, c: { y: 2, z: 2 }, d: [2, 2], e: 2 };

      const output = deepMerge(input1, input2);
      expect(output).toEqual({
        a: 1, b: 2, c: { x: 1, y: 2, z: 2 },
        d: [1, 1, 2, 2],
        e: 2
      });
    });

    it('should merge 3 objects and expect objects to be merged with both side', () => {
      const input1 = { a: 1, b: 1, c: { x: 1, y: 1 }, d: [1, 1] };
      const input2 = { b: 2, c: { y: 2, z: 2 } };
      const input3 = { d: [2, 2], e: 2 };

      const output = deepMerge(input1, input2, input3);
      expect(output).toEqual({
        a: 1, b: 2, c: { x: 1, y: 2, z: 2 },
        d: [1, 1, 2, 2],
        e: 2
      });
    });

    it('should merge 3 objects, by calling deepMerge 2 times, and expect objects to be merged with both side', () => {
      const input1 = { a: 1, b: 1, c: { x: 1, y: 1 }, d: [1, 1] };
      const input2 = { b: 2, c: { y: 2, z: 2 } };
      const input3 = { d: [2, 2], e: 2 };

      const output = deepMerge(deepMerge(input1, input2), input3);
      expect(output).toEqual({
        a: 1, b: 2, c: { x: 1, y: 2, z: 2 },
        d: [1, 1, 2, 2],
        e: 2
      });
    });
  });

  describe('emptyObject method', () => {
    it('should empty all object properties', () => {
      const obj = { firstName: 'John', address: { zip: 123456, streetNumber: '123 Belleville Blvd' } };
      expect(emptyObject(obj)).toEqual({});
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

  describe('getDescendantProperty method', () => {
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

  describe('parseBoolean method', () => {
    it('should return false when input value is not parseable to a boolean', () => {
      const output = parseBoolean('abc');
      expect(output).toBe(false);
    });

    it('should return false when input value the string "false"', () => {
      const output = parseBoolean('false');
      expect(output).toBe(false);
    });

    it('should return true when input value the string "true" case insensitive', () => {
      const output1 = parseBoolean('true');
      const output2 = parseBoolean('TRUE');

      expect(output1).toBe(true);
      expect(output2).toBe(true);
    });

    it('should return true when input value is the boolean true', () => {
      const output = parseBoolean(true);
      expect(output).toBe(true);
    });

    it('should return true when input value is number 1', () => {
      const output = parseBoolean(1);
      expect(output).toBe(true);
    });

    it('should return false when input value is 0 or any other number', () => {
      const output1 = parseBoolean(0);
      const output2 = parseBoolean(2);
      const output3 = parseBoolean(-4);

      expect(output1).toBe(false);
      expect(output2).toBe(false);
      expect(output3).toBe(false);
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

  describe('removeAccentFromText method', () => {
    it('should return a normalized string without accent', () => {
      const input1 = 'José';
      const input2 = 'Chêvre';
      const input3 = 'áàãāăǎäéèêëěíìîïǐĩóòôöǒõ';

      expect(removeAccentFromText(input1)).toBe('Jose');
      expect(removeAccentFromText(input2)).toBe('Chevre');
      expect(removeAccentFromText(input3)).toBe('aaaaaaaeeeeeiiiiiioooooo');
    });

    it('should return a normalized string without accent and lowercase when specified', () => {
      const input1 = 'José';
      const input2 = 'Chêvre';
      const input3 = 'ÁÀÃĀĂǍÄÉÈÊËĚÍÌÎÏǏĨÓÒÔÖǑÕ';

      expect(removeAccentFromText(input1, true)).toBe('jose');
      expect(removeAccentFromText(input2, true)).toBe('chevre');
      expect(removeAccentFromText(input3, true)).toBe('aaaaaaaeeeeeiiiiiioooooo');
    });
  });

  describe('setDeepValue method', () => {
    let obj = {};
    beforeEach(() => {
      obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', address: { number: 123, street: 'Broadway' } } };
    });

    it('should be able to update an object at 2nd level deep property', () => {
      setDeepValue(obj, 'user.firstName', 'Jane');
      expect(obj['user'].firstName).toBe('Jane');
    });

    it('should be able to update an object at 3rd level deep property', () => {
      setDeepValue(obj, 'user.address.number', 78);
      expect(obj['user']['address']['number']).toBe(78);
    });

    it('should be able to update a property that is not a complex object', () => {
      setDeepValue(obj, 'id', 76);
      expect(obj['id']).toBe(76);
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

  describe('titleCase method', () => {
    const sentence = 'the quick brown fox';

    it('should return empty string when input is empty', () => {
      const output = titleCase('');
      expect(output).toBe('');
    });

    it('should return empty string when input is null', () => {
      const input = null as any;
      const output = titleCase(input);
      expect(output).toBe(null as any);
    });

    it('should return title case string that will uppercase each first char of every word', () => {
      const output = titleCase(sentence);
      expect(output).toBe('The quick brown fox');
    });

    it('should return title case string that will uppercase each first char of every word', () => {
      const caseEveryWords = true;
      const output = titleCase(sentence, caseEveryWords);
      expect(output).toBe('The Quick Brown Fox');
    });
  });

  describe('toCamelCase method', () => {
    const sentence = 'the quick brown fox';

    it('should return empty string when input is empty', () => {
      const output = toCamelCase('');
      expect(output).toBe('');
    });

    it('should return empty string when input is null', () => {
      const input = null as any;
      const output = toCamelCase(input);
      expect(output).toBe(null as any);
    });

    it('should return a camelCase string when input is a sentence', () => {
      const output = toCamelCase(sentence);
      expect(output).toBe('theQuickBrownFox');
    });

    it('should return a camelCase string when input is a sentence that may include numbers with next char being uppercase', () => {
      const output = toCamelCase(sentence + ' 123 ' + ' apples');
      expect(output).toBe('theQuickBrownFox123Apples');
    });
  });

  describe('toKebabCase method', () => {
    const sentence = 'the quick brown fox';

    it('should return empty string when input is empty', () => {
      const output = toKebabCase('');
      expect(output).toBe('');
    });

    it('should return empty string when input is null', () => {
      const input = null as any;
      const output = toKebabCase(input);
      expect(output).toBe(null as any);
    });

    it('should return a kebab-case string when input is a sentence', () => {
      const output = toKebabCase(sentence);
      expect(output).toBe('the-quick-brown-fox');
    });

    it('should return a kebab-case string when input is a sentence that may include numbers with only following char having the dash', () => {
      const output = toKebabCase(sentence + ' 123 ' + ' apples');
      expect(output).toBe('the-quick-brown-fox123-apples');
    });
  });

  describe('toSentenceCase method', () => {
    const camelCaseSentence = 'theQuickBrownFox';
    const kebabCaseSentence = 'the-quick-brown-fox';

    it('should return empty string when input is empty', () => {
      const output = toSentenceCase('');
      expect(output).toBe('');
    });

    it('should return empty string when input is null', () => {
      const input = null as any;
      const output = toSentenceCase(input);
      expect(output).toBe(null as any);
    });

    it('should return a sentence case (as Title Case) string when input is camelCase type', () => {
      const output = toSentenceCase(camelCaseSentence);
      expect(output).toBe('The Quick Brown Fox');
    });

    it('should return a sentence case string when input is kebab-case type', () => {
      const output = toSentenceCase(kebabCaseSentence);
      expect(output).toBe('The quick brown fox');
    });

    it('should return a sentence case string when input is a sentence that may include numbers and extra spaces', () => {
      const output = toSentenceCase(kebabCaseSentence + ' 123 ' + '  apples  ');
      expect(output).toBe('The quick brown fox 123 apples');
    });
  });

  describe('toSnakeCase method', () => {
    const sentence = 'the quick brown fox';

    it('should return empty string when input is empty', () => {
      const output = toSnakeCase('');
      expect(output).toBe('');
    });

    it('should return empty string when input is null', () => {
      const input = null as any;
      const output = toSnakeCase(input);
      expect(output).toBe(null as any);
    });

    it('should return a snake-case string when input is a sentence', () => {
      const output = toSnakeCase(sentence);
      expect(output).toBe('the_quick_brown_fox');
    });

    it('should return a snake_case string when input is a sentence that may include numbers with only following char having the dash', () => {
      const output = toSnakeCase(sentence + ' 123 ' + ' apples');
      expect(output).toBe('the_quick_brown_fox123_apples');
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

  describe('uniqueArray method', () => {
    it('should return original value when input is not an array', () => {
      const output1 = uniqueArray(null as any);
      const output2 = uniqueArray(undefined as any);

      expect(output1).toBeNull();
      expect(output2).toBe(undefined as any);
    });

    it('should return original array when array is empty', () => {
      const output = uniqueArray([]);
      expect(output).toEqual([]);
    });

    it('should return unique values when input array has duplicate string values', () => {
      const output = uniqueArray(['a', 'b', 'a']);
      expect(output).toEqual(['a', 'b']);
    });

    it('should return unique values when input array has duplicate number values', () => {
      const output = uniqueArray([1, 5, 2, 1, 5]);
      expect(output).toEqual([1, 5, 2]);
    });
  });

  describe('uniqueObjectArray method', () => {
    it('should return original value when input is not an array', () => {
      const output1 = uniqueObjectArray(null as any);
      const output2 = uniqueObjectArray(undefined as any);

      expect(output1).toBeNull();
      expect(output2).toBe(undefined as any);
    });

    it('should return original array when array is empty', () => {
      const output = uniqueObjectArray([]);
      expect(output).toEqual([]);
    });

    it('should return unique values when input array has duplicate objects', () => {
      const collection = [{ id: 9, name: 'a', order: 3 }, { id: 22, name: 'def', order: 45 }, { id: 9, name: 'a', order: 3 }];
      const output = uniqueObjectArray(collection, 'id');
      expect(output).toHaveLength(2);
    });
  });
});
