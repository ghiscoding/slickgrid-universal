import type { EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { flatten } from 'un-flatten-tree';
import moment, { type Moment } from 'moment-tiny';

import { Constants } from '../constants';
import { FieldType, type OperatorString, OperatorType } from '../enums/index';
import type { Aggregator, CancellablePromiseWrapper, Column, GridOption, } from '../interfaces/index';
import type { Observable, RxJsFacade, Subject, Subscription } from './rxjsFacade';

/** Cancelled Extension that can be only be thrown by the `cancellablePromise()` function */
export class CancelledException extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CancelledException.prototype);
  }
}

/**
 * From an input Promise, make it cancellable by wrapping it inside an object that holds the promise and a `cancel()` method
 * @param {Promise<any>} - input Promise
 * @returns {Object} - Promise wrapper that holds the promise and a `cancel()` method
 */
export function cancellablePromise<T = any>(inputPromise: Promise<T>): CancellablePromiseWrapper<T> {
  let hasCancelled = false;

  if (inputPromise instanceof Promise) {
    return {
      promise: inputPromise.then(result => {
        if (hasCancelled) {
          throw new CancelledException('Cancelled Promise');
        }
        return result;
      }),
      cancel: () => hasCancelled = true
    };
  }
  return inputPromise;
}

/**
 * Try casting an input of type Promise | Observable into a Promise type.
 * @param object which could be of type Promise or Observable
 * @param fromServiceName string representing the caller service name and will be used if we throw a casting problem error
 */
export function castObservableToPromise<T>(rxjs: RxJsFacade, input: Promise<T> | Observable<T> | Subject<T>, fromServiceName = ''): Promise<T> {
  let promise: any = input;

  if (input instanceof Promise) {
    // if it's already a Promise then return it
    return input;
  } else if (rxjs.isObservable(input)) {
    promise = rxjs.firstValueFrom(input);
  }

  if (!(promise instanceof Promise)) {
    throw new Error(`Something went wrong, Slickgrid-Universal ${fromServiceName} is not able to convert the Observable into a Promise.`);
  }

  return promise;
}

/**
 * Mutate the original array and add a treeLevel (defaults to `__treeLevel`) property on each item.
 * @param {Array<Object>} treeArray - hierarchical tree array
 * @param {Object} options - options containing info like children & treeLevel property names
 * @param {Number} [treeLevel] - current tree level
 */
export function addTreeLevelByMutation<T>(treeArray: T[], options: { childrenPropName: string; levelPropName: string; }, treeLevel = 0) {
  const childrenPropName = (options?.childrenPropName ?? Constants.treeDataProperties.CHILDREN_PROP) as keyof T;

  if (Array.isArray(treeArray)) {
    treeArray.forEach(item => {
      if (item) {
        if (Array.isArray(item[childrenPropName]) && (item[childrenPropName] as Array<T>).length > 0) {
          treeLevel++;
          addTreeLevelByMutation(item[childrenPropName] as Array<T>, options, treeLevel);
          treeLevel--;
        }
        (item as any)[options.levelPropName] = treeLevel;
      }
    });
  }
}

export function addTreeLevelAndAggregatorsByMutation<T = any>(treeArray: T[], options: { aggregator: Aggregator; childrenPropName: string; levelPropName: string; }, treeLevel = 0, parent: T = null as any) {
  const childrenPropName = (options?.childrenPropName ?? Constants.treeDataProperties.CHILDREN_PROP) as keyof T;
  const { aggregator } = options;

  if (Array.isArray(treeArray)) {
    treeArray.forEach(item => {
      if (item) {
        const isParent = Array.isArray(item[childrenPropName]);

        if (Array.isArray(item[childrenPropName]) && (item[childrenPropName] as Array<T>).length > 0) {
          aggregator.init(item, true);
          treeLevel++;
          addTreeLevelAndAggregatorsByMutation(item[childrenPropName] as Array<T>, options, treeLevel, item);
          treeLevel--;
        }

        if (parent && aggregator.isInitialized && typeof aggregator.accumulate === 'function' && !(item as any)?.__filteredOut) {
          aggregator.accumulate(item, isParent);
          aggregator.storeResult((parent as any).__treeTotals);
        }
        (item as any)[options.levelPropName] = treeLevel;
      }
    });
  }
}

/**
 * Convert a hierarchical (tree) array (with children) into a flat array structure array (where the children are pushed as next indexed item in the array)
 * @param {Array<Object>} treeArray - input hierarchical (tree) array
 * @param {Object} options - you can provide "childrenPropName" (defaults to "children")
 * @return {Array<Object>} output - Parent/Child array
 */
export function flattenToParentChildArray<T>(treeArray: T[], options?: { aggregators?: Aggregator[]; parentPropName?: string; childrenPropName?: string; hasChildrenPropName?: string; identifierPropName?: string; shouldAddTreeLevelNumber?: boolean; levelPropName?: string; }) {
  const identifierPropName = (options?.identifierPropName ?? 'id') as keyof T & string;
  const childrenPropName = (options?.childrenPropName ?? Constants.treeDataProperties.CHILDREN_PROP) as keyof T & string;
  const hasChildrenPropName = (options?.hasChildrenPropName ?? Constants.treeDataProperties.HAS_CHILDREN_PROP) as keyof T & string;
  const parentPropName = (options?.parentPropName ?? Constants.treeDataProperties.PARENT_PROP) as keyof T & string;
  const levelPropName = options?.levelPropName ?? Constants.treeDataProperties.TREE_LEVEL_PROP;
  type FlatParentChildArray = Omit<T, keyof typeof childrenPropName>;

  if (options?.shouldAddTreeLevelNumber) {
    if (options?.aggregators) {
      options.aggregators.forEach((aggregator) => {
        addTreeLevelAndAggregatorsByMutation(treeArray, { childrenPropName, levelPropName, aggregator });
      });
    } else {
      addTreeLevelByMutation(treeArray, { childrenPropName, levelPropName });
    }
  }

  const flat = flatten(
    treeArray,
    (node: any) => node[childrenPropName],
    (node: T, parentNode?: T) => {
      return {
        [identifierPropName]: node[identifierPropName],
        [parentPropName]: parentNode !== undefined ? parentNode![identifierPropName] : null,
        [hasChildrenPropName]: !!node[childrenPropName],
        ...objectWithoutKey(node, childrenPropName as keyof T) // reuse the entire object except the children array property
      } as unknown as FlatParentChildArray;
    }
  );

  return flat;
}

/**
 * Convert a flat array (with "parentId" references) into a hierarchical (tree) dataset structure (where children are array(s) inside their parent objects)
 * @param flatArray input array (flat dataset)
 * @param options you can provide the following tree data options (which are all prop names, except 1 boolean flag, to use or else use their defaults):: collapsedPropName, childrenPropName, parentPropName, identifierPropName and levelPropName and initiallyCollapsed (boolean)
 * @return roots - hierarchical (tree) data view array
 */
export function unflattenParentChildArrayToTree<P, T extends P & { [childrenPropName: string]: P[]; }>(flatArray: P[], options?: { aggregators?: Aggregator[]; childrenPropName?: string; collapsedPropName?: string; identifierPropName?: string; levelPropName?: string; parentPropName?: string; initiallyCollapsed?: boolean; }): T[] {
  const identifierPropName = options?.identifierPropName ?? 'id';
  const childrenPropName = options?.childrenPropName ?? Constants.treeDataProperties.CHILDREN_PROP;
  const parentPropName = options?.parentPropName ?? Constants.treeDataProperties.PARENT_PROP;
  const levelPropName = options?.levelPropName ?? Constants.treeDataProperties.TREE_LEVEL_PROP;
  const collapsedPropName = options?.collapsedPropName ?? Constants.treeDataProperties.COLLAPSED_PROP;
  const inputArray: P[] = flatArray || [];
  const roots: T[] = []; // items without parent which at the root

  // make them accessible by guid on this map
  const all: any = {};

  inputArray.forEach((item: any) => all[item[identifierPropName]] = item);

  // connect childrens to its parent, and split roots apart
  Object.keys(all).forEach((id) => {
    const item = all[id];
    if (!(parentPropName in item) || item[parentPropName] === null || item[parentPropName] === undefined || item[parentPropName] === '') {
      roots.push(item);
    } else if (item[parentPropName] in all) {
      const p = all[item[parentPropName]];
      if (!(childrenPropName in p)) {
        p[childrenPropName] = [];
      }
      p[childrenPropName].push(item);
      if (p[collapsedPropName] === undefined) {
        p[collapsedPropName] = options?.initiallyCollapsed ?? false;
      }
    }
  });

  // we need and want the Tree Level,
  // we can do that after the tree is created and mutate the array by adding a __treeLevel property on each item
  // perhaps there might be a way to add this while creating the tree for now that is the easiest way I found
  if (options?.aggregators) {
    options.aggregators.forEach((aggregator) => {
      addTreeLevelAndAggregatorsByMutation(roots, { childrenPropName, levelPropName, aggregator }, 0);
    });
  } else {
    addTreeLevelByMutation(roots, { childrenPropName, levelPropName }, 0);
  }

  return roots;
}

/**
 * Find an item from a tree (hierarchical) view structure (a parent that can have children array which themseleves can children and so on)
 * @param {Array<Object>} treeArray - hierarchical tree dataset
 * @param {Function} predicate - search predicate to find the item in the hierarchical tree structure
 * @param {String} childrenPropertyName - children property name to use in the tree (defaults to "children")
 */
export function findItemInTreeStructure<T = any>(treeArray: T[], predicate: (item: T) => boolean, childrenPropertyName: string): T | undefined {
  if (!childrenPropertyName) {
    throw new Error('findRecursive requires parameter "childrenPropertyName"');
  }
  const initialFind = treeArray.find(predicate);
  const elementsWithChildren = treeArray.filter((x: T) => x?.hasOwnProperty(childrenPropertyName) && x[childrenPropertyName as keyof T]);
  if (initialFind) {
    return initialFind;
  } else if (elementsWithChildren.length) {
    const childElements: T[] = [];
    elementsWithChildren.forEach((item: T) => {
      if (item?.hasOwnProperty(childrenPropertyName)) {
        childElements.push(...(item as any)[childrenPropertyName]);
      }
    });
    return findItemInTreeStructure<T>(childElements, predicate, childrenPropertyName);
  }
  return undefined;
}

/**
 * Take a number (or a string) and display it as a formatted decimal string with defined minimum and maximum decimals
 * @param input
 * @param minDecimal
 * @param maxDecimal
 * @param decimalSeparator
 * @param thousandSeparator
 */
export function decimalFormatted(input: number | string, minDecimal?: number, maxDecimal?: number, decimalSeparator: '.' | ',' = '.', thousandSeparator: ',' | '_' | '.' | ' ' | '' = ''): string {
  if (isNaN(+input)) {
    return input as string;
  }

  const minDec = (minDecimal === undefined) ? 2 : minDecimal;
  const maxDec = (maxDecimal === undefined) ? 2 : maxDecimal;
  let amount = String(Math.round(+input * Math.pow(10, maxDec)) / Math.pow(10, maxDec));

  if ((amount.indexOf('.') < 0) && (minDec > 0)) {
    amount += '.';
  }
  while ((amount.length - amount.indexOf('.')) <= minDec) {
    amount += '0';
  }

  const decimalSplit = amount.split('.');
  let integerNumber;
  let decimalNumber;

  // do we want to display our number with a custom separator in each thousand position
  if (thousandSeparator) {
    integerNumber = decimalSplit.length >= 1 ? thousandSeparatorFormatted(decimalSplit[0], thousandSeparator) : undefined;
  } else {
    integerNumber = decimalSplit.length >= 1 ? decimalSplit[0] : amount;
  }

  // when using a separator that is not a dot, replace it with the new separator
  if (decimalSplit.length > 1) {
    decimalNumber = decimalSplit[1];
  }

  let output = '';
  if (integerNumber !== undefined && decimalNumber !== undefined) {
    output = `${integerNumber}${decimalSeparator}${decimalNumber}`;
  } else if (integerNumber !== undefined && integerNumber !== null) {
    output = integerNumber;
  }
  return output;
}

/**
 * Format a number following options passed as arguments (decimals, separator, ...)
 * @param input
 * @param minDecimal
 * @param maxDecimal
 * @param wrapNegativeNumberInBraquets
 * @param symbolPrefix
 * @param symbolSuffix
 * @param decimalSeparator
 * @param thousandSeparator
 */
export function formatNumber(input: number | string, minDecimal?: number, maxDecimal?: number, wrapNegativeNumberInBraquets?: boolean, symbolPrefix = '', symbolSuffix = '', decimalSeparator: '.' | ',' = '.', thousandSeparator: ',' | '_' | '.' | ' ' | '' = ''): string {
  if (isNaN(+input)) {
    return input as string;
  }

  const calculatedValue = ((Math.round(parseFloat(input as string) * 1000000) / 1000000));

  if (calculatedValue < 0) {
    const absValue = Math.abs(calculatedValue);
    if (wrapNegativeNumberInBraquets) {
      if (!isNaN(minDecimal as number) || !isNaN(maxDecimal as number)) {
        return `(${symbolPrefix}${decimalFormatted(absValue, minDecimal, maxDecimal, decimalSeparator, thousandSeparator)}${symbolSuffix})`;
      }
      const formattedValue = thousandSeparatorFormatted(`${absValue}`, thousandSeparator);
      return `(${symbolPrefix}${formattedValue}${symbolSuffix})`;
    } else {
      if (!isNaN(minDecimal as number) || !isNaN(maxDecimal as number)) {
        return `-${symbolPrefix}${decimalFormatted(absValue, minDecimal, maxDecimal, decimalSeparator, thousandSeparator)}${symbolSuffix}`;
      }
      const formattedValue = thousandSeparatorFormatted(`${absValue}`, thousandSeparator);
      return `-${symbolPrefix}${formattedValue}${symbolSuffix}`;
    }
  } else {
    if (!isNaN(minDecimal as number) || !isNaN(maxDecimal as number)) {
      return `${symbolPrefix}${decimalFormatted(input, minDecimal, maxDecimal, decimalSeparator, thousandSeparator)}${symbolSuffix}`;
    }
    const formattedValue = thousandSeparatorFormatted(`${input}`, thousandSeparator);
    return `${symbolPrefix}${formattedValue}${symbolSuffix}`;
  }
}

/**
 * When a queryFieldNameGetterFn is defined, then get the value from that getter callback function
 * @param {Column} columnDef
 * @param {Object} dataContext
 * @param {String} defaultValue - optional value to use if value isn't found in data context
 * @return outputValue
 */
export function getCellValueFromQueryFieldGetter(columnDef: Column, dataContext: any, defaultValue: any): string {
  if (typeof columnDef.queryFieldNameGetterFn === 'function') {
    const queryFieldName = columnDef.queryFieldNameGetterFn(dataContext);

    // get the cell value from the item or when it's a dot notation then exploded the item and get the final value
    if (queryFieldName?.indexOf('.') >= 0) {
      defaultValue = getDescendantProperty(dataContext, queryFieldName);
    } else {
      defaultValue = dataContext.hasOwnProperty(queryFieldName) ? dataContext[queryFieldName] : defaultValue;
    }
  }

  return defaultValue;
}

/**
 * From a dot (.) notation path, find and return a property within an object given a path
 * @param object - object input
 * @param path - path of the complex object, string with dot (.) notation
 * @returns outputValue - the object property value found if any
 */
export function getDescendantProperty<T = any>(object: T, path: string | undefined): any {
  if (!object || !path) {
    return object;
  }
  return path.split('.').reduce((obj, prop) => obj && (obj as any)[prop], object);
}

/** Get I18N Translation Prefix, defaults to an empty string */
export function getTranslationPrefix(gridOptions?: GridOption): string {
  if (gridOptions && gridOptions.translationNamespace) {
    return gridOptions.translationNamespace + (gridOptions.translationNamespaceSeparator || '');
  }
  return '';
}

/** From a column definition, find column type */
export function getColumnFieldType(columnDef: Column): typeof FieldType[keyof typeof FieldType] {
  return columnDef.outputType || columnDef.type || FieldType.string;
}

/** Verify if the identified column is of type Date */
export function isColumnDateType(fieldType: typeof FieldType[keyof typeof FieldType]) {
  switch (fieldType) {
    case FieldType.date:
    case FieldType.dateTime:
    case FieldType.dateIso:
    case FieldType.dateTimeIso:
    case FieldType.dateTimeShortIso:
    case FieldType.dateTimeIsoAmPm:
    case FieldType.dateTimeIsoAM_PM:
    case FieldType.dateEuro:
    case FieldType.dateEuroShort:
    case FieldType.dateTimeEuro:
    case FieldType.dateTimeShortEuro:
    case FieldType.dateTimeEuroAmPm:
    case FieldType.dateTimeEuroAM_PM:
    case FieldType.dateTimeEuroShort:
    case FieldType.dateTimeEuroShortAmPm:
    case FieldType.dateTimeEuroShortAM_PM:
    case FieldType.dateUs:
    case FieldType.dateUsShort:
    case FieldType.dateTimeUs:
    case FieldType.dateTimeShortUs:
    case FieldType.dateTimeUsAmPm:
    case FieldType.dateTimeUsAM_PM:
    case FieldType.dateTimeUsShort:
    case FieldType.dateTimeUsShortAmPm:
    case FieldType.dateTimeUsShortAM_PM:
    case FieldType.dateUtc:
      return true;
    default:
      return false;
  }
}

export function formatDateByFieldType(inputDate: Date | string | Moment, inputFieldType: typeof FieldType[keyof typeof FieldType] | undefined, outputFieldType: typeof FieldType[keyof typeof FieldType]): string {
  const inputFormat = inputFieldType ? mapMomentDateFormatWithFieldType(inputFieldType) : undefined;
  const outputFormat = mapMomentDateFormatWithFieldType(outputFieldType);
  const momentDate = (inputDate instanceof moment ? inputDate : moment(inputDate, inputFormat)) as Moment;

  if (momentDate.isValid() && inputDate !== undefined) {
    if (outputFieldType === FieldType.dateUtc) {
      return momentDate.toISOString();
    }
    return momentDate.format(outputFormat);
  }
  return '';
}

/**
 * From a Date FieldType, return it's equivalent moment.js format
 * refer to moment.js for the format standard used: https://momentjs.com/docs/#/parsing/string-format/
 * @param fieldType
 */
export function mapMomentDateFormatWithFieldType(fieldType: typeof FieldType[keyof typeof FieldType]): string {
  let map: string;
  switch (fieldType) {
    case FieldType.dateTime:
    case FieldType.dateTimeIso:
      map = 'YYYY-MM-DD HH:mm:ss';
      break;
    case FieldType.dateTimeIsoAmPm:
      map = 'YYYY-MM-DD hh:mm:ss a';
      break;
    case FieldType.dateTimeIsoAM_PM:
      map = 'YYYY-MM-DD hh:mm:ss A';
      break;
    case FieldType.dateTimeShortIso:
      map = 'YYYY-MM-DD HH:mm';
      break;
    // all Euro Formats (date/month/year)
    case FieldType.dateEuro:
      map = 'DD/MM/YYYY';
      break;
    case FieldType.dateEuroShort:
      map = 'D/M/YY';
      break;
    case FieldType.dateTimeEuro:
      map = 'DD/MM/YYYY HH:mm:ss';
      break;
    case FieldType.dateTimeShortEuro:
      map = 'DD/MM/YYYY HH:mm';
      break;
    case FieldType.dateTimeEuroAmPm:
      map = 'DD/MM/YYYY hh:mm:ss a';
      break;
    case FieldType.dateTimeEuroAM_PM:
      map = 'DD/MM/YYYY hh:mm:ss A';
      break;
    case FieldType.dateTimeEuroShort:
      map = 'D/M/YY H:m:s';
      break;
    case FieldType.dateTimeEuroShortAmPm:
      map = 'D/M/YY h:m:s a';
      break;
    case FieldType.dateTimeEuroShortAM_PM:
      map = 'D/M/YY h:m:s A';
      break;
    // all US Formats (month/date/year)
    case FieldType.dateUs:
      map = 'MM/DD/YYYY';
      break;
    case FieldType.dateUsShort:
      map = 'M/D/YY';
      break;
    case FieldType.dateTimeUs:
      map = 'MM/DD/YYYY HH:mm:ss';
      break;
    case FieldType.dateTimeUsAmPm:
      map = 'MM/DD/YYYY hh:mm:ss a';
      break;
    case FieldType.dateTimeUsAM_PM:
      map = 'MM/DD/YYYY hh:mm:ss A';
      break;
    case FieldType.dateTimeUsShort:
      map = 'M/D/YY H:m:s';
      break;
    case FieldType.dateTimeUsShortAmPm:
      map = 'M/D/YY h:m:s a';
      break;
    case FieldType.dateTimeUsShortAM_PM:
      map = 'M/D/YY h:m:s A';
      break;
    case FieldType.dateTimeShortUs:
      map = 'MM/DD/YYYY HH:mm';
      break;
    case FieldType.dateUtc:
      map = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
      break;
    case FieldType.date:
    case FieldType.dateIso:
    default:
      map = 'YYYY-MM-DD';
      break;
  }
  return map;
}

/**
 * Mapper for query operators (ex.: <= is "le", > is "gt")
 * @param string operator
 * @returns string map
 */
export function mapOperatorType(operator: OperatorType | OperatorString): OperatorType {
  let map: OperatorType;

  switch (operator) {
    case '<':
    case 'LT':
      map = OperatorType.lessThan;
      break;
    case '<=':
    case 'LE':
      map = OperatorType.lessThanOrEqual;
      break;
    case '>':
    case 'GT':
      map = OperatorType.greaterThan;
      break;
    case '>=':
    case 'GE':
      map = OperatorType.greaterThanOrEqual;
      break;
    case '<>':
    case '!=':
    case 'NE':
      map = OperatorType.notEqual;
      break;
    case '*':
    case 'a*':
    case 'StartsWith':
      map = OperatorType.startsWith;
      break;
    case '*z':
    case 'EndsWith':
      map = OperatorType.endsWith;
      break;
    case '=':
    case '==':
    case 'EQ':
      map = OperatorType.equal;
      break;
    case 'IN':
      map = OperatorType.in;
      break;
    case 'NIN':
    case 'NOT_IN':
      map = OperatorType.notIn;
      break;
    case 'Not_Contains':
    case 'NOT_CONTAINS':
      map = OperatorType.notContains;
      break;
    case 'Contains':
    case 'CONTAINS':
    default:
      map = OperatorType.contains;
      break;
  }

  return map;
}

/**
 * Find equivalent short designation of an Operator Type or Operator String.
 * When using a Compound Filter, we use the short designation and so we need the mapped value.
 * For example OperatorType.startsWith short designation is "a*", while OperatorType.greaterThanOrEqual is ">="
 */
export function mapOperatorToShorthandDesignation(operator: OperatorType | OperatorString): OperatorString {
  let shortOperator: OperatorString = '';

  switch (operator) {
    case OperatorType.greaterThan:
    case '>':
      shortOperator = '>';
      break;
    case OperatorType.greaterThanOrEqual:
    case '>=':
      shortOperator = '>=';
      break;
    case OperatorType.lessThan:
    case '<':
      shortOperator = '<';
      break;
    case OperatorType.lessThanOrEqual:
    case '<=':
      shortOperator = '<=';
      break;
    case OperatorType.notEqual:
    case '<>':
      shortOperator = '<>';
      break;
    case OperatorType.equal:
    case '=':
    case '==':
    case 'EQ':
      shortOperator = '=';
      break;
    case OperatorType.startsWith:
    case 'a*':
    case '*':
      shortOperator = 'a*';
      break;
    case OperatorType.endsWith:
    case '*z':
      shortOperator = '*z';
      break;
    default:
      // any other operator will be considered as already a short expression, so we can return same input operator
      shortOperator = operator;
      break;
  }

  return shortOperator;
}

/**
 * Mapper for query operator by a Filter Type
 * For example a multiple-select typically uses 'IN' operator
 * @param operator
 * @returns string map
 */
export function mapOperatorByFieldType(fieldType: typeof FieldType[keyof typeof FieldType]): OperatorType {
  let map: OperatorType;

  if (isColumnDateType(fieldType)) {
    map = OperatorType.equal;
  } else {
    switch (fieldType) {
      case FieldType.unknown:
      case FieldType.string:
      case FieldType.text:
      case FieldType.password:
      case FieldType.readonly:
        map = OperatorType.contains;
        break;
      case FieldType.float:
      case FieldType.number:
      default:
        map = OperatorType.equal;
        break;
    }
  }

  return map;
}

/**
 * Takes an object and allow to provide a property key to omit from the original object
 * @param {Object} obj - input object
 * @param {String} omitKey - object property key to omit
 * @returns {String} original object without the property that user wants to omit
 */
export function objectWithoutKey<T = any>(obj: T, omitKey: keyof T): T {
  return Object.keys(obj as any).reduce((result, objKey) => {
    if (objKey !== omitKey) {
      (result as T)[objKey as keyof T] = obj[objKey as keyof T];
    }
    return result;
  }, {}) as unknown as T;
}

/**
 * Parse a date passed as a string (Date only, without time) and return a Date object (if valid)
 * @param inputDateString
 * @returns string date formatted
 */
export function parseUtcDate(inputDateString: any, useUtc?: boolean): string {
  let date = '';

  if (typeof inputDateString === 'string' && /^[0-9\-/]*$/.test(inputDateString)) {
    // get the UTC datetime with moment.js but we need to decode the value so that it's valid text
    const dateString = decodeURIComponent(inputDateString);
    const dateMoment = moment(new Date(dateString));
    if (dateMoment.isValid() && dateMoment.year().toString().length === 4) {
      date = (useUtc) ? dateMoment.utc().format() : dateMoment.format();
    }
  }

  return date;
}

/**
 * Format a number or a string into a string that is separated every thousand,
 * the default separator is a comma but user can optionally pass a different one
 * @param inputValue
 * @param separator default to comma ","
 * @returns string
 */
export function thousandSeparatorFormatted(inputValue: string | number | null, separator: ',' | '_' | '.' | ' ' | '' = ','): string | null {
  if (inputValue !== null && inputValue !== undefined) {
    const stringValue = `${inputValue}`;
    const decimalSplit = stringValue.split('.');
    if (decimalSplit.length === 2) {
      return `${decimalSplit[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)}.${decimalSplit[1]}`;
    }
    return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }
  return inputValue as null;
}

/**
 * Uses the logic function to find an item in an array or returns the default
 * value provided (empty object by default)
 * @param any[] array the array to filter
 * @param function logic the logic to find the item
 * @param any [defaultVal={}] the default value to return
 * @return object the found object or default value
 */
export function findOrDefault<T = any>(array: T[], logic: (item: T) => boolean, defaultVal = {}): any {
  if (Array.isArray(array)) {
    return array.find(logic) || defaultVal;
  }
  return array;
}

/**
 * Unsubscribe all Subscriptions
 * It will return an empty array if it all went well
 * @param subscriptions
 */
export function unsubscribeAll(subscriptions: Array<EventSubscription | Subscription>): Array<EventSubscription | Subscription> {
  if (Array.isArray(subscriptions)) {
    while (subscriptions.length > 0) {
      const subscription = subscriptions.pop();
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    }
  }

  return subscriptions;
}