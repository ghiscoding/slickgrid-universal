import 'jest-extended';

import {
  addToArrayWhenNotExists,
  addWhiteSpaces,
  arrayRemoveItemByIndex,
  deepCopy,
  deepMerge,
  objectAssignAndExtend,
  emptyObject,
  hasData,
  isEmptyObject,
  isNumber,
  isPrimitiveValue,
  isObject,
  isObjectEmpty,
  parseBoolean,
  removeAccentFromText,
  setDeepValue,
  titleCase,
  toCamelCase,
  toKebabCase,
  toSentenceCase,
  toSnakeCase,
  uniqueArray,
  uniqueObjectArray,
} from '../utils';

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

  describe('hasData method', () => {
    it('should return True when input has test, or is a boolean (true or false) or if it is an object', () => {
      expect(hasData('test')).toBe(true);
      expect(hasData(true)).toBe(true);
      expect(hasData(false)).toBe(true);
      expect(hasData({})).toBe(true);
    });

    it('should return False when input is undefined, null or false', () => {
      expect(hasData(undefined)).toBe(false);
      expect(hasData(null)).toBe(false);
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

  describe('isObject method', () => {
    it('should return false when input is undefined', () => {
      expect(isObject(undefined)).toBeFalse();
    });

    it('should return false when input is null', () => {
      expect(isObject(null)).toBeFalse();
    });

    it('should return false when input is empty string', () => {
      expect(isObject('')).toBeFalse();
    });

    it('should return false when input is a string', () => {
      expect(isObject('some text')).toBeFalse();
    });

    it('should return false when input is an empty array', () => {
      expect(isObject([])).toBeFalse();
    });

    it('should return false when input a Date', () => {
      expect(isObject(new Date())).toBeFalse();
    });

    it('should return true when input is an empty object', () => {
      expect(isObject({})).toBeTrue();
    });

    it('should return true when input is an object', () => {
      expect(isObject({ msg: 'hello workd' })).toBeTrue();
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

  describe('isPrimitiveValue method', () => {
    it('should return True when input is undefined', () => {
      const result = isPrimitiveValue(undefined);
      expect(result).toBeTrue();
    });

    it('should return True when input is null', () => {
      const result = isPrimitiveValue(null);
      expect(result).toBeTrue();
    });

    it('should return True when input is a number', () => {
      const result = isPrimitiveValue(0);
      expect(result).toBeTrue();
    });

    it('should return True when input is a string', () => {
      const result = isPrimitiveValue('');
      expect(result).toBeTrue();
    });

    it('should return False when input is an empty object', () => {
      const result = isPrimitiveValue({});
      expect(result).toBeFalsy();
    });

    it('should return False when input is a function', () => {
      const result = isPrimitiveValue(() => true);
      expect(result).toBeFalsy();
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

  describe('objectAssignAndExtend method', () => {
    it('should return undefined when both inputs are undefined', () => {
      const obj1 = undefined;
      const obj2 = null;
      const output = objectAssignAndExtend(obj1, obj2);
      expect(output).toEqual(undefined);
    });

    it('should merge object even when 1st input is undefined because 2nd input is an object', () => {
      const input1 = undefined;
      const input2 = { firstName: 'John' };
      const output = objectAssignAndExtend(input1, input2);
      expect(output).toEqual({ firstName: 'John' });
    });

    it('should merge object even when 1st input is undefined because 2nd input is an object', () => {
      const input1 = { firstName: 'John' };
      const input2 = undefined;
      const output = objectAssignAndExtend(input1, input2);
      expect(output).toEqual({ firstName: 'John' });
    });

    it('should provide empty object as input and expect output object to include 2nd object', () => {
      const input1 = {};
      const input2 = { firstName: 'John' };
      const output = objectAssignAndExtend(input1, input2);
      expect(output).toEqual({ firstName: 'John' });
    });

    it('should not overwrite property when already filled with a value', () => {
      const input1 = { firstName: 'Jane' };
      const input2 = { firstName: { name: 'John' } };
      const output = objectAssignAndExtend(input1, input2);
      expect(output).toEqual({ firstName: 'Jane' });
    });

    it('should provide input object with undefined property and expect output object to return merged object from 2nd object when that one is filled', () => {
      const input1 = { firstName: undefined };
      const input2 = { firstName: {} };
      const output = objectAssignAndExtend(input1, input2);
      expect(output).toEqual({ firstName: {} });
    });

    it('should provide input object with undefined property and not expect it to overwrite property since it already has a value', () => {
      const input1 = { firstName: { name: 'John' } };
      const input2 = { firstName: undefined };
      const output = objectAssignAndExtend(input1, input2);
      expect(output).toEqual({ firstName: { name: 'John' } });
    });

    it('should merge 2 objects and expect objects to be merged with both side', () => {
      const input1 = { a: 1, b: 1, c: { x: 1, y: 1 }, d: [1, 1] };
      const input2 = { b: 2, c: { y: 2, z: 2 }, d: [2, 2], e: 2 };

      const output = objectAssignAndExtend(input1, input2);
      expect(output).toEqual({
        a: 1, b: 1, c: { x: 1, y: 1, z: 2 },
        d: [1, 1],
        e: 2
      });
    });

    it('should merge 3 objects and expect objects to be merged with both side', () => {
      const input1 = { a: 1, b: 1, c: { x: 1, y: 1 }, d: [1, 1] };
      const input2 = { b: 2, c: { y: 2, z: 2 } };
      const input3 = { d: [2, 2], e: 2 };

      const output = objectAssignAndExtend(input1, input2, input3);
      expect(output).toEqual({
        a: 1, b: 1, c: { x: 1, y: 1, z: 2 },
        d: [1, 1],
        e: 2
      });
    });

    it('should merge 3 objects, by calling objectAssignAndExtend 2 times, and expect objects to be merged with both side', () => {
      const input1 = { a: 1, b: 1, c: { x: 1, y: 1 }, d: [1, 1] };
      const input2 = { b: 2, c: { y: 2, z: 2 } };
      const input3 = { d: [2, 2], e: 2 };

      const output = objectAssignAndExtend(objectAssignAndExtend(input1, input2), input3);
      expect(output).toEqual({
        a: 1, b: 1, c: { x: 1, y: 1, z: 2 },
        d: [1, 1],
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
    let obj: any = {};
    beforeEach(() => {
      obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', age: null, address: { number: 123, street: 'Broadway' } } };
    });

    it('should be able to update an object at 2nd level deep property', () => {
      setDeepValue(obj, 'user.firstName', 'Jane');
      expect(obj.user.firstName).toBe('Jane');
    });

    it('should be able to update an object at 3rd level deep property', () => {
      setDeepValue(obj, 'user.address.number', 78);
      expect(obj.user.address.number).toBe(78);
    });

    it('should be able to update a property that is not a complex object', () => {
      setDeepValue(obj, 'id', 76);
      expect(obj.id).toBe(76);
    });

    it('should be able to udpate a property even when its original value was undefined', () => {
      setDeepValue(obj, 'user.age', 20);
      expect(obj.user.age).toBe(20);
    });

    it('should be able to udpate a property even when its original value was null', () => {
      obj.user.age = null;
      setDeepValue(obj, 'user.age', 20);
      expect(obj.user.age).toBe(20);
    });

    it('should be able to update a property that has some properties with array as value', () => {
      obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', addresses: [{ number: 123, street: 'Broadway' }, { number: 234, street: 'Beverly' }] } };
      setDeepValue(obj, 'id', 76);
      expect(obj.id).toBe(76);
      expect(obj).toEqual({ id: 76, user: { firstName: 'John', lastName: 'Doe', addresses: [{ number: 123, street: 'Broadway' }, { number: 234, street: 'Beverly' }] } });
    });

    it('should be able to set a property even when its original value is undefined', () => {
      obj = {};
      setDeepValue(obj, 'user.name', 'John');
      expect(obj.user.name).toBe('John');
    });

    it('should be able to update a property of an array inside a complex object', () => {
      obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', addresses: [{ number: null, street: 'Broadway' }, { number: 234, street: 'Beverly' }] } };
      setDeepValue(obj, 'user.addresses.0.number', 111);
      expect(obj.user.addresses[0].number).toBe(111);
      expect(obj).toEqual({ id: 1, user: { firstName: 'John', lastName: 'Doe', addresses: [{ number: 111, street: 'Broadway' }, { number: 234, street: 'Beverly' }] } });
    });

    it('should be able to update a property of an array inside a complex object', () => {
      obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', addresses: [{ doorNumber: 123, street: 'Broadway' }, { doorNumber: ['234-B'], street: 'Beverly' }] } };
      setDeepValue(obj, 'user.addresses.1.doorNumber', ['234-AA', '234-B']);
      expect(obj.user.addresses[1].doorNumber).toEqual(['234-AA', '234-B']);
      expect(obj).toEqual({ id: 1, user: { firstName: 'John', lastName: 'Doe', addresses: [{ doorNumber: 123, street: 'Broadway' }, { doorNumber: ['234-AA', '234-B'], street: 'Beverly' }] } });
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
