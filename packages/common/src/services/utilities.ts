import type { EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { flatten } from 'un-flatten-tree';
import { Constants } from '../constants.js';
import { FieldType, OperatorType, type OperatorString } from '../enums/index.js';
import type { Aggregator, CancellablePromiseWrapper, Column, GridOption, TreeDataPropNames } from '../interfaces/index.js';
import type { Observable, RxJsFacade, Subject, Subscription } from './rxjsFacade.js';

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
      promise: inputPromise.then((result) => {
        if (hasCancelled) {
          throw new CancelledException('Cancelled Promise');
        }
        return result;
      }),
      cancel: () => (hasCancelled = true),
    };
  }
  return inputPromise;
}

/**
 * Try casting an input of type Promise | Observable into a Promise type.
 * @param object which could be of type Promise or Observable
 * @param fromServiceName string representing the caller service name and will be used if we throw a casting problem error
 */
export function castObservableToPromise<T>(
  rxjs: RxJsFacade,
  input: Promise<T> | Observable<T> | Subject<T>,
  fromServiceName = ''
): Promise<T> {
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

export function createDocumentFragmentOrElement(
  gridOptions?: GridOption,
  defaultElmType: 'span' | 'div' = 'span'
): DocumentFragment | HTMLElement {
  return gridOptions?.preventDocumentFragmentUsage ? document.createElement(defaultElmType) : new DocumentFragment();
}

/**
 * Mutate the original array and add a treeLevel (defaults to `__treeLevel`) property on each item.
 * @param {Array<Object>} treeArray - hierarchical tree array
 * @param {Object} options - options containing info like children & treeLevel property names
 * @param {Number} [treeLevel] - current tree level
 */
export function addTreeLevelByMutation<T>(
  treeArray: T[],
  options: Required<Pick<TreeDataPropNames, 'childrenPropName' | 'levelPropName'>>,
  treeLevel = 0
): void {
  const childrenPropName = getTreeDataOptionPropName(options, 'childrenPropName') as keyof T;

  if (Array.isArray(treeArray)) {
    treeArray.forEach((item) => {
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

export function addTreeLevelAndAggregatorsByMutation<T = any>(
  treeArray: T[],
  options: { aggregator: Aggregator } & Required<Pick<TreeDataPropNames, 'childrenPropName' | 'levelPropName'>>,
  treeLevel = 0,
  parent: T = null as any
): void {
  const childrenPropName = getTreeDataOptionPropName(options, 'childrenPropName') as keyof T;
  const { aggregator } = options;

  if (Array.isArray(treeArray)) {
    treeArray.forEach((item) => {
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
 * Note: for perf reasons, it mutates the array by adding extra props like `treeLevel`
 * @param {Array<Object>} treeArray - input hierarchical (tree) array
 * @param {Object} options - you can provide "childrenPropName" and other options (defaults to "children")
 * @return {Array<Object>} output - Parent/Child array
 */
export function flattenToParentChildArray<T>(
  treeArray: T[],
  options?: { aggregators?: Aggregator[]; shouldAddTreeLevelNumber?: boolean } & Omit<TreeDataPropNames, 'collapsedPropName'>
): any[] {
  const identifierPropName = getTreeDataOptionPropName(options, 'identifierPropName') as keyof T & string;
  const childrenPropName = getTreeDataOptionPropName(options, 'childrenPropName') as keyof T & string;
  const hasChildrenPropName = getTreeDataOptionPropName(options, 'hasChildrenPropName') as keyof T & string;
  const parentPropName = getTreeDataOptionPropName(options, 'parentPropName') as keyof T & string;
  const levelPropName = getTreeDataOptionPropName(options, 'levelPropName');
  type FlatParentChildArray = Omit<T, keyof typeof childrenPropName>;

  if (options?.shouldAddTreeLevelNumber) {
    if (Array.isArray(options?.aggregators)) {
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
        ...objectWithoutKey(node, childrenPropName as keyof T), // reuse the entire object except the children array property
      } as unknown as FlatParentChildArray;
    }
  );

  return flat;
}

/** Find the associated property name from the Tree Data option when found or return a default property name that we defined internally */
export function getTreeDataOptionPropName(
  treeDataOptions: Partial<TreeDataPropNames> | undefined,
  optionName: keyof TreeDataPropNames,
  defaultDataIdPropName = 'id'
): string {
  let propName = '';
  switch (optionName) {
    case 'childrenPropName':
      propName = treeDataOptions?.[optionName] ?? Constants.treeDataProperties.CHILDREN_PROP;
      break;
    case 'collapsedPropName':
      propName = treeDataOptions?.[optionName] ?? Constants.treeDataProperties.COLLAPSED_PROP;
      break;
    case 'hasChildrenPropName':
      propName = treeDataOptions?.[optionName] ?? Constants.treeDataProperties.HAS_CHILDREN_PROP;
      break;
    case 'identifierPropName':
      propName = treeDataOptions?.[optionName] ?? defaultDataIdPropName;
      break;
    case 'lazyLoadingPropName':
      propName = treeDataOptions?.[optionName] ?? Constants.treeDataProperties.LAZY_LOADING_PROP;
      break;
    case 'levelPropName':
      propName = treeDataOptions?.[optionName] ?? Constants.treeDataProperties.TREE_LEVEL_PROP;
      break;
    case 'parentPropName':
      propName = treeDataOptions?.[optionName] ?? Constants.treeDataProperties.PARENT_PROP;
      break;
  }
  return propName;
}

/**
 * Convert a flat array (with "parentId" references) into a hierarchical (tree) dataset structure (where children are array(s) inside their parent objects)
 * Note: for perf reasons, it mutates the array by adding extra props like `treeLevel`
 * @param flatArray input array (flat dataset)
 * @param options you can provide the following tree data options (which are all prop names, except 1 boolean flag, to use or else use their defaults):: collapsedPropName, childrenPropName, parentPropName, identifierPropName and levelPropName and initiallyCollapsed (boolean)
 * @return roots - hierarchical (tree) data view array
 */
export function unflattenParentChildArrayToTree<P, T extends P & { [childrenPropName: string]: P[] }>(
  flatArray: P[],
  options?: { aggregators?: Aggregator[]; initiallyCollapsed?: boolean } & Omit<TreeDataPropNames, 'hasChildrenPropName'>
): T[] {
  const identifierPropName = getTreeDataOptionPropName(options, 'identifierPropName');
  const childrenPropName = getTreeDataOptionPropName(options, 'childrenPropName');
  const parentPropName = getTreeDataOptionPropName(options, 'parentPropName');
  const levelPropName = getTreeDataOptionPropName(options, 'levelPropName');
  const collapsedPropName = getTreeDataOptionPropName(options, 'collapsedPropName');
  const inputArray: P[] = flatArray || [];
  const roots: T[] = []; // items without parent which at the root

  // make them accessible by guid on this map
  const all: any = {};

  inputArray.forEach((item: any) => {
    all[item[identifierPropName]] = item;
    delete item[childrenPropName];
  });

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
  if (Array.isArray(options?.aggregators)) {
    options.aggregators.forEach((aggregator) => {
      addTreeLevelAndAggregatorsByMutation(roots, { childrenPropName, levelPropName, aggregator }, 0);
    });
  } else {
    addTreeLevelByMutation(roots, { childrenPropName, levelPropName }, 0);
  }

  return roots;
}

/**
 * Find an item from a tree (hierarchical) view structure (a parent that can have children array which themseleves can have children and so on)
 * @param {Array<Object>} treeArray - hierarchical tree dataset
 * @param {Function} predicate - search predicate to find the item in the hierarchical tree structure
 * @param {String} childrenPropertyName - children property name to use in the tree (defaults to "children")
 */
export function findItemInTreeStructure<T extends object = any>(
  treeArray: T[],
  predicate: (item: T) => boolean,
  childrenPropertyName: string
): T | undefined {
  if (!childrenPropertyName) {
    throw new Error('findItemInTreeStructure requires parameter "childrenPropertyName"');
  }
  const initialFind = treeArray.find(predicate);
  const elementsWithChildren = treeArray.filter((x: T) => childrenPropertyName in x && x[childrenPropertyName as keyof T]);
  if (initialFind) {
    return initialFind;
  } else if (elementsWithChildren.length) {
    const childElements: T[] = [];
    for (const item of elementsWithChildren) {
      if (childrenPropertyName in item) {
        (item as any)[childrenPropertyName].forEach((el: any) => childElements.push(el));
      }
    }
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
export function decimalFormatted(
  input: number | string,
  minDecimal?: number,
  maxDecimal?: number,
  decimalSeparator: '.' | ',' = '.',
  thousandSeparator: ',' | '_' | '.' | ' ' | '' = ''
): string {
  if (isNaN(+input)) {
    return input as string;
  }

  const minDec = minDecimal === undefined ? 2 : minDecimal;
  const maxDec = maxDecimal === undefined ? 2 : maxDecimal;
  let amount = String(Math.round(+input * Math.pow(10, maxDec)) / Math.pow(10, maxDec));

  if (amount.indexOf('.') < 0 && minDec > 0) {
    amount += '.';
  }
  while (amount.length - amount.indexOf('.') <= minDec) {
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
export function formatNumber(
  input: number | string,
  minDecimal?: number,
  maxDecimal?: number,
  wrapNegativeNumberInBraquets?: boolean,
  symbolPrefix = '',
  symbolSuffix = '',
  decimalSeparator: '.' | ',' = '.',
  thousandSeparator: ',' | '_' | '.' | ' ' | '' = ''
): string {
  if (isNaN(+input)) {
    return input as string;
  }

  const calculatedValue = Math.round(parseFloat(input as string) * 1000000) / 1000000;

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
  if (gridOptions?.translationNamespace) {
    return gridOptions.translationNamespace + (gridOptions.translationNamespaceSeparator || '');
  }
  return '';
}

/** From a column definition, find column type */
export function getColumnFieldType(columnDef: Column): (typeof FieldType)[keyof typeof FieldType] {
  return columnDef.outputType || columnDef.type || FieldType.string;
}

/** Return all Date field types that exists in the library */
export function getAllDateFieldTypes(): (typeof FieldType)[keyof typeof FieldType][] {
  return [
    FieldType.date,
    FieldType.dateTime,
    FieldType.dateIso,
    FieldType.dateTimeIso,
    FieldType.dateTimeShortIso,
    FieldType.dateTimeIsoAmPm,
    FieldType.dateTimeIsoAM_PM,
    FieldType.dateEuro,
    FieldType.dateEuroShort,
    FieldType.dateTimeEuro,
    FieldType.dateTimeShortEuro,
    FieldType.dateTimeEuroAmPm,
    FieldType.dateTimeEuroAM_PM,
    FieldType.dateTimeEuroShort,
    FieldType.dateTimeEuroShortAmPm,
    FieldType.dateTimeEuroShortAM_PM,
    FieldType.dateUs,
    FieldType.dateUsShort,
    FieldType.dateTimeUs,
    FieldType.dateTimeShortUs,
    FieldType.dateTimeUsAmPm,
    FieldType.dateTimeUsAM_PM,
    FieldType.dateTimeUsShort,
    FieldType.dateTimeUsShortAmPm,
    FieldType.dateTimeUsShortAM_PM,
    FieldType.dateUtc,
  ];
}

/** Verify if the identified column is of type Date */
export function isColumnDateType(fieldType?: (typeof FieldType)[keyof typeof FieldType]): boolean {
  if (getAllDateFieldTypes().includes(fieldType as (typeof FieldType)[keyof typeof FieldType])) {
    return true;
  }
  return false;
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
    case '<>':
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
export function mapOperatorByFieldType(fieldType: (typeof FieldType)[keyof typeof FieldType]): OperatorType {
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
 * From an input that could be a Promise, an Observable, a Subject or a Fetch
 * @param {Promise<T> | Observable<T> | Subject<T>} input
 * @param {RxJsFacade} rxjs
 * @returns {Promise}
 */
export function fetchAsPromise<T = any>(input?: T[] | Promise<T> | Observable<T> | Subject<T>, rxjs?: RxJsFacade): Promise<T | null> {
  return new Promise((resolve) => {
    if (Array.isArray(input)) {
      resolve(input as T);
    } else if (input instanceof Promise) {
      input.then((response: any | any[]) => {
        if (Array.isArray(response)) {
          resolve(response as T); // from Promise
        } else if (response?.status >= 200 && response.status < 300 && typeof response.json === 'function') {
          if (response.bodyUsed) {
            const errorMsg =
              '[SlickGrid-Universal] The response body passed to Fetch was already read. ' +
              'Either pass the dataset from the Response or clone the response first using response.clone()';
            console.warn(errorMsg);
            resolve(null);
          } else {
            resolve((response as Response).json()); // from Fetch
          }
        } else if (response?.content) {
          resolve(response['content'] as T); // from http-client
        } else {
          resolve(response); // anything we'll just return "as-is"
        }
      });
    } else if (input && rxjs?.isObservable(input)) {
      resolve(castObservableToPromise(rxjs, input)); // Observable
    } else {
      resolve(null);
    }
  });
}

/**
 * Take all the columns defined in the datagrid and also the preset columns,
 * then sort by the original column definitions unless a different order is specified in the presets which is given precedence
 * @param allColumns
 * @param presetColumns
 * @returns
 */
export function sortPresetColumns<T = any>(allColumns: Column<T>[], presetColumns: Column<T>[]): Column<T>[] {
  // Create a map of preset column IDs with their order
  const presetColumnMap = new Map(presetColumns.map((col, index) => [col.id, index]));

  // Create a copy of allColumns with sorting metadata
  return allColumns
    .map((column, originalIndex) => ({
      ...column,
      hidden: !presetColumnMap.has(column.id),
      _originalIndex: originalIndex,
      _presetIndex: presetColumnMap.get(column.id),
    }))
    .sort((a, b) => {
      // If both columns have a preset index, sort by preset order
      if (a._presetIndex !== undefined && b._presetIndex !== undefined) {
        return a._presetIndex - b._presetIndex;
      }

      // If one column is in presets and the other is not, preserve original order
      return a._originalIndex - b._originalIndex;
    })
    .map(({ _originalIndex, _presetIndex, ...column }) => column);
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
