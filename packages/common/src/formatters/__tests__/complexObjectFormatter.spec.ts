import { describe, expect, it } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { complexObjectFormatter } from '../complexObjectFormatter.js';

describe('the ComplexObject Formatter', () => {
  const allRoles = [
    { roleId: 0, name: 'Administrator' },
    { roleId: 1, name: 'Regular User', empty: {}, nullable: null },
  ];

  const dataset = [
    { id: 0, firstName: 'John', lastName: 'Smith', email: 'john.smith@movie.com', role: allRoles[0] },
    { id: 1, firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@movie.com', role: allRoles[1] },
    { id: 2, firstName: 'Bob', lastName: 'Cane', email: 'bob.cane@movie.com', role: null },
  ];

  it('should throw an error when omitting to pass "complexFieldLabel" to "params"', () => {
    expect(() => complexObjectFormatter(0, 0, 'anything', {} as Column, {}, {} as any)).toThrow('For the Formatters.complexObject to work properly');
  });

  it('should return original input value when the "field" property does not include a not ".", neither "complexFieldLabel"', () => {
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'role' } as Column, {}, {} as any);
    expect(result).toBe('anything');
  });

  it('should return empty string when the "field" property was not found in the data context object', () => {
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'invalid.object' } as Column, dataset[2], {} as any);
    expect(result).toBe('');
  });

  it('should return original input value when the "complexFieldLabel" does not include a not "." within its string', () => {
    const params = { complexFieldLabel: 'name' };
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'role', params } as Column, {}, {} as any);
    expect(result).toBe('anything');
  });

  it('should return original input value when the "complexFieldLabel" was not found in the data context object', () => {
    const params = { complexFieldLabel: 'invalid.object' };
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'role', params } as Column, dataset[2], {} as any);
    expect(result).toBe('');
  });

  it('should return the value from the complex object when "field" property with dot notation was found in the data context object', () => {
    const expectedOutput = 'Administrator';
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'role.name' } as Column, dataset[0], {} as any);
    expect(result).toBe(expectedOutput);
  });

  it('should return an empty string when the value from the complex object when "field" has dot notation and the property returned from it is an empty object', () => {
    const expectedOutput = '';
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'role.empty' } as Column, dataset[1], {} as any);
    expect(result).toBe(expectedOutput);
  });

  it('should return an empty string when the value from the complex object when "field" has dot notation and the property returned from it is a null value', () => {
    const expectedOutput = '';
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'role.nullable' } as Column, dataset[1], {} as any);
    expect(result).toBe(expectedOutput);
  });

  it('should return the value from the complex object when "complexFieldLabel" property with dot notation was found in the data context object', () => {
    const params = { complexFieldLabel: 'role.name' };
    const expectedOutput = 'Administrator';
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'role', params } as Column, dataset[0], {} as any);
    expect(result).toBe(expectedOutput);
  });

  it('should return the value from the complex object when "complexFieldLabel" is not dot notation but has a "labelKey" was found in the data context object', () => {
    const params = { complexFieldLabel: 'role' };
    const expectedOutput = 'Administrator';
    const result = complexObjectFormatter(0, 0, 'anything', { field: 'role', labelKey: 'name', params } as Column, dataset[0], {} as any);
    expect(result).toBe(expectedOutput);
  });
});
