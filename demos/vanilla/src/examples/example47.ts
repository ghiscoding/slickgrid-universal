import { BindingEventService } from '@slickgrid-universal/binding';
import {
  Aggregators,
  Editors,
  Formatters,
  GroupTotalFormatters,
  type Aggregator,
  type Column,
  type ExcelGroupValueParserArgs,
  type Formatter,
  type GridOption,
  type Grouping,
  type SlickGrid,
  type SlickGroupTotals,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FormulaService } from '@slickgrid-universal/formula-plugin';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example47.scss';

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

/** Check if the current item (cell) is editable or not */
function checkItemIsEditable(_dataContext: GroceryItem, columnDef: Column, grid: SlickGrid) {
  const gridOptions = grid.getOptions();
  // Formula editor can be auto-wired by FormulaService; detect both pre/post wiring states.
  const hasEditor = !!(columnDef.editor || columnDef.editorClass || (columnDef.allowFormula && gridOptions.enableFormulas));
  const isGridEditable = gridOptions.editable;
  const isEditable = isGridEditable && hasEditor;

  return isEditable;
}

const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef, dataContext: GroceryItem, grid) => {
  const isEditableItem = checkItemIsEditable(dataContext, columnDef, grid);
  value = value === null || value === undefined ? '' : value;
  const divElm = document.createElement('div');
  divElm.className = 'editing-field';
  if (value instanceof HTMLElement) {
    divElm.appendChild(value);
  } else {
    divElm.textContent = value;
  }
  return isEditableItem ? divElm : value;
};

/** Create a Custom Aggregator in order to calculate all Totals by accessing other fields of the item dataContext */
export class CustomSumAggregator implements Aggregator {
  private _sum = 0;
  private _type = 'sum' as const;

  constructor(
    public readonly field: number | string,
    public taxRate: number
  ) {}

  get type(): string {
    return this._type;
  }

  init() {
    this._sum = 0;
  }

  accumulate(item: GroceryItem) {
    if (this.field === 'taxes' && item.taxable) {
      this._sum += item.price * item.qty * (this.taxRate / 100);
    }
    if (this.field === 'subTotal') {
      this._sum += item.price * item.qty;
    }
    if (this.field === 'total') {
      let taxes = 0;
      if (item.taxable) {
        taxes = item.price * item.qty * (this.taxRate / 100);
      }
      this._sum += item.price * item.qty + taxes;
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this.field] = this._sum;
  }
}

export default class Example47 {
  private _bindingEventService: BindingEventService;
  private _darkMode = false;
  private _headerPrefixResetTimer?: ReturnType<typeof setTimeout>;
  columns: Column<GroceryItem>[] = [];
  dataset: GroceryItem[] = [];
  gridOptions!: GridOption;
  gridContainerElm!: HTMLDivElement;
  sgb!: SlickVanillaGridBundle;
  excelExportService: ExcelExportService;
  formulaService: FormulaService;
  isDataGrouped = false;
  taxRate = 7.5;
  lastFormulaEvent = 'none';

  constructor() {
    this.excelExportService = new ExcelExportService();
    this.formulaService = new FormulaService({
      editorParams: { debug: true },
      excelCustomFunctions: [{ name: 'CUSTOMSUM', args: ['values'], body: 'SUM(values)' }],
      customFunctions: {
        CUSTOMSUM: {
          func: (params) => {
            let total = 0;
            for (const value of params.values) {
              const num = Number(value);
              total += Number.isFinite(num) ? num : 0;
            }
            return total;
          },
        },
      },
    });
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.defineGrid();
    this.dataset = this.getData();
    this.gridContainerElm = document.querySelector<HTMLDivElement>('.grid47') as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(this.gridContainerElm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);

    this._bindingEventService.bind(this.gridContainerElm, 'onbeforeeditcell', this.handleOnBeforeEditCell.bind(this));
    this._bindingEventService.bind(this.gridContainerElm, 'onbeforecelleditordestroy', this.handleOnBeforeCellEditorDestroy.bind(this));
    this._bindingEventService.bind(this.gridContainerElm, 'oncellchange', this.handleOnCellChange.bind(this));
    this._bindingEventService.bind(this.gridContainerElm, 'onclick', this.handleOnCellClicked.bind(this));
    this.loadDefaultFormulas();
    this.invalidateAll();
    document.body.classList.add('salesforce-theme');
  }

  dispose() {
    clearTimeout(this._headerPrefixResetTimer);
    this.formulaService.clearFormulaReferenceHighlights();
    this.formulaService.disableExcelHeaderPrefix();
    this._bindingEventService.unbindAll();
    this.sgb?.dispose();
    this.gridContainerElm?.remove();
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
    document.body.setAttribute('data-theme', 'light');
    document.body.classList.remove('salesforce-theme');
  }

  defineGrid() {
    this.columns = [
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
          valueParserCallback: this.excelGroupCellParser.bind(this),
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
          valueParserCallback: this.excelGroupCellParser.bind(this),
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
        width: 90,
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
          valueParserCallback: this.excelGroupCellParser.bind(this),
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
          valueParserCallback: this.excelGroupCellParser.bind(this),
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
          valueParserCallback: this.excelGroupCellParser.bind(this),
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

    this.gridOptions = {
      autoAddCustomEditorFormatter: customEditableInputFormatter,
      darkMode: this._darkMode,
      gridHeight: 470,
      gridWidth: 830,
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      rowHeight: 38,
      formatterOptions: {
        maxDecimal: 2,
        minDecimal: 2,
      },

      // column reorder and visibility will probably fail, let's disable for now
      enableColumnReorder: false,
      enableColumnPicker: false,
      enableGridMenu: false,
      enableHeaderMenu: false,

      enableGrouping: true,
      enableFormulas: true,
      enableExcelExport: true,
      externalResources: [this.excelExportService, this.formulaService],
      excelExportOptions: {
        filename: 'grocery-list-formula-service',
        sanitizeDataExport: true,
        sheetName: 'Grocery List Formula Service',
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

          const customTitle = 'Grocery Shopping List (Formula Service)';
          const lastCellMerge = this.isDataGrouped ? 'I1' : 'H1';
          sheet.mergeCells('A1', lastCellMerge);
          sheet.data.push([{ value: customTitle, metadata: { style: excelFormat.id } }]);
        },
      },
      enableSelection: true,
      selectionOptions: {
        selectionType: 'mixed',
      },
    };
  }

  handleOnCellChange(event: any) {
    const args = event?.detail?.args;
    const columnDef = args?.column as Column<GroceryItem> | undefined;
    if (!columnDef?.allowFormula) {
      this.invalidateAll();
      return;
    }

    const item = args.item as GroceryItem;
    const rowId = item?.id;
    const columnId = String(columnDef.id);
    const value = item?.[columnId as keyof GroceryItem] as string | number | undefined;

    if (typeof value === 'string' && value.trim().startsWith('=')) {
      this.formulaService.setFormula(rowId, columnId, value.trim());
      this.lastFormulaEvent = `saved formula for row ${rowId}, column ${columnId}`;
    } else if (typeof value === 'string' && value.trim() === '') {
      this.formulaService.removeFormula(rowId, columnId);
      this.lastFormulaEvent = `removed formula for row ${rowId}, column ${columnId}`;
    } else {
      // If user replaces a formula with a plain value, clear stale formula from store.
      this.formulaService.removeFormula(rowId, columnId);
      this.lastFormulaEvent = `set static value for row ${rowId}, column ${columnId}`;
    }

    this.formulaService.clearFormulaReferenceHighlights();
    this.formulaService.disableExcelHeaderPrefix();
    this.invalidateAll();
  }

  handleOnBeforeEditCell(event: any) {
    // Cancel pending deferred header reset from a previous editor destroy.
    // Otherwise the delayed setColumns() can run after a new editor opens and close it immediately.
    clearTimeout(this._headerPrefixResetTimer);

    const args = event?.detail?.args;
    const columnDef = args?.column as Column<GroceryItem> | undefined;
    const item = args?.item as GroceryItem | undefined;

    if (columnDef?.allowFormula) {
      this.formulaService.enableExcelHeaderPrefix();
      const value = item?.[String(columnDef.id) as keyof GroceryItem];
      const formula = typeof value === 'string' ? value : this.formulaService.getFormula(item?.id as number, String(columnDef.id));
      this.formulaService.renderFormulaReferenceHighlights(formula);
      this.lastFormulaEvent = `formula edit mode enabled (${String(columnDef.id)})`;
    } else {
      this.formulaService.clearFormulaReferenceHighlights();
      this.formulaService.disableExcelHeaderPrefix();
    }

    return true;
  }

  handleOnCellClicked(event: any) {
    const args = event?.detail?.args;
    const columnDef = args?.column as Column<GroceryItem> | undefined;

    if (!columnDef?.allowFormula) {
      this.formulaService.clearFormulaReferenceHighlights();
      this.formulaService.disableExcelHeaderPrefix();
    }
  }

  handleOnBeforeCellEditorDestroy() {
    // Avoid calling setColumns() synchronously during editor teardown (ESC path),
    // it can re-enter makeActiveCellNormal and recurse.
    this.formulaService.clearFormulaReferenceHighlights();
    clearTimeout(this._headerPrefixResetTimer);
    this._headerPrefixResetTimer = setTimeout(() => this.formulaService.disableExcelHeaderPrefix(), 0);
  }

  invalidateAll() {
    this.sgb.dataView?.refresh();
    this.sgb.slickGrid?.invalidate();
    this.sgb.slickGrid?.render();
  }

  updateTaxRate() {
    if (this.isDataGrouped) {
      this.groupByTaxable();
    }

    this.loadDefaultFormulas();
    this.invalidateAll();
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    this.toggleBodyBackground();
    this.sgb.gridOptions = { ...this.sgb.gridOptions, darkMode: this._darkMode };
    this.sgb.slickGrid?.setOptions({ darkMode: this._darkMode });
  }

  toggleBodyBackground() {
    if (this._darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.querySelector('.demo-container')?.classList.add('dark-mode');
    } else {
      document.body.setAttribute('data-theme', 'light');
      document.querySelector('.demo-container')?.classList.remove('dark-mode');
    }
  }

  exportToExcel() {
    this.excelExportService.exportToExcel();
  }

  async exportToExcelPortable() {
    const customFunctionColumnId = 'customSum';
    const liveItems = (this.sgb?.dataView?.getItems?.() as GroceryItem[] | undefined) || this.dataset;
    const formulaBackups = new Map<number, string>();

    for (const item of liveItems) {
      const rowId = item.id;
      const formula = this.formulaService.getFormula(rowId, customFunctionColumnId);
      if (typeof formula !== 'string' || !formula.toUpperCase().includes('CUSTOMSUM(')) {
        continue;
      }

      const evaluated = this.formulaService.getEvaluatedCellValue(rowId, customFunctionColumnId, item.customSum, item.customSum);
      formulaBackups.set(rowId, formula);
      item.customSum = evaluated as number | string;
      this.formulaService.removeFormula(rowId, customFunctionColumnId);
    }

    try {
      this.lastFormulaEvent = 'portable export mode (CUSTOMSUM values precomputed)';
      await this.excelExportService.exportToExcel();
    } finally {
      for (const item of liveItems) {
        const formula = formulaBackups.get(item.id);
        if (!formula) {
          continue;
        }
        item.customSum = formula;
        this.formulaService.setFormula(item.id, customFunctionColumnId, formula);
      }
      if (formulaBackups.size > 0) {
        this.invalidateAll();
      }
    }
  }

  clearAllFormulas() {
    this.formulaService.clearFormulas();
    this.lastFormulaEvent = 'formula store cleared';
  }

  loadDefaultFormulas() {
    const liveItems = (this.sgb?.dataView?.getItems?.() as GroceryItem[] | undefined) || this.dataset;

    liveItems.forEach((item, rowIdx) => {
      // Grid includes all columns (#, Name, Price, Qty, Sub-Total, Taxable, Taxes, Total, Custom Sum)
      // which maps to Excel-like references A..I in this demo.
      const excelRowIdx = rowIdx + 1;

      // Approach 1 (Direct Excel-like A1 references)
      const subTotalFormula = `=C${excelRowIdx}*D${excelRowIdx}`;
      const taxesFormula = `=IF(F${excelRowIdx}=TRUE,E${excelRowIdx}*${this.taxRate / 100},0)`;
      const totalFormula = `=E${excelRowIdx}+G${excelRowIdx}`;
      const customSumFormula = `=CUSTOMSUM(C${excelRowIdx}:D${excelRowIdx})`;

      // Approach 2 (Dynamic REF/COLUMN/ROW references like AG-Grid)
      // const subTotalFormula = `=REF(COLUMN("price"),ROW(${excelRowIdx}))*REF(COLUMN("qty"),ROW(${excelRowIdx}))`;
      // const taxesFormula = `=IF(REF(COLUMN("taxable"),ROW(${excelRowIdx}))=TRUE,REF(COLUMN("subTotal"),ROW(${excelRowIdx}))*${
      //   this.taxRate / 100
      // },0)`;
      // const totalFormula = `=REF(COLUMN("subTotal"),ROW(${excelRowIdx}))+REF(COLUMN("taxes"),ROW(${excelRowIdx}))`;
      // const customSumFormula = `=CUSTOMSUM(REF(COLUMN("price"),ROW(${excelRowIdx})):REF(COLUMN("qty"),ROW(${excelRowIdx})))`;

      // keep values in dataset so opening a formula cell editor shows formula text directly.
      item.subTotal = subTotalFormula;
      item.taxes = taxesFormula;
      item.total = totalFormula;
      item.customSum = customSumFormula;
    });

    this.formulaService.syncFormulasFromDataset();

    this.lastFormulaEvent = `loaded default formulas for ${liveItems.length} rows`;
  }

  excelGroupCellParser(totals: SlickGroupTotals, { columnDef, excelFormatId, dataRowIdx }: ExcelGroupValueParserArgs) {
    const colOffset = 0;
    const rowOffset = 3;
    const priceIdx = this.sgb.slickGrid?.getColumnIndex('price') || 0;
    const qtyIdx = this.sgb.slickGrid?.getColumnIndex('qty') || 0;
    const taxesIdx = this.sgb.slickGrid?.getColumnIndex('taxes') || 0;
    const subTotalIdx = this.sgb.slickGrid?.getColumnIndex('subTotal') || 0;
    const totalIdx = this.sgb.slickGrid?.getColumnIndex('total') || 0;
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

  getData() {
    let i = 1;
    return [
      { id: i++, name: 'Oranges', qty: 4, taxable: false, price: 2.22 },
      { id: i++, name: 'Apples', qty: 3, taxable: false, price: 1.55 },
      { id: i++, name: 'Honeycomb Cereals', qty: 2, taxable: true, price: 4.55 },
      { id: i++, name: 'Raisins', qty: 77, taxable: false, price: 0.23 },
      { id: i++, name: 'Corn Flake Cereals', qty: 1, taxable: true, price: 6.62 },
      { id: i++, name: 'Tomatoes', qty: 3, taxable: false, price: 1.88 },
      { id: i++, name: 'Butter', qty: 1, taxable: false, price: 3.33 },
      { id: i++, name: 'BBQ Chicken', qty: 1, taxable: false, price: 12.33 },
      { id: i++, name: 'Chicken Wings', qty: 12, taxable: true, price: 0.53 },
      { id: i++, name: 'Drinkable Yogurt', qty: 6, taxable: true, price: 1.22 },
      { id: i++, name: 'Milk', qty: 3, taxable: true, price: 3.11 },
    ] as GroceryItem[];
  }

  clearGrouping() {
    this.isDataGrouped = false;
    this.sgb?.dataView?.setGrouping([]);
    this.formulaService.disableExcelHeaderPrefix();
  }

  groupByTaxable() {
    const checkIcon = 'mdi-check-box-outline';
    const uncheckIcon = 'mdi-checkbox-blank-outline';
    this.isDataGrouped = true;

    this.sgb?.dataView?.setGrouping({
      getter: 'taxable',
      formatter: (g) =>
        `Taxable: <span class="mdi ${g.value ? checkIcon : uncheckIcon} color-se-danger"></span> <span class="color-primary">(${g.count} items)</span>`,
      comparer: (a, b) => b.value - a.value,
      aggregators: [
        new Aggregators.Sum('price'),
        new Aggregators.Sum('qty'),
        new CustomSumAggregator('subTotal', this.taxRate),
        new CustomSumAggregator('taxes', this.taxRate),
        new CustomSumAggregator('total', this.taxRate),
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: false,
    } as Grouping);

    this.sgb?.dataView?.refresh();
  }
}
