import type { Column, OnDragReplaceCellsEventArgs, SlickDataView, SlickGrid, SlickRange } from '@slickgrid-universal/common';
import { SlickSelectionUtils } from '@slickgrid-universal/common';
import { getExcelColumnIndexByName, getExcelColumnNameByIndex, setFormulaObjectProperty } from './formula-reference.js';

/** Internal callbacks used by FormulaService to keep storage and display concerns in the service. */
export interface FormulaDragFillContext {
  grid: SlickGrid;
  dataView: SlickDataView;
  getDatasetIdPropertyName: () => string;
  getFormula: (rowId: number | string, columnId: number | string) => string | undefined;
  setFormula: (rowId: number | string, columnId: number | string, formula?: string | null) => void;
  toStoredFormula: (formula: string) => string;
  toDisplayFormulaForCell: (formula: string, rowId: number | string, columnId: number | string) => string;
}

type FormulaFillDirection = 'horizontal' | 'vertical';

interface FormulaFillTarget {
  direction: FormulaFillDirection;
  range: SlickRange;
}

/** Fill formula cells through the same target-range semantics as the spreadsheet drag-fill example. */
export function handleFormulaDragFill(args: OnDragReplaceCellsEventArgs, context: FormulaDragFillContext): void {
  const baseRange = args?.prevSelectedRange;
  const selectedRange = args?.selectedRange;
  if (!baseRange || !selectedRange || !context.grid?.getVisibleColumns) {
    return;
  }

  const verticalTargetRange = SlickSelectionUtils.verticalTargetRange(baseRange, selectedRange);
  const horizontalTargetRange = SlickSelectionUtils.horizontalTargetRange(baseRange, selectedRange);
  const cornerTargetRange = SlickSelectionUtils.cornerTargetRange(baseRange, selectedRange);
  const addedRowCount = Math.max(0, baseRange.fromRow - selectedRange.fromRow) + Math.max(0, selectedRange.toRow - baseRange.toRow);
  const addedCellCount = Math.max(0, baseRange.fromCell - selectedRange.fromCell) + Math.max(0, selectedRange.toCell - baseRange.toCell);
  const cornerDirection: FormulaFillDirection = addedRowCount >= addedCellCount ? 'vertical' : 'horizontal';
  const fillTargets: FormulaFillTarget[] = [];
  if (verticalTargetRange) {
    fillTargets.push({ direction: 'vertical', range: verticalTargetRange });
  }
  if (horizontalTargetRange) {
    fillTargets.push({ direction: 'horizontal', range: horizontalTargetRange });
  }
  if (cornerTargetRange) {
    fillTargets.push({ direction: cornerDirection, range: cornerTargetRange });
  }
  if (fillTargets.length === 0) {
    return;
  }

  const visibleColumns = context.grid.getVisibleColumns() as Column[];
  const allColumns = (context.grid.getColumns?.() || []) as Column[];
  const updatedItems = new Map<string, { id: number | string; item: any }>();
  const valueSeriesCache = new Map<string, unknown[]>();
  const rowIdProperty = context.getDatasetIdPropertyName();

  for (const { direction, range: targetRange } of fillTargets) {
    for (let rowOffset = 0; rowOffset < targetRange.rowCount(); rowOffset++) {
      const targetRow = targetRange.fromRow + rowOffset;
      const sourceRow = baseRange.fromRow + (rowOffset % baseRange.rowCount());
      const targetItem = context.grid.getDataItem(targetRow);
      const sourceItem = context.grid.getDataItem(sourceRow);
      const targetRowId = targetItem?.[rowIdProperty] as number | string | undefined;
      const sourceRowId = sourceItem?.[rowIdProperty] as number | string | undefined;
      if (targetRowId === undefined || targetRowId === null || sourceRowId === undefined || sourceRowId === null) {
        continue;
      }

      for (let cellOffset = 0; cellOffset < targetRange.cellCount(); cellOffset++) {
        const targetVisibleCell = targetRange.fromCell + cellOffset;
        const sourceVisibleCell = baseRange.fromCell + (cellOffset % baseRange.cellCount());
        const targetColumn = visibleColumns[targetVisibleCell];
        const sourceColumn = visibleColumns[sourceVisibleCell];
        if (!targetColumn?.allowFormula || !sourceColumn) {
          continue;
        }

        const targetField = String(targetColumn.field ?? targetColumn.id);
        const sourceFormula = getFormulaOrRawValue(sourceItem, sourceRowId, sourceColumn, context.getFormula);
        if (sourceFormula) {
          const sourceColumnIndex = allColumns.findIndex((column) => String(column.id) === String(sourceColumn.id));
          const targetColumnIndex = allColumns.findIndex((column) => String(column.id) === String(targetColumn.id));
          if (sourceColumnIndex < 0 || targetColumnIndex < 0) {
            continue;
          }

          const displayFormula = context.toDisplayFormulaForCell(sourceFormula, sourceRowId, sourceColumn.id);
          const translatedFormula = translateFormulaReferences(
            displayFormula,
            targetRow - sourceRow,
            targetColumnIndex - sourceColumnIndex
          );
          setFormulaObjectProperty(targetItem, targetField, context.toStoredFormula(translatedFormula));
          context.setFormula(targetRowId, targetColumn.id, translatedFormula);
        } else {
          const { seriesIndex, sourceValues } = getSourceValueSeries(
            baseRange,
            direction,
            targetRow,
            targetVisibleCell,
            visibleColumns,
            context.grid,
            valueSeriesCache
          );
          setFormulaObjectProperty(targetItem, targetField, getFillSeriesValue(sourceValues, seriesIndex));
          context.setFormula(targetRowId, targetColumn.id, null);
        }
        updatedItems.set(String(targetRowId), { id: targetRowId, item: targetItem });
      }
    }
  }

  if (updatedItems.size > 0) {
    const updates = Array.from(updatedItems.values());
    if (typeof context.dataView?.updateItems === 'function') {
      context.dataView.updateItems(
        updates.map(({ id }) => id),
        updates.map(({ item }) => item)
      );
    } else if (typeof context.dataView?.updateItem === 'function') {
      updates.forEach(({ id, item }) => context.dataView.updateItem(id, item));
    }
  }
}

function getSourceValueSeries(
  baseRange: SlickRange,
  direction: FormulaFillDirection,
  targetRow: number,
  targetCell: number,
  columns: Column[],
  grid: SlickGrid,
  cache: Map<string, unknown[]>
): { seriesIndex: number; sourceValues: unknown[] } {
  const options = grid.getOptions();
  const getSourceValue = (row: number, cell: number): unknown => {
    const column = columns[cell];
    const item = grid.getDataItem(row);
    if (!column || column.hidden || !item) {
      return undefined;
    }
    return options.dataItemColumnValueExtractor ? options.dataItemColumnValueExtractor(item, column) : item[column.field];
  };

  if (direction === 'vertical') {
    const sourceCell = baseRange.fromCell + positiveModulo(targetCell - baseRange.fromCell, baseRange.cellCount());
    const cacheKey = `v${sourceCell}`;
    let sourceValues = cache.get(cacheKey);
    if (!sourceValues) {
      sourceValues = [];
      for (let sourceRow = baseRange.fromRow; sourceRow <= baseRange.toRow; sourceRow++) {
        sourceValues.push(getSourceValue(sourceRow, sourceCell));
      }
      cache.set(cacheKey, sourceValues);
    }
    return { seriesIndex: targetRow - baseRange.fromRow, sourceValues };
  }

  const sourceRow = baseRange.fromRow + positiveModulo(targetRow - baseRange.fromRow, baseRange.rowCount());
  const cacheKey = `h${sourceRow}`;
  let sourceValues = cache.get(cacheKey);
  if (!sourceValues) {
    sourceValues = [];
    for (let sourceCell = baseRange.fromCell; sourceCell <= baseRange.toCell; sourceCell++) {
      sourceValues.push(getSourceValue(sourceRow, sourceCell));
    }
    cache.set(cacheKey, sourceValues);
  }
  return { seriesIndex: targetCell - baseRange.fromCell, sourceValues };
}

/** AG Grid-style default: copy one value, continue numeric ranges, and repeat mixed ranges. */
// fallow-ignore-next-line unused-export
export function getFillSeriesValue(sourceValues: unknown[], seriesIndex: number): unknown {
  if (sourceValues.length === 0) {
    return undefined;
  }

  const numericValues = sourceValues.map((value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : undefined;
    }
    return undefined;
  });

  if (sourceValues.length > 1 && numericValues.every((value): value is number => value !== undefined)) {
    const firstValue = numericValues[0];
    const lastValue = numericValues[numericValues.length - 1];
    const step = (lastValue - firstValue) / (sourceValues.length - 1);
    return firstValue + step * seriesIndex;
  }

  return sourceValues[positiveModulo(seriesIndex, sourceValues.length)];
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function getFormulaOrRawValue(
  item: any,
  rowId: number | string,
  column: Column,
  getFormula: FormulaDragFillContext['getFormula']
): string | undefined {
  const storedFormula = getFormula(rowId, column.id);
  if (storedFormula?.trim().startsWith('=')) {
    return storedFormula.trim();
  }

  const field = String(column.field ?? column.id);
  const rawValue = item?.[field];
  return typeof rawValue === 'string' && rawValue.trim().startsWith('=') ? rawValue.trim() : undefined;
}

/** Shift relative A1 references while leaving quoted literals untouched. */
// fallow-ignore-next-line unused-export
export function translateFormulaReferences(formula: string, rowDelta: number, columnDelta: number): string {
  const referenceRegex = /(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+(?:\s*:\s*\$?[A-Z]{1,3}\$?\d+)?(?![A-Za-z0-9_])/gi;
  return transformFormulaOutsideQuotedStrings(formula, (segment) =>
    segment.replace(referenceRegex, (reference) =>
      reference
        .split(':')
        .map((endpoint) => translateFormulaReferenceEndpoint(endpoint.trim(), rowDelta, columnDelta))
        .join(':')
    )
  );
}

function translateFormulaReferenceEndpoint(reference: string, rowDelta: number, columnDelta: number): string {
  const match = reference.match(/^(\$?)([A-Z]{1,3})(\$?)(\d+)$/i);
  /* v8 ignore if - callers only pass endpoints matched by the validating reference regex */
  if (!match) {
    return reference;
  }

  const columnIsAbsolute = match[1] === '$';
  const rowIsAbsolute = match[3] === '$';
  const columnIndex = getExcelColumnIndexByName(match[2].toUpperCase());
  const rowIndex = Number.parseInt(match[4], 10) - 1;
  /* v8 ignore if - the endpoint regex guarantees a valid Excel column and row */
  if (columnIndex < 0 || !Number.isFinite(rowIndex)) {
    return reference;
  }

  const shiftedColumnIndex = Math.max(0, columnIndex + (columnIsAbsolute ? 0 : columnDelta));
  const shiftedRowIndex = Math.max(0, rowIndex + (rowIsAbsolute ? 0 : rowDelta));
  return `${columnIsAbsolute ? '$' : ''}${getExcelColumnNameByIndex(shiftedColumnIndex + 1)}${rowIsAbsolute ? '$' : ''}${shiftedRowIndex + 1}`;
}

function transformFormulaOutsideQuotedStrings(formula: string, transform: (segment: string) => string): string {
  const quotedTextRegex = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
  let result = '';
  let previousEnd = 0;
  let match: RegExpExecArray | null;

  while ((match = quotedTextRegex.exec(formula)) !== null) {
    result += transform(formula.slice(previousEnd, match.index));
    result += match[0];
    previousEnd = match.index + match[0].length;
  }

  return result + transform(formula.slice(previousEnd));
}
