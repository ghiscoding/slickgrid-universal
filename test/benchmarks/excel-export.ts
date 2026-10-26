import type { Column, ExcelExportOption, GridOption, SlickGrid } from '@slickgrid-universal/common';
import { createExcelFileStream, Workbook } from 'excel-builder-vanilla';
import { SlickDataView } from '../../packages/common/src/core/slickDataView.js';
import { ExcelExportService } from '../../packages/excel-export/src/excelExport.service.js';

interface BenchmarkResult {
  mode: string;
  preparationMs: number;
  serializationMs: number;
  totalMs: number;
  bytes: number;
  chunks: number;
  rows: number;
  columns: number;
  worksheetChecksum: number;
}

class BenchmarkExportService extends ExcelExportService {
  fingerprint(): number {
    const data = JSON.stringify(this._sheet.data);
    let hash = 2166136261;
    for (let index = 0; index < data.length; index++) {
      hash = Math.imul(hash ^ data.charCodeAt(index), 16777619);
    }
    return hash >>> 0;
  }

  async prepare(options: ExcelExportOption): Promise<void> {
    this._excelExportOptions = options;
    this._workbook = new Workbook();
    this._sheet = this._workbook.createWorksheet({ name: 'Benchmark' });
    this._stylesheet = this._workbook.getStyleSheet();
    this._regularCellExcelFormats = Object.create(null);
    this._stylesheetFormats = { boldFormat: this._stylesheet.createFormat({ font: { bold: true } }) };
    this._sheet.setData(await this.getDataOutputAsync());
    this._workbook.addWorksheet(this._sheet);
  }

  async serialize(chunkSize?: number): Promise<{ bytes: number; chunks: number }> {
    let bytes = 0;
    let chunks = 0;
    const output: Uint8Array[] = [];
    for await (const chunk of createExcelFileStream(this._workbook, { chunkSize }) as AsyncIterable<Uint8Array>) {
      bytes += chunk.length;
      chunks++;
      output.push(chunk);
    }
    // Match the exporter's collection/Blob work without downloading a file.
    const blob = new Blob(output as BlobPart[]);
    if (blob.size !== bytes) {
      throw new Error('Unexpected XLSX output size');
    }
    return { bytes, chunks };
  }
}

/** Deterministic workload; cache construction is deliberately excluded from export timing. */
export async function runBenchmark(rowCount = 5000, columnCount = 20, chunkSize?: number): Promise<BenchmarkResult[]> {
  let formatterCalls = 0;
  const columns: Column[] = Array.from({ length: columnCount }, (_, index) => ({
    id: `c${index}`,
    field: `c${index}`,
    name: `Column ${index}`,
    type: index % 2 ? 'number' : 'string',
    formatter: (_row, _cell, value) => {
      formatterCalls++;
      return String(value);
    },
    exportWithFormatter: true,
  }));
  const items = Array.from({ length: rowCount }, (_, id) => {
    const item: Record<string, string | number> = { id };
    for (let col = 0; col < columnCount; col++) {
      item[`c${col}`] = col % 2 ? id * columnCount + col : `Row ${id} column ${col}`;
    }
    return item;
  });
  const results: BenchmarkResult[] = [];
  let expectedChecksum: number | undefined;
  let formatDetectionCalls = 0;
  for (const mode of ['raw', 'formatter', 'cache']) {
    formatterCalls = 0;
    const gridOptions: GridOption = { enableFormattedDataCache: mode === 'cache' };
    const dataView = new SlickDataView();
    dataView.setItems(items);
    // Supply the options normally wired by SlickGrid, without creating/rendering a UI grid.
    (dataView as any)._gridOptions = gridOptions;
    if (mode === 'cache') {
      // Populate the actual export cache synchronously, outside the measured interval.
      // Avoid including UI cell cache/warmup scheduling in the export comparison.
      const cache = (dataView as any).formattedDataCache;
      for (const item of items) {
        cache[item.id] = Object.fromEntries(columns.map((column) => [column.id, String(item[column.field])]));
      }
    }
    const exportColumns = columns.map((column) => ({ ...column, exportWithFormatter: mode !== 'raw' }));
    const grid = {
      getOptions: () => gridOptions,
      getData: () => dataView,
      getColumnsInRenderedOrder: () => exportColumns,
    } as unknown as SlickGrid;
    const service = new BenchmarkExportService();
    service.init(grid, { get: () => ({ publish() {}, unsubscribeAll() {} }) } as any);
    const start = performance.now();
    await service.prepare({ htmlDecode: true, sanitizeDataExport: true });
    const prepared = performance.now();
    const { bytes, chunks } = await service.serialize(chunkSize);
    const end = performance.now();
    const worksheetChecksum = service.fingerprint();
    expectedChecksum ??= worksheetChecksum;
    if (mode === 'raw') {
      formatDetectionCalls = formatterCalls;
    }
    if (
      worksheetChecksum !== expectedChecksum ||
      formatterCalls !== formatDetectionCalls + (mode === 'formatter' ? rowCount * columnCount : 0)
    ) {
      throw new Error(`Export parity failed: ${JSON.stringify({ mode, worksheetChecksum, expectedChecksum, formatterCalls })}`);
    }
    results.push({
      mode,
      preparationMs: Math.round(prepared - start),
      serializationMs: Math.round(end - prepared),
      totalMs: Math.round(end - start),
      bytes,
      chunks,
      rows: rowCount,
      columns: columnCount,
      worksheetChecksum,
    });
    service.dispose();
    dataView.destroy();
  }
  return results;
}
