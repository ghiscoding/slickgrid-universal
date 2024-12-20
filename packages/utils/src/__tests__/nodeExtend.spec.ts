import { describe, expect, it, test } from 'vitest';

import { extend } from '../nodeExtend.js';

// port of all the node-extend tests
// original tests can be found at: https://github.com/justmoon/node-extend/blob/main/test/index.js

describe('extend()', () => {
  const str = 'me a test';
  const integer = 10;
  const arr = [1, 'what', new Date(81, 8, 4)];
  const date = new Date(81, 4, 13);

  const Foo = function () {};

  const obj = {
    str,
    integer,
    arr,
    date,
    constructor: 'fake',
    isPrototypeOf: 'not a function',
    foo: new Foo(),
  };

  const deep = {
    ori: obj,
    layer: {
      integer: 10,
      str: 'str',
      date: new Date(84, 5, 12),
      arr: [101, 'dude', new Date(82, 10, 4)],
      deep: {
        str: obj.str,
        integer,
        arr: obj.arr,
        date: new Date(81, 7, 4),
      },
    },
  };

  describe('missing arguments', () => {
    test('missing first argument is second argument', () => expect(extend(undefined, { a: 1 })).toEqual({ a: 1 }));
    test('missing second argument is first argument', () => expect(extend({ a: 1 })).toEqual({ a: 1 }));
    test('deep: missing first argument is second argument', () => expect(extend(true, undefined, { a: 1 })).toEqual({ a: 1 }));
    test('deep: missing second argument is first argument', () => expect(extend(true, { a: 1 })).toEqual({ a: 1 }));
    test('no arguments is object', () => expect(extend()).toEqual({}));
  });

  describe('merge string with string', () => {
    const ori = 'what u gonna say';
    const target = extend(ori, str);
    const expectedTarget = {
      0: 'm',
      1: 'e',
      2: ' ',
      3: 'a',
      4: ' ',
      5: 't',
      6: 'e',
      7: 's',
      8: 't',
    };

    test('original string 1 is unchanged', () => expect(ori).toBe('what u gonna say'));
    test('original string 2 is unchanged', () => expect(str).toBe('me a test'));
    test('string + string is merged object form of string', () => expect(target).toEqual(expectedTarget));
  });

  describe('merge string with number', () => {
    const ori = 'what u gonna say';
    const target = extend(ori, 10);

    test('original string is unchanged', () => expect(ori).toBe('what u gonna say'));
    test('string + number is empty object', () => expect(target).toEqual({}));
  });

  describe('merge string with array', () => {
    const ori = 'what u gonna say';
    const target = extend(ori, arr);

    test('original string is unchanged', () => expect(ori).toBe('what u gonna say'));
    test('array is unchanged', () => expect(arr).toEqual([1, 'what', new Date(81, 8, 4)]));
    test('string + array is array', () =>
      expect(target).toEqual({
        0: 1,
        1: 'what',
        2: new Date(81, 8, 4),
      }));
  });

  describe('merge string with date', () => {
    const ori = 'what u gonna say';
    const target = extend(ori, date);

    const testDate = new Date(81, 4, 13);
    test('original string is unchanged', () => expect(ori).toBe('what u gonna say'));
    test('date is unchanged', () => expect(date).toEqual(testDate));
    // test('string + date is date', () => expect(target).toEqual(testDate));
    test('string + date is empty object', () => expect(target).toEqual({}));
  });

  describe('merge string with obj', () => {
    const ori = 'what u gonna say';
    const target = extend(ori, obj);
    const testObj = {
      str: 'me a test',
      integer: 10,
      arr: [1, 'what', new Date(81, 8, 4)],
      date: new Date(81, 4, 13),
      constructor: 'fake',
      isPrototypeOf: 'not a function',
      foo: new Foo(),
    };

    test('original string is unchanged', () => expect(ori).toBe('what u gonna say'));
    test('original obj is unchanged', () => expect(obj).toEqual(testObj));
    test('string + obj is obj', () => expect(target).toEqual(testObj));
  });

  describe('merge number with string', () => {
    const ori = 20;
    const target = extend(ori, str);

    test('number is unchanged', () => expect(ori).toBe(20));
    test('string is unchanged', () => expect(str).toBe('me a test'));
    test('number + string is object form of string', () =>
      expect(target).toEqual({
        0: 'm',
        1: 'e',
        2: ' ',
        3: 'a',
        4: ' ',
        5: 't',
        6: 'e',
        7: 's',
        8: 't',
      }));
  });

  describe('merge number with number', () => {
    test('number + number is empty object', () => expect(extend(20, 10)).toEqual({}));
  });

  describe('merge number with array', () => {
    const target = extend(20, arr);

    test('array is unchanged', () => expect(arr).toEqual([1, 'what', new Date(81, 8, 4)]));
    test('number + arr is object with array contents', () =>
      expect(target).toEqual({
        0: 1,
        1: 'what',
        2: new Date(81, 8, 4),
      }));
  });

  describe('merge number with date', () => {
    const target = extend(20, date);
    const testDate = new Date(81, 4, 13);

    test('original date is unchanged', () => expect(date).toEqual(testDate));
    // test('number + date is date', () => expect(target).toEqual(testDate));
    test('number + date is empty object', () => expect(target).toEqual({}));
  });

  describe('merge number with object', () => {
    const target = extend(20, obj);
    const testObj = {
      str: 'me a test',
      integer: 10,
      arr: [1, 'what', new Date(81, 8, 4)],
      date: new Date(81, 4, 13),
      constructor: 'fake',
      isPrototypeOf: 'not a function',
      foo: new Foo(),
    };

    test('obj is unchanged', () => expect(obj).toEqual(testObj));
    test('number + obj is obj', () => expect(target).toEqual(testObj));
  });

  describe('merge array with string', () => {
    const ori = [1, 2, 3, 4, 5, 6];
    const target = extend(ori, str);

    test('array is changed to be an array of string chars', () => expect(ori).toEqual(str.split('')));
    test('string is unchanged', () => expect(str).toBe('me a test'));
    test('array + string is object form of string', () =>
      expect(target).toMatchObject({
        0: 'm',
        1: 'e',
        2: ' ',
        3: 'a',
        4: ' ',
        5: 't',
        6: 'e',
        7: 's',
        8: 't',
      }));
  });

  describe('merge array with number', () => {
    const ori = [1, 2, 3, 4, 5, 6];
    const target = extend(ori, 10);

    test('array is unchanged', () => expect(ori).toEqual([1, 2, 3, 4, 5, 6]));
    test('array + number is array', () => expect(target).toEqual(ori));
  });

  describe('merge array with array', () => {
    const ori = [1, 2, 3, 4, 5, 6];
    const target = extend(ori, arr);
    const testDate = new Date(81, 8, 4);
    const expectedTarget = [1, 'what', testDate, 4, 5, 6];

    test('array + array merges arrays; changes first array', () => expect(ori).toEqual(expectedTarget));
    test('second array is unchanged', () => expect(arr).toEqual([1, 'what', testDate]));
    test('array + array is merged array', () => expect(target).toEqual(expectedTarget));
  });

  describe('merge array with date', () => {
    const ori = [1, 2, 3, 4, 5, 6];
    const target = extend(ori, date);
    const testDate = new Date(81, 4, 13);
    const testArray = [1, 2, 3, 4, 5, 6];

    test('array is unchanged', () => expect(ori).toEqual(testArray));
    test('date is unchanged', () => expect(date).toEqual(testDate));
    test('array + date is array', () => expect(target).toEqual(testArray));
  });

  describe('merge array with object', () => {
    const ori: any = [1, 2, 3, 4, 5, 6];
    const target = extend(ori, obj);
    const testObject = {
      str: 'me a test',
      integer: 10,
      arr: [1, 'what', new Date(81, 8, 4)],
      date: new Date(81, 4, 13),
      constructor: 'fake',
      isPrototypeOf: 'not a function',
      foo: new Foo(),
    };

    test('obj is unchanged', () => expect(obj).toEqual(testObject));
    test('array has proper length', () => expect(ori.length).toBe(6));
    test('array has obj.str property', () => expect(ori.str).toBe(obj.str));
    test('array has obj.integer property', () => expect(ori.integer).toBe(obj.integer));
    test('array has obj.arr property', () => expect(ori.arr).toEqual(obj.arr));
    test('array has obj.date property', () => expect(ori.date).toBe(obj.date));

    test('target has proper length', () => expect(target.length).toBe(6));
    test('target has obj.str property', () => expect(target.str).toBe(obj.str));
    test('target has obj.integer property', () => expect(target.integer).toBe(obj.integer));
    test('target has obj.arr property', () => expect(target.arr).toEqual(obj.arr));
    test('target has obj.date property', () => expect(target.date).toBe(obj.date));
  });

  describe('merge date with string', () => {
    const ori = new Date(81, 9, 20);
    const target = extend(ori, str);
    const testObject = {
      0: 'm',
      1: 'e',
      2: ' ',
      3: 'a',
      4: ' ',
      5: 't',
      6: 'e',
      7: 's',
      8: 't',
    };

    test('date is changed to object form of string', () => expect(ori).toMatchObject(testObject));
    test('string is unchanged', () => expect(str).toBe('me a test'));
    test('date + string is object form of string', () => expect(target).toMatchObject(testObject));
  });

  describe('merge date with number', () => {
    const ori = new Date(81, 9, 20);
    const target = extend(ori, 10);

    // test('date is changed to empty object', () => expect(ori).toEqual({}));
    // test('date + number is empty object', () => expect(target).toEqual({}));
    test('date is unchanged', () => expect(ori).toEqual(ori));
    test('date + number is date', () => expect(target).toEqual(ori));
  });

  describe('merge date with array', () => {
    const ori = new Date(81, 9, 20);
    const target = extend(ori, arr);
    const testDate = new Date(81, 9, 20);
    const testArray = [1, 'what', new Date(81, 8, 4)];

    test('date is unchanged', () => expect(ori).toEqual(testDate));
    test('array is unchanged', () => expect(arr).toEqual(testArray));
    test('date + array is date', () => expect(target).toEqual(testDate));
  });

  describe('merge date with date', () => {
    const ori = new Date(81, 9, 20);
    const target = extend(ori, date);

    // test('date is empty object', () => expect(ori).toEqual({}));
    // test('date + date is empty object', () => expect(target).toEqual({}));
    test('date + date is date', () => expect(target).toEqual(ori));
  });

  describe('merge date with object', () => {
    const ori = new Date(81, 9, 20);
    const target = extend(ori, obj);
    const testDate = new Date(81, 8, 4);
    const testObject = {
      str: 'me a test',
      integer: 10,
      arr: [1, 'what', testDate],
      date: new Date(81, 4, 13),
      constructor: 'fake',
      isPrototypeOf: 'not a function',
      foo: new Foo(),
    };

    test('original object is unchanged', () => expect(obj).toMatchObject(testObject));
    test('date becomes original object', () => expect(ori).toMatchObject(testObject));
    test('date + object is object', () => expect(target).toMatchObject(testObject));
  });

  describe('merge object with string', () => {
    const testDate = new Date(81, 7, 26);
    const ori = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: testDate,
    };
    const target = extend(ori, str);
    const testObj = {
      0: 'm',
      1: 'e',
      2: ' ',
      3: 'a',
      4: ' ',
      5: 't',
      6: 'e',
      7: 's',
      8: 't',
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: testDate,
    };

    test('original object updated', () => expect(ori).toEqual(testObj));
    test('string is unchanged', () => expect(str).toBe('me a test'));
    test('object + string is object + object form of string', () => expect(target).toEqual(testObj));
  });

  describe('merge object with number', () => {
    const ori = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
    };
    const testObject = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
    };
    const target = extend(ori, 10);

    test('object is unchanged', () => expect(ori).toEqual(testObject));
    test('object + number is object', () => expect(target).toEqual(testObject));
  });

  describe('merge object with array', () => {
    const ori = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
    };
    const target = extend(ori, arr);
    const testObject = {
      0: 1,
      1: 'what',
      2: new Date(81, 8, 4),
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
    };

    test('original object is merged', () => expect(ori).toEqual(testObject));
    test('array is unchanged', () => expect(arr).toEqual([1, 'what', testObject[2]]));
    test('object + array is merged object', () => expect(target).toEqual(testObject));
  });

  describe('merge object with date', () => {
    const ori = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
    };
    const target = extend(ori, date);
    const testObject = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
    };

    test('original object is unchanged', () => expect(ori).toEqual(testObject));
    test('date is unchanged', () => expect(date).toEqual(new Date(81, 4, 13)));
    test('object + date is object', () => expect(target).toEqual(testObject));
  });

  describe('merge object with object', () => {
    const ori = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
      foo: 'bar',
    };
    const target = extend(ori, obj);
    const expectedObj = {
      str: 'me a test',
      integer: 10,
      arr: [1, 'what', new Date(81, 8, 4)],
      date: new Date(81, 4, 13),
      constructor: 'fake',
      isPrototypeOf: 'not a function',
      foo: new Foo(),
    };
    const expectedTarget = {
      str: 'me a test',
      integer: 10,
      arr: [1, 'what', new Date(81, 8, 4)],
      date: new Date(81, 4, 13),
      constructor: 'fake',
      isPrototypeOf: 'not a function',
      foo: new Foo(),
    };

    test('obj is unchanged', () => expect(obj).toEqual(expectedObj));
    test('original has been merged', () => expect(ori).toEqual(expectedTarget));
    test('object + object is merged object', () => expect(target).toEqual(expectedTarget));
  });

  describe('deep clone', () => {
    const ori = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
      layer: { deep: { integer: 42 } },
    };
    const target = extend(true, ori, deep);

    test('original object is merged', () =>
      expect(ori).toEqual({
        str: 'no shit',
        integer: 76,
        arr: [1, 2, 3, 4],
        date: new Date(81, 7, 26),
        ori: {
          str: 'me a test',
          integer: 10,
          arr: [1, 'what', new Date(81, 8, 4)],
          date: new Date(81, 4, 13),
          constructor: 'fake',
          isPrototypeOf: 'not a function',
          foo: new Foo(),
        },
        layer: {
          integer: 10,
          str: 'str',
          date: new Date(84, 5, 12),
          arr: [101, 'dude', new Date(82, 10, 4)],
          deep: {
            str: 'me a test',
            integer: 10,
            arr: [1, 'what', new Date(81, 8, 4)],
            date: new Date(81, 7, 4),
          },
        },
      }));

    test('deep is unchanged', () =>
      expect(deep).toEqual({
        ori: {
          str: 'me a test',
          integer: 10,
          arr: [1, 'what', new Date(81, 8, 4)],
          date: new Date(81, 4, 13),
          constructor: 'fake',
          isPrototypeOf: 'not a function',
          foo: new Foo(),
        },
        layer: {
          integer: 10,
          str: 'str',
          date: new Date(84, 5, 12),
          arr: [101, 'dude', new Date(82, 10, 4)],
          deep: {
            str: 'me a test',
            integer: 10,
            arr: [1, 'what', new Date(81, 8, 4)],
            date: new Date(81, 7, 4),
          },
        },
      }));

    test('deep + object + object is deeply merged object', () =>
      expect(target).toEqual({
        str: 'no shit',
        integer: 76,
        arr: [1, 2, 3, 4],
        date: new Date(81, 7, 26),
        ori: {
          str: 'me a test',
          integer: 10,
          arr: [1, 'what', new Date(81, 8, 4)],
          date: new Date(81, 4, 13),
          constructor: 'fake',
          isPrototypeOf: 'not a function',
          foo: new Foo(),
        },
        layer: {
          integer: 10,
          str: 'str',
          date: new Date(84, 5, 12),
          arr: [101, 'dude', new Date(82, 10, 4)],
          deep: {
            str: 'me a test',
            integer: 10,
            arr: [1, 'what', new Date(81, 8, 4)],
            date: new Date(81, 7, 4),
          },
        },
      }));

    // ----- NEVER USE EXTEND WITH THE ABOVE SITUATION ------------------------------
  });

  describe('deep clone - change target property', () => {
    const ori = {
      str: 'no shit',
      integer: 76,
      arr: [1, 2, 3, 4],
      date: new Date(81, 7, 26),
      layer: { deep: { integer: 42 } },
    };
    const target = extend(true, ori, deep);
    target.layer.deep = 339;

    test('deep is unchanged after setting target property', () =>
      expect(deep).toEqual({
        ori: {
          str: 'me a test',
          integer: 10,
          arr: [1, 'what', new Date(81, 8, 4)],
          date: new Date(81, 4, 13),
          constructor: 'fake',
          isPrototypeOf: 'not a function',
          foo: new Foo(),
        },
        layer: {
          integer: 10,
          str: 'str',
          date: new Date(84, 5, 12),
          arr: [101, 'dude', new Date(82, 10, 4)],
          deep: {
            str: 'me a test',
            integer: 10,
            arr: [1, 'what', new Date(81, 8, 4)],
            date: new Date(81, 7, 4),
          },
        },
      }));
    // ----- NEVER USE EXTEND WITH THE ABOVE SITUATION ------------------------------
  });

  describe('deep clone; arrays are merged', () => {
    const defaults = { arr: [1, 2, 3] };
    const override = { arr: ['x'] };
    const expectedTarget = { arr: ['x', 2, 3] };

    const target = extend(true, defaults, override);

    test('arrays are merged', () => expect(target).toEqual(expectedTarget));
  });

  describe('deep clone === false; objects merged normally', () => {
    const defaults = { a: 1 };
    const override = { a: 2 };
    const target = extend(false, defaults, override);
    test('deep === false handled normally', () => expect(target).toEqual(override));
  });

  describe('pass in null; should create a valid object', () => {
    const override = { a: 1 };
    const target = extend(null, override);
    test('null object handled normally', () => expect(target).toEqual(override));
  });

  describe('works without Array.isArray', () => {
    const savedIsArray = Array.isArray;
    Array.isArray = false as any; // don't delete, to preserve enumerability
    const target = [];
    const source = [1, [2], { 3: true }];

    test('It works without Array.isArray', () => expect(extend(true, target, source)).toEqual([1, [2], { 3: true }]));
    Array.isArray = savedIsArray;
  });

  describe('non-object target', () => {
    test('non-object', () => expect(extend(3.14, { a: 'b' })).toEqual({ a: 'b' }));
    test('non-object', () => expect(extend(true, 3.14, { a: 'b' })).toEqual({ a: 'b' }));
  });

  describe('__proto__ is merged as an own property', () => {
    const malicious = { fred: 1 };
    Object.defineProperty(malicious, '__proto__', { value: { george: 1 }, enumerable: true });
    const target: any = {};
    extend(true, target, malicious);

    test('falsy target prop', () => expect(target.george).toBeFalsy());
    test('truthy prototype', () => expect(Object.prototype.hasOwnProperty.call(target, '__proto__')).toBeTruthy());
    test('prototype has a value set', () => expect(Object.getOwnPropertyDescriptor(target, '__proto__')!.value).toEqual({ george: 1 }));
  });
});

describe('extend() - extra tests', () => {
  it('should be able to make a perfect deep copy of an object', () => {
    const callback = () => console.log('hello');
    const obj1 = { hello: { sender: 'me', target: 'world' }, deeper: { children: ['abc', 'cde'], callback } };
    const obj2 = extend(true, {}, obj1, { another: 'prop' });

    expect(obj2).toEqual({ hello: { sender: 'me', target: 'world' }, deeper: { children: ['abc', 'cde'], callback }, another: 'prop' });
  });

  it('should be able to make a perfect deep copy of an object that includes String() and Boolean() constructors', () => {
    const callback = () => console.log('hello');
    const obj1 = { hello: { sender: 'me', target: String(123), valid: Boolean(null) }, deeper: { children: ['abc', 'cde'], callback } };
    const obj2 = extend(true, {}, obj1, { another: 'prop' });

    expect(obj2).toEqual({ hello: { sender: 'me', target: '123', valid: false }, deeper: { children: ['abc', 'cde'], callback }, another: 'prop' });
  });

  it('should be able to make a deep copy of an object and changing new object prop should not affect input object', () => {
    const obj1 = { hello: { sender: 'me', target: 'world' }, deeper: { children: ['abc', 'cde'] } };
    const obj2 = extend(true, {}, obj1, { another: 'prop' });
    obj2.hello.target = 'mum';

    expect(obj1).toEqual({ hello: { sender: 'me', target: 'world' }, deeper: { children: ['abc', 'cde'] } });
    expect(obj2).toEqual({ hello: { sender: 'me', target: 'mum' }, deeper: { children: ['abc', 'cde'] }, another: 'prop' });
  });

  it('should assume an extended object when passing true boolean but ommitting empty object as target, so changing output object will impact input object as well', () => {
    const obj1 = { hello: { sender: 'me', target: 'world' }, deeper: { children: ['abc', 'cde'] } };
    const obj2 = extend(true, obj1, { another: 'prop' });
    obj2.hello.target = 'mum';

    expect(obj1).toEqual({ hello: { sender: 'me', target: 'mum' }, deeper: { children: ['abc', 'cde'] }, another: 'prop' });
    expect(obj2).toEqual({ hello: { sender: 'me', target: 'mum' }, deeper: { children: ['abc', 'cde'] }, another: 'prop' });
  });

  it('should assume an extended object when ommitting true boolean, so changing output object will impact input object as well', () => {
    const obj1 = { hello: { sender: 'me', target: 'world' }, deeper: { children: ['abc', 'cde'] } };
    const obj2 = extend(obj1, { another: { age: 20 } });
    obj2.hello.target = 'mum';

    expect(obj1).toEqual({ hello: { sender: 'me', target: 'mum' }, deeper: { children: ['abc', 'cde'] }, another: { age: 20 } });
    expect(obj2).toEqual({ hello: { sender: 'me', target: 'mum' }, deeper: { children: ['abc', 'cde'] }, another: { age: 20 } });
  });

  it('should return same object when passing input object twice', () => {
    const obj1 = { hello: { sender: 'me', target: 'world' }, deeper: { children: ['abc', 'cde'] } };
    const obj2 = extend(true, {}, obj1, obj1);

    expect(obj2).toEqual(obj1);
  });

  it('should do a deep copy of an array of objects with properties having objects and changing object property should not affect original object', () => {
    const obj1 = { firstName: 'John', lastName: 'Doe', address: { zip: 123456 } };
    const obj2 = { firstName: 'Jane', lastName: 'Doe', address: { zip: 222222 } };
    const arr1 = [obj1, obj2];
    const arr2 = extend(true, [], arr1);
    arr2[0].address.zip = 888888;
    arr2[1].address.zip = 999999;

    expect(arr1[0].address.zip).toBe(123456);
    expect(arr1[1].address.zip).toBe(222222);
    expect(arr2[0].address.zip).toBe(888888);
    expect(arr2[1].address.zip).toBe(999999);
  });

  it('should return same object when passing only a single object', () => {
    expect(extend({ hello: 'world' })).toEqual({ hello: 'world' });
  });

  it('should expect Symbol to be converted to Object', () => {
    const sym1 = Symbol('foo');
    const sym2 = Symbol('bar');

    expect(extend(sym1, sym2, { hello: 'world' })).toEqual({ hello: 'world' });
  });

  it('should be able to make a copy of an object with prototype', () => {
    const l = console.log;
    const method = () => l('method in obj');
    const obj = {
      method,
    };
    const obj2: any = { hello: 'world' };
    obj2.__proto__ = obj;

    const obj1 = { hello: { sender: 'me', target: 'world' }, deeper: { children: ['abc', 'cde'] } };
    const obj3 = extend(obj1, obj2);

    expect(obj3).toEqual({ hello: 'world', deeper: { children: ['abc', 'cde'] }, method });
  });
});
