import { describe, expect, it } from 'vitest';
import { getParsedSearchTermsByFieldType } from '../filterConditionProcesses.js';

describe('getParsedSearchTermsByFieldType method', () => {
  it('should get parsed result as the first array item boolean when a boolean field type is provided', () => {
    const input1 = ['1'];
    const input2 = [true];
    const result1 = getParsedSearchTermsByFieldType(input1, 'boolean');
    const result2 = getParsedSearchTermsByFieldType(input2, 'boolean');

    expect(result1).toEqual(true);
    expect(result2).toEqual(true);
  });

  it('should get parsed result as a number array when providing an array of searchTerms that are string of numbers', () => {
    const input1 = ['0'];
    const input2 = ['0', 12];
    const result1 = getParsedSearchTermsByFieldType(input1, 'number');
    const result2 = getParsedSearchTermsByFieldType(input2, 'number');

    expect(result1).toEqual([0]);
    expect(result2).toEqual([0, 12]);
  });

  it('should get parsed result as the first array item when an object field type is provided', () => {
    const input = 'world';
    const result = getParsedSearchTermsByFieldType([input], 'object');

    expect(result).toBe(input);
  });

  it('should get parsed result as the first array item text when a string field type is provided', () => {
    const input = 'world';
    const result = getParsedSearchTermsByFieldType([input], 'string');

    expect(result).toEqual([input]);
  });
});
