import { describe, expect, it } from 'vitest';
import {
  buildFormulaReferenceColorInfos,
  buildFormulaReferenceCssHash,
  expandFormulaReferenceToGridCells,
  FormulaReferenceColorCache,
  getExcelColumnIndexByName,
  getExcelColumnNameByIndex,
  parseExcelReferenceCell,
} from '../formula-reference.js';

describe('formula reference utilities', () => {
  it('should assign colors in textual order and reuse the color of a repeated reference', () => {
    const references = buildFormulaReferenceColorInfos('=C1*SUM(D1:D3)+C1');

    expect(references).toEqual([
      {
        ref: 'C1',
        colorIdx: 0,
        colorClass: 'formula-cell-color-1',
        cells: [{ row: 0, cell: 2 }],
      },
      {
        ref: 'D1:D3',
        colorIdx: 1,
        colorClass: 'formula-cell-color-2',
        cells: [
          { row: 0, cell: 3 },
          { row: 1, cell: 3 },
          { row: 2, cell: 3 },
        ],
      },
    ]);
  });

  it('should normalize absolute references and retain the valid start of an incomplete range', () => {
    const references = buildFormulaReferenceColorInfos('=$c$1 + SUM( $D$1 : D )');

    expect(references.map(({ ref, colorClass, cells }) => ({ ref, colorClass, cells }))).toEqual([
      { ref: 'C1', colorClass: 'formula-cell-color-1', cells: [{ row: 0, cell: 2 }] },
      { ref: 'D1:D', colorClass: 'formula-cell-color-2', cells: [{ row: 0, cell: 3 }] },
    ]);
  });

  it('should convert Excel column names and indexes through one shared implementation', () => {
    expect(getExcelColumnNameByIndex(0)).toBe('');
    expect(getExcelColumnNameByIndex(28)).toBe('AB');
    expect(getExcelColumnIndexByName('AB')).toBe(27);
  });

  it('should reject malformed or non-positive cell references', () => {
    expect(parseExcelReferenceCell('invalid')).toBeUndefined();
    expect(parseExcelReferenceCell('A0')).toBeUndefined();
    expect(expandFormulaReferenceToGridCells('invalid')).toEqual([]);
    expect(expandFormulaReferenceToGridCells('D1:')).toEqual([{ row: 0, cell: 3 }]);
  });

  it('should refuse to expand an excessively large range', () => {
    expect(expandFormulaReferenceToGridCells('A1:ZZZ1000000')).toEqual([]);
  });

  it('should share formula-change and dirty-state handling through the color cache', () => {
    const cache = new FormulaReferenceColorCache();

    expect(cache.update('=C1*SUM(D1:D3)')).toBe(true);
    expect(cache.isDirty).toBe(true);
    expect(cache.size).toBe(2);
    expect(Array.from(cache.values())).toHaveLength(2);
    expect(cache.update('=C1*SUM(D1:D3)')).toBe(false);

    cache.markClean();
    expect(cache.isDirty).toBe(false);
    expect(cache.update('=C1*SUM(D1:D)')).toBe(true);
    expect(cache.get('D1:D')?.cells).toEqual([{ row: 0, cell: 3 }]);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.isDirty).toBe(false);
  });

  it('should build one CSS hash for more than ten colored references and accept numeric column IDs', () => {
    const references = buildFormulaReferenceColorInfos('=A1+B1+C1+D1+E1+F1+G1+H1+I1+J1+K1');
    const columns = Array.from({ length: 11 }, (_value, index) => ({ id: index }));
    const hash = buildFormulaReferenceCssHash(references, columns, 1);

    expect(Object.keys(hash)).toEqual(['0']);
    expect(hash[0][0]).toBe('formula-cell-color-1');
    expect(hash[0][9]).toBe('formula-cell-color-10');
    expect(hash[0][10]).toBe('formula-cell-color-1');
    expect(Object.keys(hash[0])).toHaveLength(11);
    expect(buildFormulaReferenceCssHash(references, columns, 0)).toEqual({});
  });
});
