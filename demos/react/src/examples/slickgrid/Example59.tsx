import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FormulaService, type FormulaCustomFunctionParams, type FormulaStoreSnapshot } from '@slickgrid-universal/formula-plugin';
import { TextExportService } from '@slickgrid-universal/text-export';
import '@slickgrid-universal/formula-plugin/dist/styles/css/slick-formula-salesforce.css';
import React, { useEffect, useState } from 'react';
import {
  Aggregators,
  Editors,
  Formatters,
  GroupTotalFormatters,
  SlickgridReact,
  type Column,
  type ExcelGroupValueParserArgs,
  type Formatter,
  type GridOption,
  type GridState,
  type Grouping,
  type SlickGrid,
  type SlickgridReactInstance,
  type SlickGroupTotals,
} from 'slickgrid-react';
import './Example59.scss';

function createFormulaDemo() {
  interface GroceryItem {
    id: number;
    name: string;
    qty: number;
    price: number;
    taxable: boolean;
    subTotal: number | string;
    taxes: number | string;
    total: number | string;
    customSum?: number | string;
  }
  interface SavedFormulaDemoState {
    gridState: GridState;
    formulas: FormulaStoreSnapshot;
    dataset: GroceryItem[];
  }
  const stateKey = 'example59-formula-state';
  const restoreKey = 'example59-formula-restore';
  const shouldRestore = sessionStorage.getItem(restoreKey) === '1';
  sessionStorage.removeItem(restoreKey);
  const savedText = shouldRestore ? sessionStorage.getItem(stateKey) : null;
  const saved: SavedFormulaDemoState | undefined = savedText ? JSON.parse(savedText) : undefined;
  let taxRate = 7.5;
  let isDarkMode = false;
  let isDataGrouped = false;
  let editorMode = 'formula';

  let headerResetTimer: ReturnType<typeof setTimeout> | undefined;
  let reactGrid: SlickgridReactInstance;

  function customSum({ values }: FormulaCustomFunctionParams): number {
    return values.reduce<number>((total, value) => {
      const number = Number(value);
      return total + (Number.isFinite(number) ? number : 0);
    }, 0);
  }
  const formulaService = new FormulaService({
    customFunctions: { CUSTOMSUM: { func: customSum } },
    excelCustomFunctions: [{ name: 'CUSTOMSUM', args: ['values'], body: 'SUM(values)' }],
  });
  const excelExportService = new ExcelExportService();
  const textExportService = new TextExportService();
  const fallbackFormulaService = new FormulaService();
  const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid: SlickGrid) => {
    const options = grid.getOptions();
    const editable =
      options.editable && !!(columnDef.editor || columnDef.editorClass || (columnDef.allowFormula && options.enableFormulas));
    value = value === null || value === undefined ? '' : value;
    const elm = document.createElement('div');
    elm.className = 'editing-field';
    if (value instanceof HTMLElement) {
      elm.appendChild(value);
    } else {
      elm.textContent = value;
    }
    return editable ? elm : value;
  };
  const columns: Column<GroceryItem>[] = [
    {
      id: 'sel',
      name: '#',
      field: 'id',
      headerCssClass: 'header-centered',
      cssClass: 'cell-unselectable',
      excludeFromExport: true,
      maxWidth: 30,
    },
    {
      id: 'name',
      name: 'Name',
      field: 'name',
      sortable: true,
      width: 140,
      filterable: true,
      excelExportOptions: { width: 18 },
    },
    {
      id: 'price',
      name: 'Price',
      field: 'price',
      type: 'number',
      editor: { model: Editors.float, decimal: 2 },
      sortable: true,
      width: 70,
      filterable: true,
      formatter: Formatters.dollar,
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
      groupTotalsExcelExportOptions: {
        style: {
          font: { bold: true, size: 11.5 },
          format: '$0.00',
          border: { top: { color: 'FF747474', style: 'thick' } },
        },
        valueParserCallback: excelGroupCellParser,
      },
    },
    {
      id: 'qty',
      name: 'Quantity',
      field: 'qty',
      type: 'number',
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsBold,
      groupTotalsExcelExportOptions: {
        style: {
          font: { bold: true, size: 11.5 },
          border: { top: { color: 'FF747474', style: 'thick' } },
        },
        valueParserCallback: excelGroupCellParser,
      },
      params: { minDecimal: 0, maxDecimal: 0 },
      editor: { model: Editors.integer },
      sortable: true,
      width: 60,
      filterable: true,
    },
    {
      id: 'subTotal',
      name: 'Sub-Total',
      field: 'subTotal',
      cssClass: 'text-sub-total',
      type: 'number',
      sortable: true,
      width: 120,
      filterable: true,
      allowFormula: true,
      formatter: Formatters.dollar,
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
      excelExportOptions: {
        style: {
          font: { outline: false, italic: true, color: 'FF215073' },
          format: '$0.00',
        },
        width: 12,
      },
      groupTotalsExcelExportOptions: {
        style: {
          font: { bold: true, italic: true, size: 11.5 },
          format: '$0.00',
          border: { top: { color: 'FF747474', style: 'thick' } },
        },
        valueParserCallback: excelGroupCellParser,
      },
    },
    {
      id: 'taxable',
      name: 'Taxable',
      field: 'taxable',
      cssClass: 'text-center',
      sortable: true,
      width: 60,
      filterable: true,
      // Important: export raw boolean values for formula interoperability in Excel.
      // If formatter output is exported (checkmark/icon/string), IF(Fx=TRUE, ...) formulas evaluate incorrectly.
      exportWithFormatter: false,
      formatter: Formatters.checkmarkMaterial,
      excelExportOptions: {
        style: {
          alignment: { horizontal: 'center' },
        },
        valueParserCallback: (val, { excelFormatId }) => ({
          value: String(val).toLowerCase() === 'true',
          metadata: { style: excelFormatId },
        }),
      },
    },
    {
      id: 'taxes',
      name: 'Taxes',
      field: 'taxes',
      cssClass: 'text-taxes',
      type: 'number',
      sortable: true,
      width: 90,
      filterable: true,
      allowFormula: true,
      formatter: Formatters.dollar,
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
      excelExportOptions: {
        style: {
          font: { outline: false, italic: true, color: 'FFC65911' },
          format: '$0.00',
        },
        width: 12,
      },
      groupTotalsExcelExportOptions: {
        style: {
          font: { bold: true, italic: true, color: 'FFC65911', size: 11.5 },
          format: '$0.00',
          border: { top: { color: 'FF747474', style: 'thick' } },
        },
        valueParserCallback: excelGroupCellParser,
      },
    },
    {
      id: 'total',
      name: 'Total',
      field: 'total',
      type: 'number',
      sortable: true,
      width: 90,
      filterable: true,
      cssClass: 'text-total',
      allowFormula: true,
      formatter: Formatters.dollar,
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
      excelExportOptions: {
        style: {
          font: { outline: false, bold: true, color: 'FF005A9E' },
          format: '$0.00',
        },
        width: 12,
      },
      groupTotalsExcelExportOptions: {
        style: {
          font: { bold: true, color: 'FF005A9E', size: 12 },
          format: '$0.00',
          border: { top: { color: 'FF747474', style: 'thick' } },
        },
        valueParserCallback: excelGroupCellParser,
      },
    },
    {
      id: 'customSum',
      name: 'Custom Sum',
      field: 'customSum',
      type: 'number',
      sortable: true,
      width: 115,
      filterable: true,
      cssClass: 'text-total',
      allowFormula: true,
      formatter: Formatters.dollar,
      excelExportOptions: {
        style: {
          font: { outline: false, bold: true, color: 'FF6A1B9A' },
          format: '$0.00',
        },
        width: 14,
      },
    },
  ];

  const gridOptions: GridOption = {
    autoAddCustomEditorFormatter: customEditableInputFormatter,
    darkMode: isDarkMode,
    gridHeight: 470,
    gridWidth: 1080,
    enableCellNavigation: true,
    autoEdit: false,
    autoCommitEdit: true,
    editable: true,
    rowHeight: 38,
    formatterOptions: {
      maxDecimal: 2,
      minDecimal: 2,
    },
    enableGrouping: true,
    enableFormulas: true,
    enableExcelExport: true,
    enableTextExport: true,
    externalResources: [excelExportService, textExportService, formulaService],
    excelExportOptions: {
      filename: 'grocery-list-formula-service',
      sanitizeDataExport: true,
      sheetName: 'Grocery List Formula Editor',
      columnHeaderStyle: {
        font: { color: 'FFFFFFFF' },
        fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4a6c91' },
      },
      customExcelHeader: (workbook, sheet) => {
        const excelFormat = workbook.getStyleSheet().createFormat({
          font: { size: 18, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
          alignment: { wrapText: true, horizontal: 'center' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF203764' },
        });
        sheet.setRowInstructions(0, { height: 40 });

        const customTitle = 'Grocery Shopping List (Formula Editor)';
        const lastCellMerge = isDataGrouped ? 'I1' : 'H1';
        sheet.mergeCells('A1', lastCellMerge);
        sheet.data.push([{ value: customTitle, metadata: { style: excelFormat.id } }]);
      },
    },
    enableSelection: true,
    selectionOptions: {
      selectionType: 'mixed',
    },
  };
  function excelGroupCellParser(totals: SlickGroupTotals, { columnDef, excelFormatId, dataRowIdx }: ExcelGroupValueParserArgs) {
    const colOffset = 0;
    const rowOffset = 3;
    const priceIdx = reactGrid?.slickGrid?.getColumnIndex('price') || 0;
    const qtyIdx = reactGrid?.slickGrid?.getColumnIndex('qty') || 0;
    const taxesIdx = reactGrid?.slickGrid?.getColumnIndex('taxes') || 0;
    const subTotalIdx = reactGrid?.slickGrid?.getColumnIndex('subTotal') || 0;
    const totalIdx = reactGrid?.slickGrid?.getColumnIndex('total') || 0;
    const groupItemCount = totals?.group?.count || 0;

    const excelPriceCol = `${String.fromCharCode('A'.charCodeAt(0) + priceIdx - colOffset)}`;
    const excelQtyCol = `${String.fromCharCode('A'.charCodeAt(0) + qtyIdx - colOffset)}`;
    const excelSubTotalCol = `${String.fromCharCode('A'.charCodeAt(0) + subTotalIdx - colOffset)}`;
    const excelTaxesCol = `${String.fromCharCode('A'.charCodeAt(0) + taxesIdx - colOffset)}`;
    const excelTotalCol = `${String.fromCharCode('A'.charCodeAt(0) + totalIdx - colOffset)}`;

    let excelCol = '';
    switch (columnDef.id) {
      case 'price':
        excelCol = excelPriceCol;
        break;
      case 'qty':
        excelCol = excelQtyCol;
        break;
      case 'subTotal':
        excelCol = excelSubTotalCol;
        break;
      case 'taxes':
        excelCol = excelTaxesCol;
        break;
      case 'total':
        excelCol = excelTotalCol;
        break;
    }
    return {
      value: `SUM(${excelCol}${dataRowIdx + rowOffset - groupItemCount}:${excelCol}${dataRowIdx + rowOffset - 1})`,
      metadata: { type: 'formula', style: excelFormatId },
    };
  }

  function createDataset() {
    const rows: Array<[string, number, number, boolean]> = [
      ['Oranges', 2.22, 4, false],
      ['Apples', 1.55, 3, false],
      ['Honeycomb Cereals', 4.55, 2, true],
      ['Raisins', 0.23, 77, false],
      ['Corn Flake Cereals', 6.62, 1, true],
      ['Tomatoes', 1.88, 3, false],
      ['Butter', 3.33, 1, false],
      ['BBQ Chicken', 12.33, 1, false],
      ['Chicken Wings', 0.53, 12, true],
      ['Drinkable Yogurt', 1.22, 6, true],
      ['Milk', 3.11, 3, true],
    ];
    return rows.map(([name, price, qty, taxable], index) => {
      const row = index + 1;
      return {
        id: row,
        name,
        price,
        qty,
        taxable,
        subTotal: `=C${row}*D${row}`,
        taxes: `=IF(F${row}=TRUE,E${row}*0.075,0)`,
        total: `=E${row}+G${row}`,
        customSum: `=CUSTOMSUM(C${row}:D${row})`,
      };
    });
  }

  const dataset: GroceryItem[] = saved?.dataset ?? createDataset();
  if (saved) {
    gridOptions.presets = saved.gridState;
  }

  const fallbackColumns: Column[] = [
    { id: 'value', name: 'Value', field: 'value', width: 150 },
    { id: 'total', name: 'Formula', field: 'total', width: 200, allowFormula: true },
  ];
  const fallbackDataset = [
    { id: 1, value: 2, total: '=SUM(A1:A3)' },
    { id: 2, value: 3, total: '' },
    { id: 3, value: 4, total: '' },
  ];
  const fallbackOptions: GridOption = {
    autoEdit: false,
    editable: true,
    enableCellNavigation: true,
    enableFormulas: true,
    enableSelection: false,
    externalResources: [fallbackFormulaService],
    gridHeight: 180,
    gridWidth: 400,
  };

  function invalidateAll() {
    reactGrid?.dataView?.refresh();
    reactGrid?.slickGrid?.invalidate();
    reactGrid?.slickGrid?.render();
  }
  function reactGridReady(instance: SlickgridReactInstance) {
    reactGrid = instance;
    if (saved) {
      formulaService.setFormulaStoreSnapshot(saved.formulas);
    } else {
      formulaService.syncFormulasFromDataset();
    }
    invalidateAll();
  }
  function fallbackGridReady(instance: SlickgridReactInstance) {
    fallbackFormulaService.syncFormulasFromDataset();
    instance.slickGrid?.invalidate();
    instance.slickGrid?.render();
  }
  function beforeEdit(event: Event, args: { column?: Column<GroceryItem> }) {
    clearTimeout(headerResetTimer);
    if (args.column?.id === 'subTotal' && editorMode === 'readonly') {
      event.preventDefault();
      return;
    }
    if (args.column?.allowFormula) {
      formulaService.enableExcelHeaderPrefix();
    } else {
      formulaService.clearFormulaReferenceHighlights();
      formulaService.disableExcelHeaderPrefix();
    }
  }
  function beforeEditorDestroy() {
    formulaService.clearFormulaReferenceHighlights();
    clearTimeout(headerResetTimer);
    headerResetTimer = setTimeout(() => formulaService.disableExcelHeaderPrefix(), 0);
  }
  function cellChanged() {
    formulaService.clearFormulaReferenceHighlights();
    formulaService.disableExcelHeaderPrefix();
    invalidateAll();
  }
  function cellClicked(args: { cell?: number }) {
    const column = args.cell === undefined ? undefined : reactGrid?.slickGrid?.getColumns()[args.cell];
    if (!column?.allowFormula) {
      formulaService.clearFormulaReferenceHighlights();
      formulaService.disableExcelHeaderPrefix();
    }
  }
  function setSubTotalEditorMode() {
    const original = columns.find((column) => column.id === 'subTotal');
    if (!original || !reactGrid?.slickGrid) {
      return;
    }
    const textEditor = editorMode === 'text' ? Editors.text : undefined;
    reactGrid.slickGrid.setColumns(
      reactGrid.slickGrid.getColumns().map((column) =>
        column.id === 'subTotal'
          ? {
              ...column,
              formatter: original.formatter,
              params: original.params,
              editor: textEditor ? { model: textEditor } : original.editor,
              editorClass: textEditor,
            }
          : column
      )
    );
    invalidateAll();
  }
  function loadDefaultFormulas() {
    const items = (reactGrid?.dataView?.getItems() as GroceryItem[] | undefined) ?? dataset;
    items.forEach((item, index) => {
      const row = index + 1;
      item.subTotal = `=C${row}*D${row}`;
      item.taxes = `=IF(F${row}=TRUE,E${row}*${taxRate / 100},0)`;
      item.total = `=E${row}+G${row}`;
      item.customSum = `=CUSTOMSUM(C${row}:D${row})`;
    });
    formulaService.syncFormulasFromDataset();
  }
  function updateTaxRate() {
    if (isDataGrouped) {
      groupByTaxable();
    }
    loadDefaultFormulas();
    invalidateAll();
  }
  function groupByTaxable() {
    isDataGrouped = true;
    reactGrid?.dataView?.setGrouping({
      getter: 'taxable',
      formatter: (group) =>
        `Taxable: <span class="mdi ${group.value ? 'mdi-check-box-outline' : 'mdi-checkbox-blank-outline'}"></span> <span>(${group.count} items)</span>`,
      comparer: (a, b) => Number(b.value) - Number(a.value),
      aggregators: [
        new Aggregators.Sum('price'),
        new Aggregators.Sum('qty'),
        formulaService.createGroupingAggregator(new Aggregators.Sum('subTotal')),
        formulaService.createGroupingAggregator(new Aggregators.Sum('taxes')),
        formulaService.createGroupingAggregator(new Aggregators.Sum('total')),
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: false,
    } as Grouping);
    reactGrid?.dataView?.refresh();
  }
  function clearGrouping() {
    isDataGrouped = false;
    reactGrid?.dataView?.setGrouping([]);
    formulaService.disableExcelHeaderPrefix();
  }
  function saveGridAndFormulas() {
    const state: SavedFormulaDemoState = {
      gridState: reactGrid.gridStateService.getCurrentGridState(true),
      formulas: formulaService.getFormulaStoreSnapshot(),
      dataset: (reactGrid.dataView?.getItems() as GroceryItem[] | undefined) ?? dataset,
    };
    sessionStorage.setItem(stateKey, JSON.stringify(state));
  }
  function restoreGridAndFormulas() {
    if (sessionStorage.getItem(stateKey)) {
      sessionStorage.setItem(restoreKey, '1');
      location.reload();
    }
  }
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', isDarkMode);
    reactGrid?.slickGrid?.setOptions({ darkMode: isDarkMode });
  }
  function exportCsv() {
    textExportService.exportToFile({
      filename: 'grocery-formula-values',
      format: 'csv',
      exportWithFormatter: true,
      sanitizeDataExport: true,
    });
  }
  async function exportPortable() {
    const items = (reactGrid.dataView?.getItems() as GroceryItem[] | undefined) ?? dataset;
    const backups = new Map<number, string>();
    for (const item of items) {
      const formula = formulaService.getFormula(item.id, 'customSum');
      if (typeof formula !== 'string' || !formula.toUpperCase().includes('CUSTOMSUM(')) {
        continue;
      }
      const value = formulaService.getEvaluatedCellValue(item.id, 'customSum', item.customSum, item.customSum);
      backups.set(item.id, formula);
      item.customSum = value as number | string;
      formulaService.removeFormula(item.id, 'customSum');
    }
    try {
      await excelExportService.exportToExcel();
    } finally {
      for (const item of items) {
        const formula = backups.get(item.id);
        if (formula) {
          item.customSum = formula;
          formulaService.setFormula(item.id, 'customSum', formula);
        }
      }
      if (backups.size) {
        invalidateAll();
      }
    }
  }
  function registerCustomSum() {
    formulaService.registerCustomFunction('CUSTOMSUM', { func: customSum });
  }
  function removeCustomSum() {
    formulaService.unregisterCustomFunction('CUSTOMSUM');
  }

  function dispose() {
    clearTimeout(headerResetTimer);
    document.body.setAttribute('data-theme', 'light');
    document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
  }
  return {
    columns,
    gridOptions,
    dataset,
    fallbackColumns,
    fallbackOptions,
    fallbackDataset,
    formulaService,
    excelExportService,
    reactGridReady,
    fallbackGridReady,
    beforeEdit,
    beforeEditorDestroy,
    cellChanged,
    cellClicked,
    loadDefaultFormulas,
    updateTaxRate,
    groupByTaxable,
    clearGrouping,
    saveGridAndFormulas,
    restoreGridAndFormulas,
    toggleDarkMode,
    exportCsv,
    exportPortable,
    registerCustomSum,
    removeCustomSum,
    dispose,
    setTaxRate: (value: number) => {
      taxRate = value;
    },
    setEditorMode: (value: string) => {
      editorMode = value;
      setSubTotalEditorMode();
    },
  };
}

const Example59: React.FC = () => {
  const [demo] = useState(createFormulaDemo);
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => () => demo.dispose(), [demo]);
  return (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 59: Formula Editor{' '}
        <button className="btn btn-outline-secondary btn-sm" data-test="toggle-dark-mode" onClick={demo.toggleDarkMode}>
          Toggle Light/Dark
        </button>
      </h2>
      <p>Edit a formula cell to use reference picking, colored highlights, autocomplete and drag-fill.</p>
      <div className="mb-2">
        <button
          className="btn btn-outline-secondary btn-sm me-1"
          data-test="export-excel-btn"
          onClick={() => demo.excelExportService.exportToExcel()}
        >
          Export to Excel
        </button>
        <button
          className="btn btn-outline-secondary btn-sm me-1"
          data-test="export-excel-hidden-btn"
          onClick={() => demo.excelExportService.exportToExcel({ includeHidden: true })}
        >
          Export Including Hidden Columns
        </button>
        <button className="btn btn-outline-secondary btn-sm me-1" data-test="export-csv-btn" onClick={demo.exportCsv}>
          Export CSV Values
        </button>
        <button className="btn btn-outline-secondary btn-sm me-1" data-test="export-excel-portable-btn" onClick={demo.exportPortable}>
          Export Portable Values
        </button>
        <button className="btn btn-outline-secondary btn-sm me-1" data-test="group-by-btn" onClick={demo.groupByTaxable}>
          Group by Taxable
        </button>
        <button className="btn btn-outline-secondary btn-sm me-1" data-test="clear-grouping-btn" onClick={demo.clearGrouping}>
          Clear grouping
        </button>
        <button className="btn btn-outline-secondary btn-sm me-1" data-test="reload-formulas-btn" onClick={demo.loadDefaultFormulas}>
          Load Default Formulas
        </button>
        <button
          className="btn btn-outline-secondary btn-sm me-1"
          data-test="clear-formulas-btn"
          onClick={() => demo.formulaService.clearFormulas()}
        >
          Clear Formula Store
        </button>
        <button className="btn btn-outline-secondary btn-sm me-1" data-test="register-customsum-btn" onClick={demo.registerCustomSum}>
          Register CUSTOMSUM
        </button>
        <button className="btn btn-outline-secondary btn-sm me-1" data-test="remove-customsum-btn" onClick={demo.removeCustomSum}>
          Remove CUSTOMSUM
        </button>
        <button className="btn btn-outline-secondary btn-sm me-1" data-test="save-formula-state-btn" onClick={demo.saveGridAndFormulas}>
          Save Grid and Formulas
        </button>
        <button
          className="btn btn-outline-secondary btn-sm me-1"
          data-test="restore-formula-state-btn"
          onClick={demo.restoreGridAndFormulas}
        >
          Restore Grid and Formulas
        </button>
        <label>
          Tax Rate (%):{' '}
          <input
            type="number"
            step="0.25"
            defaultValue={7.5}
            data-test="taxrate"
            onChange={(event) => demo.setTaxRate(Number(event.target.value))}
          />
        </label>
        <button className="btn btn-outline-secondary btn-sm" data-test="update-btn" onClick={demo.updateTaxRate}>
          Update
        </button>
      </div>
      <div className="mb-2">
        <label>
          Sub-Total editor:{' '}
          <select defaultValue="formula" data-test="formula-editor-mode" onChange={(event) => demo.setEditorMode(event.target.value)}>
            <option value="formula">Formula editor</option>
            <option value="text">Text editor</option>
            <option value="readonly">Read-only</option>
          </select>
        </label>
      </div>
      <div className="grid59">
        <SlickgridReact
          gridId="grid59"
          columns={demo.columns}
          options={demo.gridOptions}
          dataset={demo.dataset}
          onReactGridCreated={(event) => demo.reactGridReady(event.detail)}
          onBeforeEditCell={(event) => demo.beforeEdit(event.detail.eventData, event.detail.args)}
          onBeforeCellEditorDestroy={demo.beforeEditorDestroy}
          onCellChange={demo.cellChanged}
          onClick={(event) => demo.cellClicked(event.detail.args)}
        />
      </div>
      <section className="mt-4">
        <button className="btn btn-outline-secondary btn-sm" data-test="show-selection-fallback-btn" onClick={() => setShowFallback(true)}>
          Show formula grid without selection
        </button>
        <div className="formula-fallback-grid">
          {showFallback && (
            <SlickgridReact
              gridId="formula-fallback"
              columns={demo.fallbackColumns}
              options={demo.fallbackOptions}
              dataset={demo.fallbackDataset}
              onReactGridCreated={(event) => demo.fallbackGridReady(event.detail)}
            />
          )}
        </div>
      </section>
    </div>
  );
};
export default Example59;
