import {
  FORMULA_MAX_REFERENCE_CELLS,
  FORMULA_QUOTED_STRING_PATTERN,
  getExcelColumnNameByIndex,
  parseExcelReferenceCell,
  skipFormulaString,
} from './formula-reference.js';

const FORMULA_A1_RANGE_TOKEN_REGEX = new RegExp(
  String.raw`${FORMULA_QUOTED_STRING_PATTERN}|(?<![\w])\$?[A-Z]{1,3}\$?\d+\s*:\s*\$?[A-Z]{1,3}\$?\d+(?![\w])`,
  'gi'
);
const FORMULA_RANGE_MEMBER_PATTERN = String.raw`REF\(COLUMN\("(?:\\.|[^"\\])*"\),ROW\("(?:\\.|[^"\\])*"\)\)|\$?[A-Z]{1,3}\$?\d+|#REF!`;
const FORMULA_REFRANGE_TOKEN_REGEX = new RegExp(
  `${FORMULA_QUOTED_STRING_PATTERN}|REFRANGE\\(((?:(?:${FORMULA_RANGE_MEMBER_PATTERN})(?:,|(?=\\))))+)\\)`,
  'gi'
);
const FORMULA_RANGE_MEMBER_REGEX = new RegExp(FORMULA_RANGE_MEMBER_PATTERN, 'gi');

/** Expand rectangles before storing identities. Structural rows are excluded by the caller. */
export function expandFormulaRanges(formula: string, isDataRow: (row: number) => boolean = () => true): string {
  return formula.replace(FORMULA_A1_RANGE_TOKEN_REGEX, (token) => {
    if (/^["']/.test(token)) {
      return token;
    }
    const [first, last] = token.split(':').map((part) => part.trim());
    const start = parseExcelReferenceCell(first)!;
    const end = parseExcelReferenceCell(last)!;
    if (!start || !end) {
      return token;
    }
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCell = Math.min(start.cell, end.cell);
    const maxCell = Math.max(start.cell, end.cell);
    if ((maxRow - minRow + 1) * (maxCell - minCell + 1) > FORMULA_MAX_REFERENCE_CELLS) {
      return '#REF!';
    }
    const members: string[] = [];
    for (let row = minRow; row <= maxRow; row++) {
      if (!isDataRow(row)) {
        continue;
      }
      for (let cell = minCell; cell <= maxCell; cell++) {
        const columnFlags = cell === end.cell && (start.cell !== end.cell || row === end.row) ? last : first;
        const rowFlags = row === end.row && (start.row !== end.row || cell === end.cell) ? last : first;
        members.push(
          `${columnFlags.startsWith('$') ? '$' : ''}${getExcelColumnNameByIndex(cell + 1)}${/\$\d+$/.test(rowFlags) ? '$' : ''}${row + 1}`
        );
      }
    }
    return members.length ? `REFRANGE(${members.join(',')})` : '#REF!';
  });
}

export function parseFormulaFunctionArguments(formula: string, openIndex: number): { args: string[]; end: number } | undefined {
  const args: string[] = [];
  let start = openIndex + 1;
  let depth = 0;

  for (let index = start; index < formula.length; index++) {
    const char = formula[index];
    if (char === '"' || char === "'") {
      index = skipFormulaString(formula, index) - 1;
      if (index < 0) {
        return undefined;
      }
    } else if (char === '(' || char === '[') {
      depth++;
    } else if (char === ')' && depth === 0) {
      args.push(formula.slice(start, index));
      return { args, end: index };
    } else if (char === ')' || char === ']') {
      depth--;
    } else if (char === ',' && depth === 0) {
      args.push(formula.slice(start, index));
      start = index + 1;
    }
  }
  return undefined;
}

/** Read a quoted formula string, decoding backslash escapes and doubled delimiters. */
export function readFormulaString(formula: string, start: number): { value: string; end: number } | undefined {
  const quote = formula[start];
  let index = start + 1;
  let value = '';
  while (index < formula.length) {
    const char = formula[index];
    if (char === '\\' && index + 1 < formula.length) {
      const escaped = formula[index + 1];
      const unicode = escaped === 'u' ? formula.slice(index + 2, index + 6) : '';
      if (/^[\da-f]{4}$/i.test(unicode)) {
        value += String.fromCharCode(Number.parseInt(unicode, 16));
        index += 6;
      } else {
        const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
        value += escapes[escaped] ?? escaped;
        index += 2;
      }
    } else if (char === quote) {
      if (formula[index + 1] === quote) {
        value += quote;
        index += 2;
      } else {
        return { value, end: index + 1 };
      }
    } else {
      value += char;
      index++;
    }
  }
  return undefined;
}

/** Convert grid string literals (backslash escapes and doubled delimiters) to Excel string expressions. */
export function normalizeExcelFormulaStrings(formula: string): string {
  let output = '';
  let index = 0;

  while (index < formula.length) {
    const quote = formula[index];
    if (quote !== '"' && quote !== "'") {
      output += quote;
      index++;
      continue;
    }

    const start = index;
    const parsed = readFormulaString(formula, start);
    if (!parsed) {
      output += formula.slice(start);
      break;
    }
    index = parsed.end;
    if (quote === "'" && formula.slice(index).match(/^\s*!/)?.[0]) {
      output += formula.slice(start, index);
      continue;
    }
    output += toExcelFormulaString(parsed.value);
  }

  return output;
}

function toExcelFormulaString(value: string): string {
  const quoteText = (text: string) => `"${text.replace(/"/g, '""')}"`;
  const isControlCharacter = (text: string) => {
    const code = text.charCodeAt(0);
    return code <= 31 || code === 127;
  };
  if (!Array.from(value).some(isControlCharacter)) {
    return quoteText(value);
  }

  const parts: string[] = [];
  let text = '';
  for (const char of value) {
    if (isControlCharacter(char)) {
      if (text) {
        parts.push(quoteText(text));
        text = '';
      }
      parts.push(`CHAR(${char.charCodeAt(0)})`);
    } else {
      text += char;
    }
  }
  if (text) {
    parts.push(quoteText(text));
  }
  return `(${parts.join('&')})`;
}

/** REFRANGE is an internal, ordered reference list; strings and stable REF arguments are preserved. */
export function mapFormulaRanges(formula: string, map: (members: string[]) => string): string {
  return formula.replace(FORMULA_REFRANGE_TOKEN_REGEX, (token, members: string | undefined) =>
    members === undefined ? token : map(members.match(FORMULA_RANGE_MEMBER_REGEX)!)
  );
}

/** Compact only exact row-major rectangles; never widen a disjoint or reordered reference list. */
export function compactFormulaRange(members: string[]): string | undefined {
  const cells = members.map(parseExcelReferenceCell);
  if (cells.some((cell) => !cell)) {
    return undefined;
  }
  const first = cells[0]!;
  const last = cells[cells.length - 1]!;
  const width = last.cell - first.cell + 1;
  const height = last.row - first.row + 1;
  if (width <= 0 || height <= 0 || width * height !== cells.length) {
    return undefined;
  }
  if (!cells.every((cell, index) => cell!.row === first.row + Math.floor(index / width) && cell!.cell === first.cell + (index % width))) {
    return undefined;
  }
  return `${members[0]}:${members[members.length - 1]}`;
}

/** Preserve the original row-major width even when rows or columns have moved. */
export function getFormulaRangeWidth(members: string[]): number {
  if (!members.length) {
    return 1;
  }
  const firstRow = parseExcelReferenceCell(members[0])?.row;
  if (firstRow === undefined) {
    return 1;
  }
  const nextRow = members.findIndex((member) => parseExcelReferenceCell(member)?.row !== firstRow);
  return nextRow < 0 ? members.length : nextRow;
}

/** Rewrite COUNTA of helper ranges using source-cell presence, including formulas returning empty text. */
export function rewriteExcelHelperCounta(formula: string, helperRanges: ReadonlyMap<string, () => string>): string {
  if (helperRanges.size === 0) {
    return formula;
  }
  let output = '';
  let index = 0;
  while (index < formula.length) {
    const char = formula[index];
    if (char === '"' || char === "'") {
      const end = skipFormulaString(formula, index);
      const next = end < 0 ? formula.length : end;
      output += formula.slice(index, next);
      index = next;
      continue;
    }
    const match = /[cC]/.test(char) ? formula.slice(index).match(/^COUNTA\s*\(/i) : null;
    if (!match || (index > 0 && /[\w.]/.test(formula[index - 1]))) {
      output += char;
      index++;
      continue;
    }
    const start = index;
    index += match[0].length;
    let depth = 0;
    let argumentStart = index;
    const args: string[] = [];
    for (; index < formula.length; index++) {
      const current = formula[index];
      if (current === '"' || current === "'") {
        const end = skipFormulaString(formula, index);
        index = (end < 0 ? formula.length : end) - 1;
      } else if (current === '(') {
        depth++;
      } else if (current === ')' && depth > 0) {
        depth--;
      } else if (current === ',' && depth === 0) {
        args.push(formula.slice(argumentStart, index));
        argumentStart = index + 1;
      } else if (current === ')') {
        args.push(formula.slice(argumentStart, index));
        break;
      }
    }
    if (index === formula.length) {
      output += formula.slice(start);
      break;
    }
    index++;
    const rewrittenArgs = args.map((arg) => rewriteExcelHelperCounta(arg, helperRanges));
    output += args.some((arg) => helperRanges.has(arg.trim()))
      ? `(${args.map((arg, index) => helperRanges.get(arg.trim())?.() ?? `COUNTA(${rewrittenArgs[index]})`).join('+')})`
      : `${match[0]}${rewrittenArgs.join(',')})`;
  }
  return output;
}
