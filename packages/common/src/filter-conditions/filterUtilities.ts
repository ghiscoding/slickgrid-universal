import type { OperatorString } from '../enums/index.js';

/**
 * Compare 2 objects,
 * we will loop through all properties of the object to compare the entire content of both objects
 * Optionally we can compare by a property key, when that is provided we will compare the object content
 * @param o1
 * @param o2
 * @param compareKey optional
 * @return boolean are objects equals?
 */
export function compareObjects(o1: any, o2: any, compareKey?: string): boolean {
  // if user provided an object compare key then compare directly both objects by that key
  if (compareKey && (o1?.hasOwnProperty(compareKey) || o2?.hasOwnProperty(compareKey))) {
    return o1[compareKey] === o2 || o1 === o2[compareKey] || o1[compareKey] === o2[compareKey];
  }

  if (typeof o1 === 'object' && typeof o2 === 'object' && Object.keys(o1).length !== Object.keys(o2).length) {
    return false;
  }
  // loop through all object properties to compare the full content of the object
  // we'll return false as soon as a difference is detected
  for (const p in o1) {
    if (o1.hasOwnProperty(p)) {
      if (o1[p] !== o2[p]) {
        return false;
      }
    }
  }
  return true;
}

/** Simple check to see if the given Operator is meant to be used with a collection check */
export function isCollectionOperator(operator: OperatorString): boolean {
  const inputOperator = operator?.toUpperCase() || '';
  switch (inputOperator) {
    case 'IN':
    case 'NIN':
    case 'NOT_IN':
    case 'IN_CONTAINS':
    case 'NIN_CONTAINS':
    case 'NOT_IN_CONTAINS':
    case 'IN_COLLECTION':
    case 'NOT_IN_COLLECTION':
      return true;
    default:
      return false;
  }
}

/** Execute the test on the filter condition given an operator and both values, returns a boolean */
export const testFilterCondition = (operator: OperatorString, value1: any, value2: any): boolean => {
  switch (operator.toUpperCase()) {
    case '<':
    case 'LT':
      return value1 < value2;
    case '<=':
    case 'LE':
      return value1 <= value2;
    case '>':
    case 'GT':
      return value1 > value2;
    case '>=':
    case 'GE':
      return value1 >= value2;
    case '!=':
    case '<>':
    case 'NE':
      return value1 !== value2;
    case '=':
    case '==':
    case 'EQ':
      return value1 === value2;
    case 'IN':
      return value2 && Array.isArray(value2 as string[]) ? value2.includes(value1) : false;
    case 'NIN':
    case 'NOT_IN':
      return value2 && Array.isArray(value2 as string[]) ? !value2.includes(value1) : false;
    case 'IN_CONTAINS':
      if (value2 && Array.isArray(value2) && typeof value1 === 'string') {
        return value2.some((item) =>
          value1
            .split(/[,]+/)
            .map((val) => val.trim())
            .includes(item)
        );
      }
      return false;
    case 'NIN_CONTAINS':
    case 'NOT_IN_CONTAINS':
      if (value2 && Array.isArray(value2) && typeof value1 === 'string') {
        return !value2.some((item) =>
          value1
            .split(/[,]+/)
            .map((val) => val.trim())
            .includes(item)
        );
      }
      return false;
    case 'IN_COLLECTION':
      if (value1 && value2 && Array.isArray(value1) && Array.isArray(value2)) {
        return value2.some((item) => value1.includes(item));
      }
      return false;
    case 'NOT_IN_COLLECTION':
      if (value1 && value2 && Array.isArray(value1) && Array.isArray(value2)) {
        return !value2.some((item) => value1.includes(item));
      }
      return false;
  }
  return true;
};
