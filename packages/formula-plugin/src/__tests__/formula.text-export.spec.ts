import type { Column, SlickGrid } from '@slickgrid-universal/common';
import { describe, expect, it } from 'vitest';
import { TextExportService } from '../../../text-export/src/textExport.service.js';
import { FormulaService } from '../formula.service.js';

describe('formula text export', () => {
  it('exports evaluated values with formatters for grouped and ungrouped rows', () => {
    const items = [
      { id: 'a', price: 2, total: '=A1*3' },
      { id: 'b', price: 4, total: '=A2*3' },
    ];
    let columns: Column[] = [
      { id: 'price', field: 'price', name: 'Price' },
      { id: 'total', field: 'total', name: 'Total', allowFormula: true },
    ];
    let grouped = false;
    const dataView = {
      getItems: () => items,
      getGrouping: () => (grouped ? [{}] : []),
      getLength: () => items.length + Number(grouped),
      getItem: (row: number) => (grouped && row === 0 ? { title: 'Group A', level: 0 } : items[row - Number(grouped)]),
      getItemMetadata: () => undefined,
    };
    const grid = {
      getData: () => dataView,
      getOptions: () => ({ enableSelection: true, selectionOptions: { selectionType: 'cell' } }),
      getColumns: () => columns,
      getColumnsInRenderedOrder: () => columns,
      setColumns: (next: Column[]) => (columns = next),
    } as unknown as SlickGrid;
    const formula = new FormulaService({ autoAssignEditor: false });
    formula.init(grid);
    const textExport = new TextExportService();
    textExport.init(grid, { get: () => ({ publish: () => undefined, unsubscribeAll: () => undefined }) } as any);
    (textExport as any)._exportOptions = { exportWithFormatter: true };
    expect((textExport as any).getDataOutput()).toContain('"2","6"\n"4","12"');
    grouped = true;
    const groupedOutput = (textExport as any).getDataOutput();
    expect(groupedOutput).toContain('"Group A"');
    expect(groupedOutput).toContain('"","2","6"\n"","4","12"');
    expect(groupedOutput).not.toContain('=A1*3');
    (textExport as any)._exportOptions = { exportWithFormatter: false };
    expect((textExport as any).getDataOutput()).toContain('=A1*3');
    formula.dispose();
    textExport.dispose();
  });
});
