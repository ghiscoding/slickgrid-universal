import { describe, expect, it } from 'vitest';
import {
  compactFormulaRange,
  expandFormulaRanges,
  getFormulaRangeWidth,
  mapFormulaRanges,
  normalizeExcelFormulaStrings,
  parseFormulaFunctionArguments,
  rewriteExcelHelperCounta,
} from '../formula-range.js';

describe('stable formula ranges', () => {
  it('captures rectangles in row-major order with absolute flags and skips structural rows', () => {
    expect(expandFormulaRanges('=SUM($C$9:C10)')).toBe('=SUM(REFRANGE($C$9,C10))');
    expect(expandFormulaRanges('=SUM($B$3:A1)')).toBe('=SUM(REFRANGE(A1,$B1,A$2,$B$2,A$3,$B$3))');
    expect(expandFormulaRanges('=SUM(A1:B3)', (row) => row !== 1)).toBe('=SUM(REFRANGE(A1,B1,A3,B3))');
    expect(expandFormulaRanges('=SUM(A1:A2)', () => false)).toBe('=SUM(#REF!)');
    expect(expandFormulaRanges('=SUM(A1:ZZZ1000000)')).toBe('=SUM(#REF!)');
    expect(expandFormulaRanges('=SUM(A0:A1)')).toBe('=SUM(A0:A1)');
    expect(expandFormulaRanges('="A1:A3"')).toBe('="A1:A3"');
  });

  it('maps explicit members while preserving quoted strings and escaped IDs', () => {
    const formula = '=SUM(REFRANGE(REF(COLUMN("x"),ROW("a\\\"b")),A3,#REF!))+"REFRANGE(A1,A2)"';
    expect(mapFormulaRanges(formula, (members) => JSON.stringify(members))).toBe(
      '=SUM(["REF(COLUMN(\\"x\\"),ROW(\\"a\\\\\\"b\\"))","A3","#REF!"])+"REFRANGE(A1,A2)"'
    );
  });

  it('normalizes doubled quotes and leaves unterminated literals intact', () => {
    expect(normalizeExcelFormulaStrings(`=CONCAT("a""b",'c''d')`)).toBe(`=CONCAT("a""b","c'd")`);
    expect(normalizeExcelFormulaStrings('=CONCAT("unterminated')).toBe('=CONCAT("unterminated');
    expect(normalizeExcelFormulaStrings(`='Sheet 1'!A1&"\\u0041\\nB"`)).toBe(`='Sheet 1'!A1&("A"&CHAR(10)&"B")`);
  });

  it('compacts only identical rectangles without adding or reordering members', () => {
    expect(compactFormulaRange(['$A$1', 'B1', 'A2', 'B$2'])).toBe('$A$1:B$2');
    expect(compactFormulaRange(['A2', 'A1'])).toBeUndefined();
    expect(compactFormulaRange(['A1', 'A3'])).toBeUndefined();
    expect(compactFormulaRange(['A1', 'B2'])).toBeUndefined();
    expect(compactFormulaRange(['#REF!'])).toBeUndefined();
    expect(compactFormulaRange(['A1', 'B2', 'A2', 'B2'])).toBeUndefined();
  });

  it('retains row-major width when references become disjoint or reordered', () => {
    expect(getFormulaRangeWidth([])).toBe(1);
    expect(getFormulaRangeWidth(['#REF!'])).toBe(1);
    expect(getFormulaRangeWidth(['C8', 'A8'])).toBe(2);
    expect(getFormulaRangeWidth(['C8', 'A8', 'C2', 'A2'])).toBe(2);
    expect(getFormulaRangeWidth(['C8', 'C2'])).toBe(1);
  });

  it('rewrites only direct helper ranges in COUNTA while preserving nested arguments and quoted text', () => {
    const helper = "'Formula References'!$A$1:$A$3";
    const helpers = new Map([[helper, () => "SUM('Formula References'!$A$4:$A$6)"]]);
    expect(rewriteExcelHelperCounta(`COUNTA(${helper},IF(A1=1,"a,b",""))`, helpers)).toBe(`(SUM('Formula References'!$A$4:$A$6)+COUNTA(IF(A1=1,"a,b","")))`);
    expect(rewriteExcelHelperCounta(`IF(TRUE,COUNTA(${helper}),COUNTA(A1:A2))`, helpers)).toBe(`IF(TRUE,(SUM('Formula References'!$A$4:$A$6)),COUNTA(A1:A2))`);
    expect(rewriteExcelHelperCounta(`"COUNTA(${helper})"+MYCOUNTA(${helper})`, helpers)).toBe(`"COUNTA(${helper})"+MYCOUNTA(${helper})`);
    expect(rewriteExcelHelperCounta(`COUNTA(${helper}`, helpers)).toBe(`COUNTA(${helper}`);
    expect(rewriteExcelHelperCounta(`COUNTA("a""b",'a''b'!A1,${helper})`, helpers)).toBe(
      `(COUNTA("a""b")+COUNTA('a''b'!A1)+SUM('Formula References'!$A$4:$A$6))`
    );
    expect(parseFormulaFunctionArguments('IF("a,1)', 2)).toBeUndefined();
    // backslash-escaped quotes stay inside the string literal
    expect(rewriteExcelHelperCounta(`CONCAT("a\\"COUNTA(${helper})",COUNTA(${helper}))`, helpers)).toBe(
      `CONCAT("a\\"COUNTA(${helper})",(SUM('Formula References'!$A$4:$A$6)))`
    );
    expect(rewriteExcelHelperCounta(`COUNTA("a\\",${helper})`, helpers)).toBe(`COUNTA("a\\",${helper})`);
    expect(rewriteExcelHelperCounta(`"unterminated COUNTA(${helper})`, helpers)).toBe(`"unterminated COUNTA(${helper})`);
  });

  it('processes nested COUNTA arguments once when helper ranges exist', () => {
    const helpers = new Map([['helper', () => 'SUM(A1:A2)']]);
    let lookups = 0;
    const originalGet = helpers.get.bind(helpers);
    helpers.get = (key) => {
      lookups++;
      return originalGet(key);
    };
    const formula = `${'COUNTA('.repeat(16)}A1${')'.repeat(16)}`;
    expect(rewriteExcelHelperCounta(formula, helpers)).toBe(formula);
    expect(lookups).toBeLessThan(100);
    expect(rewriteExcelHelperCounta(formula, new Map())).toBe(formula);
  });
});
