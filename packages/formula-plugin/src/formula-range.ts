import { FORMULA_MAX_REFERENCE_CELLS, getExcelColumnNameByIndex, parseExcelReferenceCell } from './formula-reference.js';

/** Expand rectangles before storing identities. Structural rows are excluded by the caller. */
export function expandFormulaRanges(formula: string, isDataRow: (row: number) => boolean = () => true): string {
  return formula.replace(
    /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?<![\w])\$?[A-Z]{1,3}\$?\d+\s*:\s*\$?[A-Z]{1,3}\$?\d+(?![\w])/gi,
    (token) => {
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
    }
  );
}

/** REFRANGE is an internal, ordered reference list; strings and stable REF arguments are preserved. */
export function mapFormulaRanges(formula: string, map: (members: string[]) => string): string {
  return formula.replace(
    /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|REFRANGE\(((?:(?:REF\(COLUMN\("(?:\\.|[^"\\])*"\),ROW\("(?:\\.|[^"\\])*"\)\)|\$?[A-Z]{1,3}\$?\d+|#REF!)(?:,|(?=\))))+)\)/gi,
    (token, members: string | undefined) =>
      members === undefined
        ? token
        : map(members.match(/REF\(COLUMN\("(?:\\.|[^"\\])*"\),ROW\("(?:\\.|[^"\\])*"\)\)|\$?[A-Z]{1,3}\$?\d+|#REF!/gi)!)
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
  let output = '';
  let index = 0;
  while (index < formula.length) {
    const char = formula[index];
    if (char === '"' || char === "'") {
      const quote = char;
      const start = index++;
      while (index < formula.length) {
        if (formula[index++] === quote) {
          if (formula[index] === quote) {
            index++;
          } else {
            break;
          }
        }
      }
      output += formula.slice(start, index);
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
    let quote = '';
    for (; index < formula.length; index++) {
      const current = formula[index];
      if (quote) {
        if (current === quote) {
          if (formula[index + 1] === quote) {
            index++;
          } else {
            quote = '';
          }
        }
      } else if (current === '"' || current === "'") {
        quote = current;
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
    const terms = args.map((arg) => {
      const trimmed = arg.trim();
      return helperRanges.get(trimmed)?.() ?? `COUNTA(${rewriteExcelHelperCounta(arg, helperRanges)})`;
    });
    output += args.some((arg) => helperRanges.has(arg.trim()))
      ? `(${terms.join('+')})`
      : `${match[0]}${args.map((arg) => rewriteExcelHelperCounta(arg, helperRanges)).join(',')})`;
  }
  return output;
}
