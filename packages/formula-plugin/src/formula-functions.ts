import { FORMULA_ERROR } from './formula-errors.js';

export type FormulaCallback = (...args: any[]) => unknown;

const referenceTag: unique symbol = Symbol('formula reference');
export interface FormulaReferenceValue {
  readonly [referenceTag]: true;
  readonly value: unknown;
}

export function formulaReference(value: unknown): FormulaReferenceValue {
  return { [referenceTag]: true, value };
}

export function isFormulaReference(value: unknown): value is FormulaReferenceValue {
  return typeof value === 'object' && value !== null && referenceTag in value;
}

export function unwrapFormulaReference(value: unknown): unknown {
  return isFormulaReference(value) ? value.value : value;
}

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
  const SUM = (...args: unknown[]) => {
    const values = aggregateNumbers(args);
    return Array.isArray(values) ? values.reduce((acc, value) => acc + value, 0) : values;
  };
  const PRODUCT = (...args: unknown[]) => {
    const values = aggregateNumbers(args);
    return Array.isArray(values) ? values.reduce((acc, value) => acc * value, 1) : values;
  };
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
    const values = aggregateNumbers(args);
    if (!Array.isArray(values)) {
      return values;
    }
    return values.length ? Math.min(...values) : 0;
  };
  const MAX = (...args: unknown[]) => {
    const values = aggregateNumbers(args);
    if (!Array.isArray(values)) {
      return values;
    }
    return values.length ? Math.max(...values) : 0;
  };
  const AVERAGE = (...args: unknown[]) => {
    const values = aggregateNumbers(args);
    if (!Array.isArray(values)) {
      return values;
    }
    return values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : FORMULA_ERROR.DIV0;
  };
  const MEDIAN = (...args: unknown[]) => {
    const values = aggregateNumbers(args);
    if (!Array.isArray(values)) {
      return values;
    }
    values.sort((a, b) => a - b);
    if (!values.length) {
      return FORMULA_ERROR.NUM;
    }
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  };
  const POWER = (arg1: unknown, arg2: unknown) => Math.pow(toNumericFormulaValue(arg1), toNumericFormulaValue(arg2));
  const ABS = (...args: unknown[]) => {
    const values = numericScalarArguments(args, 1);
    return Array.isArray(values) ? Math.abs(values[0]) : values;
  };
  const SQRT = (...args: unknown[]) => {
    const values = numericScalarArguments(args, 1);
    return Array.isArray(values) ? (values[0] < 0 ? FORMULA_ERROR.NUM : Math.sqrt(values[0])) : values;
  };
  const MOD = (...args: unknown[]) => {
    const values = numericScalarArguments(args, 2);
    if (!Array.isArray(values)) {
      return values;
    }
    const [number, divisor] = values;
    if (divisor === 0) {
      return FORMULA_ERROR.DIV0;
    }
    const remainder = number % divisor;
    return remainder === 0 ? 0 : Math.sign(remainder) === Math.sign(divisor) ? remainder : remainder + divisor;
  };
  const ROUND = (...args: unknown[]) => {
    const values = numericScalarArguments(args, 2);
    if (!Array.isArray(values)) {
      return values;
    }
    const [number, rawDigits] = values;
    const digits = Math.trunc(rawDigits);
    if (digits > 308) {
      return number;
    }
    if (digits < -308) {
      return 0;
    }
    const [coefficient, exponent = '0'] = Math.abs(number).toString().split('e');
    const shifted = Number(`${coefficient}e${Number(exponent) + digits}`);
    if (!Number.isFinite(shifted)) {
      return number;
    }
    const rounded = Math.round(shifted);
    const [roundedCoefficient, roundedExponent = '0'] = rounded.toString().split('e');
    const result = Number(`${roundedCoefficient}e${Number(roundedExponent) - digits}`);
    return Number.isFinite(result) ? (number < 0 && result !== 0 ? -result : result) : FORMULA_ERROR.NUM;
  };
  const RAND = () => Math.random();
  const NOW = () => new Date();
  const TODAY = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  const CONCAT = (...args: unknown[]) =>
    flattenFormulaFunctionArgs(args)
      .map((arg) => String(unwrapFormulaReference(arg) ?? ''))
      .join('');
  const COUNT = (...args: unknown[]) =>
    args.reduce<number>(
      (count, arg) =>
        count +
        (Array.isArray(arg)
          ? flattenFormulaFunctionArgs(arg).filter(
              (value) => typeof unwrapFormulaReference(value) === 'number' && Number.isFinite(unwrapFormulaReference(value))
            ).length
          : isFormulaReference(arg)
            ? typeof arg.value === 'number' && Number.isFinite(arg.value)
              ? 1
              : 0
            : typeof arg === 'boolean' || isNumericFormulaValue(arg)
              ? 1
              : 0),
      0
    );
  const COUNTA = (...args: unknown[]) =>
    flattenFormulaFunctionArgs(args).filter((value) =>
      isFormulaReference(value) ? value.value !== null && value.value !== undefined : value !== null && value !== undefined && value !== ''
    ).length;
  const COUNTBLANK = (...args: unknown[]) =>
    flattenFormulaFunctionArgs(args).filter((value) => {
      const unwrapped = unwrapFormulaReference(value);
      return unwrapped === null || unwrapped === undefined || unwrapped === '';
    }).length;
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
  registry.set('ABS', ABS);
  registry.set('ROUND', ROUND);
  registry.set('MOD', MOD);
  registry.set('SQRT', SQRT);
  registry.set('RAND', RAND);
  registry.set('RANDOM', RAND);
  registry.set('RAN', RAND);
  registry.set('NOW', NOW);
  registry.set('TODAY', TODAY);
  registry.set('CONCAT', CONCAT);
  registry.set('CONCATENATE', CONCAT);
  registry.set('COUNT', COUNT);
  registry.set('COUNTA', COUNTA);
  registry.set('COUNTBLANK', COUNTBLANK);
  registry.set('COUNTIF', COUNTIF);
  registry.set('NA', NA);

  return registry;
}

/** Convert scalar function arguments without accepting ranges or silently converting text to zero. */
function numericScalarArguments(args: unknown[], count: number): number[] | string {
  if (args.length !== count) {
    return FORMULA_ERROR.VALUE;
  }
  const numbers: number[] = [];
  for (const arg of args) {
    const value = unwrapFormulaReference(arg);
    if (value === null || value === undefined) {
      numbers.push(0);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      numbers.push(value);
    } else if (typeof value === 'boolean') {
      numbers.push(value ? 1 : 0);
    } else if (typeof value === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return FORMULA_ERROR.VALUE;
      }
      numbers.push(number);
    } else {
      return FORMULA_ERROR.VALUE;
    }
  }
  return numbers;
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

/** Aggregate functions treat referenced text and booleans differently from literal arguments. */
function aggregateNumbers(args: unknown[]): number[] | string {
  const values: number[] = [];
  const visit = (arg: unknown, fromRange = false): boolean => {
    if (Array.isArray(arg)) {
      return arg.every((item) => visit(item, true));
    }
    const reference = isFormulaReference(arg);
    const value = unwrapFormulaReference(arg);
    if (reference || fromRange) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        values.push(value);
      }
      return true;
    }
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string' && !value.trim()) {
      return false;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return false;
    }
    values.push(numeric);
    return true;
  };
  return args.every((arg) => visit(arg)) ? values : FORMULA_ERROR.VALUE;
}

function toNumericFormulaValue(value: unknown): number {
  value = unwrapFormulaReference(value);
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
  value = unwrapFormulaReference(value);
  criteria = unwrapFormulaReference(criteria);
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
