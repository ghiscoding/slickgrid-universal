// Research prototype only. It relies on private builder internals and supports flat rows only.
// Do not use this as an implementation of the production Excel exporter.
import { Formatters, SlickDataView } from '@slickgrid-universal/common';
import { createExcelFileStream, Workbook } from 'excel-builder-vanilla';
import { ExcelExportService } from '../../packages/excel-export/src/excelExport.service.js';

class BenchService extends ExcelExportService {
  async setup(lazy: boolean) {
    this._excelExportOptions = { htmlDecode: true };
    this._workbook = new Workbook();
    this._sheet = this._workbook.createWorksheet({ name: 'Benchmark' });
    this._stylesheet = this._workbook.getStyleSheet();
    this._regularCellExcelFormats = Object.create(null);
    this._groupTotalExcelFormats = Object.create(null);
    const boldFormat = this._stylesheet.createFormat({ font: { bold: true } });
    const stringFormat = this._stylesheet.createFormat({ format: '@' });
    const numberFormat = this._stylesheet.createFormat({ format: '0' });
    this._stylesheetFormats = { boldFormat, stringFormat, numberFormat };
    this._sheet.setColumnFormats([boldFormat]);
    if (!lazy) {
      this._sheet.setData(await this.getDataOutputAsync());
    } else {
      const cols = this.getColumns();
      const cache = this.preCalculateColumnMetadata(cols);
      this.cacheRegularCellExcelFormats(cols, cache);
      const header = this.getColumnHeaderData(cols, { style: boldFormat.id });
      const count = this._dataView.getLength();
      const placeholder = Array(cols.length);
      const fakeData = Array(count + 1).fill(placeholder);
      fakeData[0] = header;
      this._sheet.setData(fakeData);
      const sheet = this._sheet as any;
      const dataView = this._dataView;
      const service = this;
      // Prototype only: keep the builder's XML envelope/dimension and existing row serializer.
      // Read each exported row on demand; the placeholder array contains no exported cells.
      sheet.getXmlChunks = function* (size = 32768) {
        const xml = this.createWorksheetDocument(false).toString();
        const marker = xml.indexOf('<sheetData/>');
        if (marker < 0) throw new Error('Missing sheetData marker');
        yield `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml.slice(0, marker)}<sheetData>`;
        let chunk = '';
        chunk += this.serializeRow(header, 0);
        for (let row = 0; row < count; row++) {
          const item = dataView.getItem(row);
          const cells = service.readRegularRowData(cols, row, item, row, cache, row + 2);
          chunk += this.serializeRow(cells, row + 1);
          if (chunk.length >= size) {
            yield chunk;
            chunk = '';
          }
        }
        if (chunk) yield chunk;
        yield `</sheetData>${xml.slice(marker + '<sheetData/>'.length)}`;
      };
    }
    this._sheet.setColumns(this.getColumnStyles(this.getColumns()));
    this._workbook.addWorksheet(this._sheet);
  }
  async serialize() {
    const output: Uint8Array[] = [];
    let size = 0,
      chunks = 0;
    for await (const chunk of createExcelFileStream(this._workbook, { zipOptions: { level: 6 } }) as AsyncIterable<Uint8Array>) {
      output.push(chunk);
      size += chunk.length;
      chunks++;
    }
    const blob = new Blob(output as BlobPart[]);
    if (blob.size !== size) throw new Error('Size mismatch');
    (globalThis as any).benchmarkBlob = blob;
    return { size, chunks };
  }
}
export async function run(rowCount: number, lazy: boolean) {
  const items = Array.from({ length: rowCount }, (_, i) => {
    const month = (i * 7) % 10,
      day = (i * 13) % 29,
      cost = ((i * 83) % 10001) / 100;
    return {
      id: i,
      duration: String((i * 31) % 101),
      start: new Date(2024, month, day),
      finish: i % 3 === 0 ? '' : new Date(2028 + (i % 6), month + 1, day),
      cost: i % 33 === 0 ? -cost : cost,
      percentComplete: (i * 47) % 101,
      effortDriven: i % 5 === 0,
    };
  });
  const columns: any[] = [
    { id: 'duration', field: 'duration', name: 'Duration', type: 'number' },
    { id: 'start', field: 'start', name: 'Start', type: 'date', outputType: 'dateIso', formatter: Formatters.dateIso },
    { id: 'finish', field: 'finish', name: 'Finish', type: 'date', outputType: 'dateIso', formatter: Formatters.dateIso },
    { id: 'cost', field: 'cost', name: 'Cost', type: 'number', formatter: Formatters.dollar, exportWithFormatter: true },
    { id: 'percentComplete', field: 'percentComplete', name: '% Complete', type: 'number' },
    {
      id: 'effortDriven',
      field: 'effortDriven',
      name: 'Effort-Driven',
      exportWithFormatter: false,
      formatter: Formatters.checkmarkMaterial,
    },
  ];
  const options: any = { excelExportOptions: { exportWithFormatter: true }, enableFormattedDataCache: false };
  const dv = new SlickDataView();
  dv.setItems(items);
  (dv as any)._gridOptions = options;
  const grid: any = { getOptions: () => options, getData: () => dv, getColumnsInRenderedOrder: () => columns };
  const service = new BenchService();
  service.init(grid, { get: () => ({ publish() {}, unsubscribeAll() {} }) } as any);
  let maxLag = 0;
  let delaysOver50 = 0;
  let expected = performance.now() + 20;
  const interval = setInterval(() => {
    const now = performance.now();
    const lag = Math.max(0, now - expected);
    maxLag = Math.max(maxLag, lag);
    if (lag > 50) delaysOver50++;
    expected = now + 20;
  }, 20);
  const start = performance.now();
  await service.setup(lazy);
  const prepared = performance.now();
  const output = await service.serialize();
  const end = performance.now();
  clearInterval(interval);
  service.dispose();
  dv.destroy();
  return {
    mode: lazy ? 'incremental' : 'baseline',
    rows: rowCount,
    preparationMs: prepared - start,
    serializationMs: end - prepared,
    totalMs: end - start,
    maxTimerLagMs: maxLag,
    delaysOver50,
    ...output,
  };
}
