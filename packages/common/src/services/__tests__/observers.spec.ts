import { describe, expect, it, vi } from 'vitest';

import {
  collectionObserver,
  propertyObserver,
} from '../observers.js';

vi.useFakeTimers();


describe('Service/Observers', () => {
  describe('collectionObserver method', () => {
    it('should watch for array "pop" change and expect callback to be executed', () => new Promise((done: any) => {
      const expectation: any[] = [{ value: true, label: 'True' }, { value: false, label: 'False' }];
      const inputArray = [{ value: true, label: 'True' }, { value: false, label: 'False' }, { value: '', label: '' }];

      collectionObserver(inputArray, (updatedArray) => {
        expect(JSON.stringify(updatedArray)).toEqual(JSON.stringify(expectation));
        done();
      });
      inputArray.pop();
    }));

    it('should watch for array "push" change and expect callback to be executed', () => new Promise((done: any) => {
      const expectation = [{ value: true, label: 'True' }, { value: false, label: 'False' }, { value: '', label: '' }];
      const inputArray: any[] = [{ value: true, label: 'True' }, { value: false, label: 'False' }];

      collectionObserver(inputArray, (updatedArray) => {
        expect(JSON.stringify(updatedArray)).toEqual(JSON.stringify(expectation));
        done();
      });
      inputArray.push({ value: '', label: '' });
    }));

    it('should watch for array "unshift" change and expect callback to be executed', () => new Promise((done: any) => {
      const expectation = [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }];
      const inputArray: any[] = [{ value: true, label: 'True' }, { value: false, label: 'False' }];

      collectionObserver(inputArray, (updatedArray) => {
        expect(JSON.stringify(updatedArray)).toEqual(JSON.stringify(expectation));
        done();
      });
      inputArray.unshift({ value: '', label: '' });
    }));

    it('should watch for array "unshift" change and expect callback to be executed', () => new Promise((done: any) => {
      const expectation = [{ value: true, label: 'True' }, { value: false, label: 'False' }];
      const inputArray: any[] = [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }];

      collectionObserver(inputArray, (updatedArray) => {
        expect(JSON.stringify(updatedArray)).toEqual(JSON.stringify(expectation));
        done();
      });
      inputArray.shift();
    }));

    it('should watch for array "unshift" change and expect callback to be executed', () => new Promise((done: any) => {
      const expectation = [{ value: '', label: '' }, { value: false, label: 'False' }];
      const inputArray: any[] = [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }];

      collectionObserver(inputArray, (updatedArray) => {
        expect(JSON.stringify(updatedArray)).toEqual(JSON.stringify(expectation));
        done();
      });
      inputArray.splice(1, 1);
    }));

    it('should watch for array "reverse" change and expect callback to be executed', () => new Promise((done: any) => {
      const expectation = [{ id: 1, value: false, label: 'False' }, { id: 2, value: true, label: 'True' }];
      const inputArray: any[] = [{ id: 2, value: true, label: 'True' }, { id: 1, value: false, label: 'False' }];

      collectionObserver(inputArray, (updatedArray) => {
        expect(JSON.stringify(updatedArray)).toEqual(JSON.stringify(expectation));
        done();
      });
      inputArray.reverse();
    }));

    it('should watch for array "sort" change and expect callback to be executed', () => new Promise((done: any) => {
      const expectation = [{ id: 1, value: false, label: 'False' }, { id: 2, value: true, label: 'True' }];
      const inputArray: any[] = [{ id: 2, value: true, label: 'True' }, { id: 1, value: false, label: 'False' }];

      collectionObserver(inputArray, (updatedArray) => {
        expect(JSON.stringify(updatedArray)).toEqual(JSON.stringify(expectation));
        done();
      });
      inputArray.sort((obj1, obj2) => obj1.id - obj2.id);
    }));

    it('should disconnect observer and expect callback to no longer be executed', () => {
      let callbackCount = 0;
      const collection = [1, 2];
      const observer = collectionObserver(collection, () => callbackCount++);
      collection.push(Math.random());
      collection.push(Math.random());

      expect(collection.length).toBe(4);

      observer?.disconnect();

      collection.push(Math.random());
      collection.push(Math.random());

      expect(collection.length).toBe(4);
    });

    it('should return null when input is not an array type', () => {
      const observer = collectionObserver('text' as any, () => console.log('hello'));

      expect(observer).toBeNull();
    });
  });

  describe('propertyObserver method', () => {
    it('should watch for an object property change and expect the callback to be executed with new value', () => new Promise((done: any) => {
      const expectation = { hello: { firstName: 'John' } };
      const inputObj = { hello: { firstName: '' } };

      propertyObserver(inputObj.hello, 'firstName', (newValue) => {
        expect(newValue).toEqual('John');
        expect(inputObj).toEqual(expectation);
        done();
      });
      inputObj.hello.firstName = 'John';
    }));
  });
});
