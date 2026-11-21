import type { Column, OnDragReplaceCellsEventArgs, SlickDataView, SlickGrid, SlickRange } from '@slickgrid-universal/common';
import { SlickSelectionUtils } from '@slickgrid-universal/common';
import { FORMULA_ERROR } from './formula-errors.js';
import {
  createFormulaA1ReferenceRegex,
  getExcelColumnIndexByName,
  getExcelColumnNameByIndex,
  setFormulaObjectProperty,
  transformFormulaOutsideQuotedStrings,
} from './formula-reference.js';

/** Internal callbacks used by FormulaService to keep storage and display concerns in the service. */
export interface FormulaDragFillContext {
  grid: SlickGrid;
  dataView: SlickDataView;
  getDatasetIdPropertyName: () => string;
  getFormula: (rowId: number | string, columnId: number | string) => string | undefined;
  setFormula: (rowId: number | string, columnId: number | string, formula?: string | null) => void;
  toStoredFormula: (formula: string) => string;
  toDisplayFormulaForCell: (formula: string, rowId: number | string, columnId: number | string) => string;
  applyFormulaChanges?: (apply: () => void) => void;
}

type FormulaFillDirection = 'horizontal' | 'vertical';

interface FormulaFillTarget {
  direction: FormulaFillDirection;
  range: SlickRange;
}

interface FormulaFillChange {
  row: number;
  cell: number;
  rowId: number | string;
  column: Column;
  item: any;
  field: string;
  previousValue: unknown;
  previousFormula?: string;
  nextValue: unknown;
  nextFormula?: string | null;
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

  const allColumns = (context.grid.getColumns?.() || []) as Column[];
  const sourceCells = allColumns.flatMap((column, index) =>
    index >= baseRange.fromCell && index <= baseRange.toCell && !column.hidden ? [index] : []
  );
  const changes = new Map<string, FormulaFillChange>();
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

      let visibleOffset = 0;
      for (let cellOffset = 0; cellOffset < targetRange.cellCount(); cellOffset++) {
        const targetCell = targetRange.fromCell + cellOffset;
        const targetColumn = allColumns[targetCell];
        if (!targetColumn || targetColumn.hidden || sourceCells.length === 0) {
          continue;
        }
        const sourceCell = sourceCells[visibleOffset++ % sourceCells.length];
        const sourceColumn = allColumns[sourceCell];
        if (!targetColumn.allowFormula || !isFormulaFillCellEditable(context, targetRow, targetCell, targetColumn)) {
          continue;
        }

        const targetField = String(targetColumn.field ?? targetColumn.id);
        const sourceFormula = getFormulaOrRawValue(sourceItem, sourceRowId, sourceColumn, context.getFormula);
        let nextValue: unknown;
        let nextFormula: string | null | undefined;
        if (sourceFormula) {
          const displayFormula = context.toDisplayFormulaForCell(sourceFormula, sourceRowId, sourceColumn.id);
          const translatedFormula = translateFormulaReferences(displayFormula, targetRow - sourceRow, targetCell - sourceCell);
          nextValue = context.toStoredFormula(translatedFormula);
          nextFormula = translatedFormula;
        } else {
          const { seriesIndex, sourceValues } = getSourceValueSeries(
            baseRange,
            direction,
            targetRow,
            targetCell,
            sourceCell,
            allColumns,
            context.grid,
            valueSeriesCache
          );
          nextValue = getFillSeriesValue(sourceValues, seriesIndex);
          nextFormula = null;
        }
        const key = `${targetRow}:${targetCell}`;
        if (!changes.has(key)) {
          changes.set(key, {
            row: targetRow,
            cell: targetCell,
            rowId: targetRowId,
            column: targetColumn,
            item: targetItem,
            field: targetField,
            previousValue: targetItem?.[targetField],
            previousFormula: context.getFormula(targetRowId, targetColumn.id),
            nextValue,
            nextFormula,
          });
        }
      }
    }
  }

  if (changes.size === 0) {
    return;
  }

  const applyChanges = (useNext: boolean) => {
    const updatedItems = new Map<string, { id: number | string; item: any }>();
    const applyFormulaChanges = context.applyFormulaChanges ?? ((apply: () => void) => apply());
    applyFormulaChanges(() => {
      for (const change of changes.values()) {
        setFormulaObjectProperty(change.item, change.field, useNext ? change.nextValue : change.previousValue);
        context.setFormula(change.rowId, change.column.id, useNext ? change.nextFormula : change.previousFormula);
        updatedItems.set(String(change.rowId), { id: change.rowId, item: change.item });
      }
    });
    const updates = Array.from(updatedItems.values());
    if (typeof context.dataView?.updateItems === 'function') {
      context.dataView.updateItems(
        updates.map(({ id }) => id),
        updates.map(({ item }) => item)
      );
    } else if (typeof context.dataView?.updateItem === 'function') {
      updates.forEach(({ id, item }) => context.dataView.updateItem(id, item));
    }
  };
  const first = changes.values().next().value!;
  const editCommand = {
    row: first.row,
    cell: first.cell,
    editor: undefined,
    serializedValue: first.nextValue,
    prevSerializedValue: first.previousValue,
    execute: () => applyChanges(true),
    undo: () => applyChanges(false),
  };
  const editCommandHandler = context.grid.getOptions()?.editCommandHandler;
  if (typeof editCommandHandler === 'function') {
    editCommandHandler(first.item, first.column, editCommand);
  } else {
    editCommand.execute();
  }
}

function isFormulaFillCellEditable(context: FormulaDragFillContext, row: number, cell: number, column: Column): boolean {
  const grid = context.grid as any;
  if (typeof grid.isCellEditable === 'function') {
    return grid.isCellEditable(row, cell);
  }
  if (context.grid.getOptions?.().editable === false) {
    return false;
  }
  const metadataColumns = context.dataView?.getItemMetadata?.(row)?.columns;
  const metadata = metadataColumns?.[column.id] ?? metadataColumns?.[cell];
  if (metadata?.editorClass === null || metadata?.editor === null) {
    return false;
  }
  return column.editorClass !== null && column.editor !== null && !column.denyPaste;
}

function getSourceValueSeries(
  baseRange: SlickRange,
  direction: FormulaFillDirection,
  targetRow: number,
  targetCell: number,
  sourceCell: number,
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
      if (!columns[sourceCell]?.hidden) {
        sourceValues.push(getSourceValue(sourceRow, sourceCell));
      }
    }
    cache.set(cacheKey, sourceValues);
  }
  const visibleIndex = (cell: number) => columns.slice(0, cell).filter((column) => !column.hidden).length;
  return { seriesIndex: visibleIndex(targetCell) - visibleIndex(baseRange.fromCell), sourceValues };
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
  const referenceRegex = createFormulaA1ReferenceRegex();
  return transformFormulaOutsideQuotedStrings(formula, (segment) =>
    segment.replace(referenceRegex, (reference) => {
      const translated = reference.split(':').map((endpoint) => translateFormulaReferenceEndpoint(endpoint.trim(), rowDelta, columnDelta));
      return translated.includes(FORMULA_ERROR.REF) ? FORMULA_ERROR.REF : translated.join(':');
    })
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

  const shiftedColumnIndex = columnIndex + (columnIsAbsolute ? 0 : columnDelta);
  const shiftedRowIndex = rowIndex + (rowIsAbsolute ? 0 : rowDelta);
  if (shiftedColumnIndex < 0 || shiftedRowIndex < 0) {
    return FORMULA_ERROR.REF;
  }
  return `${columnIsAbsolute ? '$' : ''}${getExcelColumnNameByIndex(shiftedColumnIndex + 1)}${rowIsAbsolute ? '$' : ''}${shiftedRowIndex + 1}`;
}
