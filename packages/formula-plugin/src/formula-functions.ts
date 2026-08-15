import { FORMULA_ERROR } from './formula-errors.js';

export type FormulaCallback = (...args: any[]) => unknown;

export function createFormulaFunctionRegistry(customFunctions: ReadonlyMap<string, FormulaCallback>): Map<string, FormulaCallback> {
  const registry = createBuiltInFormulaFunctions();

  // Custom functions can extend or override built-ins by name.
  for (const [functionName, callback] of customFunctions.entries()) {
    if (/^[A-Z_][A-Z0-9_]*$/.test(functionName) && typeof callback === 'function') {
      registry.set(functionName, callback);
    }
  }

  return registry;
}

function createBuiltInFormulaFunctions(): Map<string, FormulaCallback> {
  const registry = new Map<string, FormulaCallback>();

  const IF = (condition: unknown, yesValue: unknown, noValue: unknown) => (condition ? yesValue : noValue);
  const SUM = (...args: unknown[]) =>
    flattenFormulaFunctionArgs(args)
      .map((value) => toNumericFormulaValue(value))
      .reduce((acc, value) => acc + value, 0);
  const PRODUCT = (...args: unknown[]) =>
    flattenFormulaFunctionArgs(args)
      .map((value) => toNumericFormulaValue(value))
      .reduce((acc, value) => acc * value, 1);
  const SUMPRODUCT = (...args: unknown[]) => {
    if (!args.length) {
      return 0;
    }

    const arrays = args.map((arg) => toFormulaArray(arg).map((value) => toNumericFormulaValue(value)));
    const maxLen = Math.max(...arrays.map((arr) => arr.length));
    if (!maxLen || !Number.isFinite(maxLen)) {
      return 0;
    }

    // Broadcast scalar args across array lengths to emulate Excel SUMPRODUCT behavior.
    const normalizedArrays = arrays.map((arr) => {
      if (arr.length === maxLen) {
        return arr;
      }
      if (arr.length === 1) {
        return Array.from({ length: maxLen }, () => arr[0]);
      }
      return arr;
    });

    let sum = 0;
    for (let i = 0; i < maxLen; i++) {
      let product = 1;
      for (const arr of normalizedArrays) {
        if (i >= arr.length) {
          continue;
        }
        // Values are normalized through toNumericFormulaValue() above, so each present entry is numeric.
        product *= arr[i];
      }
      sum += product;
    }

    return sum;
  };
  const MIN = (...args: unknown[]) => {
    const values = flattenFormulaFunctionArgs(args).map((value) => toNumericFormulaValue(value));
    return values.length ? Math.min(...values) : 0;
  };
  const MAX = (...args: unknown[]) => {
    const values = flattenFormulaFunctionArgs(args).map((value) => toNumericFormulaValue(value));
    return values.length ? Math.max(...values) : 0;
  };
  const AVERAGE = (...args: unknown[]) => {
    const values = flattenFormulaFunctionArgs(args).map((value) => toNumericFormulaValue(value));
    return values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : 0;
  };
  const MEDIAN = (...args: unknown[]) => {
    const values = flattenFormulaFunctionArgs(args)
      .map((value) => toNumericFormulaValue(value))
      .sort((a, b) => a - b);
    if (!values.length) {
      return 0;
    }
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  };
  const POWER = (arg1: unknown, arg2: unknown) => Math.pow(toNumericFormulaValue(arg1), toNumericFormulaValue(arg2));
  const RAND = () => Math.random();
  const NOW = () => new Date();
  const TODAY = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  const CONCAT = (...args: unknown[]) =>
    flattenFormulaFunctionArgs(args)
      .map((arg) => String(arg ?? ''))
      .join('');
  const COUNT = (...args: unknown[]) => flattenFormulaFunctionArgs(args).filter((value) => isNumericFormulaValue(value)).length;
  const COUNTA = (...args: unknown[]) =>
    flattenFormulaFunctionArgs(args).filter((value) => value !== null && value !== undefined && value !== '').length;
  const COUNTBLANK = (...args: unknown[]) =>
    flattenFormulaFunctionArgs(args).filter((value) => value === null || value === undefined || value === '').length;
  const COUNTIF = (range: unknown, criteria: unknown) => {
    const values = toFormulaArray(range);
    return values.filter((value) => matchesFormulaCriteria(value, criteria)).length;
  };
  const SUMIF = (range: unknown, criteria: unknown, sumRange?: unknown) => {
    const criteriaValues = toFormulaArray(range);
    const sumValues = sumRange === undefined ? criteriaValues : toFormulaArray(sumRange);
    const length = Math.min(criteriaValues.length, sumValues.length);
    let sum = 0;
    for (let i = 0; i < length; i++) {
      if (matchesFormulaCriteria(criteriaValues[i], criteria)) {
        sum += toNumericFormulaValue(sumValues[i]);
      }
    }
    return sum;
  };
  const NA = () => FORMULA_ERROR.NA;

  registry.set('IF', IF);
  registry.set('SUM', SUM);
  registry.set('SUMPRODUCT', SUMPRODUCT);
  registry.set('SUMIF', SUMIF);
  registry.set('PRODUCT', PRODUCT);
  registry.set('MIN', MIN);
  registry.set('MAX', MAX);
  registry.set('AVERAGE', AVERAGE);
  registry.set('MEDIAN', MEDIAN);
  registry.set('POWER', POWER);
  registry.set('RAND', RAND);
  registry.set('NOW', NOW);
  registry.set('TODAY', TODAY);
  registry.set('CONCAT', CONCAT);
  registry.set('COUNT', COUNT);
  registry.set('COUNTA', COUNTA);
  registry.set('COUNTBLANK', COUNTBLANK);
  registry.set('COUNTIF', COUNTIF);
  registry.set('NA', NA);

  return registry;
}

function flattenFormulaFunctionArgs(args: unknown[]): unknown[] {
  const flat: unknown[] = [];
  for (const arg of args) {
    if (Array.isArray(arg)) {
      flat.push(...flattenFormulaFunctionArgs(arg));
    } else {
      flat.push(arg);
    }
  }
  return flat;
}

function toNumericFormulaValue(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
}

function isNumericFormulaValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    const numeric = Number(trimmed);
    return Number.isFinite(numeric);
  }
  return false;
}

function toFormulaArray(value: unknown): unknown[] {
  return Array.isArray(value) ? flattenFormulaFunctionArgs(value) : [value];
}

function matchesFormulaCriteria(value: unknown, criteria: unknown): boolean {
  if (typeof criteria === 'number' || typeof criteria === 'boolean') {
    return value === criteria;
  }

  const criteriaText = String(criteria ?? '').trim();
  const operatorMatch = criteriaText.match(/^(<=|>=|<>|=|<|>)(.*)$/);
  const operator = operatorMatch?.[1] ?? '=';
  const operandText = (operatorMatch?.[2] ?? criteriaText).trim();

  const leftNumber = isNumericFormulaValue(value) ? Number(String(value).trim()) : undefined;
  const rightNumber = isNumericFormulaValue(operandText) ? Number(operandText) : undefined;

  const left = leftNumber ?? String(value ?? '');
  const right = rightNumber ?? operandText;

  switch (operator) {
    case '=':
      return left === right;
    case '<>':
      return left !== right;
    case '<':
      return (left as any) < (right as any);
    case '>':
      return (left as any) > (right as any);
    case '<=':
      return (left as any) <= (right as any);
    case '>=':
      return (left as any) >= (right as any);
    default:
      return false;
  }
}
