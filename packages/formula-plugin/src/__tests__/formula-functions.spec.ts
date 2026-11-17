import { describe, expect, it, vi } from 'vitest';
import { FORMULA_ERROR } from '../formula-errors.js';
import { createFormulaFunctionRegistry, formulaReference } from '../formula-functions.js';

describe('createFormulaFunctionRegistry', () => {
  it('supports spreadsheet math functions and function aliases', () => {
    const registry = createFormulaFunctionRegistry(new Map());
    expect(registry.get('ABS')?.(-4)).toBe(4);
    expect(registry.get('ABS')?.(formulaReference('-2.5'))).toBe(2.5);
    expect(registry.get('ABS')?.(null)).toBe(0);
    expect(registry.get('ABS')?.(true)).toBe(1);
    expect(registry.get('SQRT')?.(16)).toBe(4);
    expect(registry.get('SQRT')?.(-1)).toBe(FORMULA_ERROR.NUM);
    expect(registry.get('MOD')?.(-3, 2)).toBe(1);
    expect(registry.get('MOD')?.(3, -2)).toBe(-1);
    expect(registry.get('MOD')?.(-3, -2)).toBe(-1);
    expect(registry.get('MOD')?.(-4, 2)).toBe(0);
    expect(registry.get('MOD')?.(4, 0)).toBe(FORMULA_ERROR.DIV0);
    expect(registry.get('ROUND')?.(-1.475, 2)).toBe(-1.48);
    expect(registry.get('ROUND')?.(1.005, 2)).toBe(1.01);
    expect(registry.get('ROUND')?.(2.5, 0)).toBe(3);
    expect(registry.get('ROUND')?.(-2.5, 0)).toBe(-3);
    expect(registry.get('ROUND')?.(626.3, -3)).toBe(1000);
    expect(registry.get('ROUND')?.(2.5, 0.9)).toBe(3);
    expect(registry.get('ROUND')?.(-0.001, 2)).toBe(0);
    expect(registry.get('ROUND')?.(2, 309)).toBe(2);
    expect(registry.get('ROUND')?.(2, -309)).toBe(0);
    expect(registry.get('ROUND')?.(1e200, 200)).toBe(1e200);
    expect(registry.get('ROUND')?.(1.79e308, -308)).toBe(FORMULA_ERROR.NUM);
    for (const name of ['ABS', 'SQRT', 'ROUND', 'MOD']) {
      expect(registry.get(name)?.()).toBe(FORMULA_ERROR.VALUE);
      expect(registry.get(name)?.('text', 2)).toBe(FORMULA_ERROR.VALUE);
    }
    expect(registry.get('ABS')?.('')).toBe(FORMULA_ERROR.VALUE);
    expect(registry.get('ABS')?.('1e999')).toBe(FORMULA_ERROR.VALUE);
    expect(registry.get('ABS')?.([1])).toBe(FORMULA_ERROR.VALUE);
    expect(registry.get('MOD')?.(1, 2, 3)).toBe(FORMULA_ERROR.VALUE);
    expect(registry.get('CONCATENATE')?.('x', ['y', 'z'])).toBe('xyz');
    expect(registry.get('RANDOM')).toBe(registry.get('RAND'));
    expect(registry.get('RAN')).toBe(registry.get('RAND'));
    expect(createFormulaFunctionRegistry(new Map([['RAN', () => 42]])).get('RAN')?.()).toBe(42);
  });

  it('should include core arithmetic/stat functions', () => {
    const registry = createFormulaFunctionRegistry(new Map());

    expect(registry.get('SUM')?.(1, 2, '3', true, null, undefined)).toBe(7);
    expect(registry.get('SUM')?.('')).toBe(FORMULA_ERROR.VALUE);
    expect(registry.get('PRODUCT')?.(2, '3', true)).toBe(6);
    expect(registry.get('MIN')?.(6, '2', 8)).toBe(2);
    expect(registry.get('MIN')?.()).toBe(0);
    expect(registry.get('MAX')?.(6, '2', 8)).toBe(8);
    expect(registry.get('MAX')?.()).toBe(0);
    expect(registry.get('AVERAGE')?.(2, 4, '6')).toBe(4);
    expect(registry.get('AVERAGE')?.()).toBe(FORMULA_ERROR.DIV0);
    expect(registry.get('MEDIAN')?.(10, 2, 6, 8)).toBe(7);
    expect(registry.get('MEDIAN')?.(1, 2, 3)).toBe(2);
    expect(registry.get('MEDIAN')?.()).toBe(FORMULA_ERROR.NUM);
    expect(registry.get('POWER')?.('2', 3)).toBe(8);
    expect(registry.get('SUM')?.({ foo: 1 } as any, 2)).toBe(FORMULA_ERROR.VALUE);
  });

  it('ignores blank values in statistical ranges while retaining zero', () => {
    const registry = createFormulaFunctionRegistry(new Map());
    const values = [null, 2, undefined, 4, '', 0];
    expect(registry.get('AVERAGE')?.(values)).toBe(2);
    expect(registry.get('MEDIAN')?.(values)).toBe(2);
    expect(registry.get('MIN')?.([null, 2, 4])).toBe(2);
    expect(registry.get('MAX')?.([null, -2, -4])).toBe(-2);
    expect(registry.get('PRODUCT')?.([null, 2, 4])).toBe(8);
    expect(registry.get('AVERAGE')?.([null, undefined, ''])).toBe(FORMULA_ERROR.DIV0);
    for (const name of ['MIN', 'MAX', 'AVERAGE', 'MEDIAN']) {
      expect(registry.get(name)?.('not numeric')).toBe(FORMULA_ERROR.VALUE);
    }
    expect(registry.get('POWER')?.(true, 2)).toBe(1);
    expect(registry.get('POWER')?.({}, 2)).toBe(0);
  });

  it('should evaluate SUMPRODUCT with scalar broadcast and array lengths', () => {
    const registry = createFormulaFunctionRegistry(new Map());

    expect(registry.get('SUMPRODUCT')?.([1, 2, 3], 10)).toBe(60);
    expect(registry.get('SUMPRODUCT')?.([1, 2], [3, 4])).toBe(11);
    expect(registry.get('SUMPRODUCT')?.([2, 3, 4], [10, 20])).toBe(84);
    expect(registry.get('SUMPRODUCT')?.([], [])).toBe(0);
    expect(registry.get('SUMPRODUCT')?.([1, undefined], [2, 3])).toBe(2);
    expect(registry.get('SUMPRODUCT')?.([[1], []], [2, 3])).toBe(5);
    expect(registry.get('SUMPRODUCT')?.()).toBe(0);
  });

  it('should evaluate IF and concatenation helpers', () => {
    const registry = createFormulaFunctionRegistry(new Map());

    expect(registry.get('IF')?.(true, 'yes', 'no')).toBe('yes');
    expect(registry.get('IF')?.(false, 'yes', 'no')).toBe('no');
    expect(registry.get('CONCAT')?.('a', ['b', 'c'], null, undefined, 1)).toBe('abc1');
  });

  it('should evaluate count functions with numeric and blank semantics', () => {
    const registry = createFormulaFunctionRegistry(new Map());

    expect(registry.get('COUNT')?.(1, '2', 'x', '', null, undefined, Infinity)).toBe(2);
    expect(registry.get('COUNTA')?.(1, '2', '', null, undefined, false)).toBe(3);
    expect(registry.get('COUNTBLANK')?.(1, '', null, undefined, 'x')).toBe(3);
  });

  it('should evaluate COUNTIF and SUMIF criteria operators', () => {
    const registry = createFormulaFunctionRegistry(new Map());

    expect(registry.get('COUNTIF')?.([1, 2, 3, 4], '>2')).toBe(2);
    expect(registry.get('COUNTIF')?.(['a', 'b', 'a'], 'a')).toBe(2);
    expect(registry.get('COUNTIF')?.([true, false, true], true)).toBe(2);

    expect(registry.get('SUMIF')?.([1, 2, 3, 4], '>2')).toBe(7);
    expect(registry.get('SUMIF')?.([1, 2, 3, 4], '<=2', [10, 20, 30, 40])).toBe(30);
    expect(registry.get('SUMIF')?.(['x', 'y'], '=x', [4, 9])).toBe(4);
    expect(registry.get('COUNTIF')?.([1, 2, 3, 4], '<3')).toBe(2);
    expect(registry.get('COUNTIF')?.([1, 2, 3, 4], '>=3')).toBe(2);
    expect(registry.get('COUNTIF')?.(['a', 'b', 'a'], '<>a')).toBe(1);
    expect(registry.get('COUNTIF')?.(['a', null], null)).toBe(1);
  });

  it('should normalize non-finite, boolean, numeric, and invalid numeric values', () => {
    const registry = createFormulaFunctionRegistry(new Map());

    expect(registry.get('SUM')?.(true, false, ' 2 ')).toBe(3);
    expect(registry.get('SUM')?.(Infinity)).toBe(FORMULA_ERROR.VALUE);
    expect(registry.get('SUM')?.('not numeric')).toBe(FORMULA_ERROR.VALUE);
    expect(registry.get('SUM')?.([Number.NaN])).toBe(0);
  });

  it('should expose date/random/error helpers', () => {
    const registry = createFormulaFunctionRegistry(new Map());

    const now = registry.get('NOW')?.();
    const today = registry.get('TODAY')?.();
    const rand = registry.get('RAND')?.();

    expect(now).toBeInstanceOf(Date);
    expect(today).toBeInstanceOf(Date);
    expect((today as Date).getHours()).toBe(0);
    expect((today as Date).getMinutes()).toBe(0);
    expect(typeof rand).toBe('number');
    expect((rand as number) >= 0 && (rand as number) <= 1).toBe(true);
    expect(registry.get('NA')?.()).toBe(FORMULA_ERROR.NA);
  });

  it('should accept valid custom functions and ignore invalid names/non-functions', () => {
    const customSpy = vi.fn((a: number, b: number) => a + b + 1);
    const registry = createFormulaFunctionRegistry(
      new Map<string, (...args: any[]) => unknown>([
        ['CUSTOM_ADD', customSpy],
        ['sum', ((a: number, b: number) => a - b) as any],
        ['1BAD', ((x: number) => x) as any],
        ['ALSO_BAD', 123 as any],
      ])
    );

    expect(registry.get('CUSTOM_ADD')?.(2, 3)).toBe(6);
    expect(customSpy).toHaveBeenCalledTimes(1);
    // lowercase key must not override built-ins due to name validation
    expect(registry.get('SUM')?.(2, 3)).toBe(5);
    expect(registry.has('1BAD')).toBe(false);
  });

  it('should allow uppercase custom names to override built-ins intentionally', () => {
    const registry = createFormulaFunctionRegistry(new Map<string, (...args: any[]) => unknown>([['SUM', ((a: number, b: number) => a - b) as any]]));

    expect(registry.get('SUM')?.(9, 4)).toBe(5);
  });

  it('should return false on unexpected criteria operator fallback', () => {
    const registry = createFormulaFunctionRegistry(new Map());
    const originalMatch = String.prototype.match;

    const matchSpy = vi.spyOn(String.prototype as any, 'match').mockImplementation(function (this: string, ...args: any[]) {
      const regex = args[0] as RegExp;
      if (this === '!2') {
        return ['!2', '!', '2'] as any;
      }

      return originalMatch!.call(this, regex);
    });

    expect(registry.get('COUNTIF')?.([1, 2, 3], '!2')).toBe(0);

    matchSpy.mockRestore();
  });
});
