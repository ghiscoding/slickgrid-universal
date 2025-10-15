import { ExcelExportService } from '@slickgrid-universal/excel-export';
import React, { useEffect, useRef, useState } from 'react';
import {
  Aggregators,
  Editors,
  Formatters,
  GroupTotalFormatters,
  SlickgridReact,
  type Aggregator,
  type Column,
  type ExcelCellValueParserArgs,
  type ExcelGroupValueParserArgs,
  type Formatter,
  type GridOption,
  type Grouping,
  type SlickGrid,
  type SlickgridReactInstance,
  type SlickGroupTotals,
} from 'slickgrid-react';
import './example36.scss';

interface GroceryItem {
  id: number;
  name: string;
  qty: number;
  price: number;
  taxable: boolean;
  subTotal: number;
  taxes: number;
  total: number;
}

/** Check if the current item (cell) is editable or not */
function checkItemIsEditable(_dataContext: GroceryItem, columnDef: Column, grid: SlickGrid) {
  const gridOptions = grid.getOptions();
  const hasEditor = columnDef.editor;
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
class CustomSumAggregator implements Aggregator {
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
    if (this.field === 'taxes' && item['taxable']) {
      this._sum += item['price'] * item['qty'] * (this.taxRate / 100);
    }
    if (this.field === 'subTotal') {
      this._sum += item['price'] * item['qty'];
    }
    if (this.field === 'total') {
      let taxes = 0;
      if (item['taxable']) {
        taxes = item['price'] * item['qty'] * (this.taxRate / 100);
      }
      this._sum += item['price'] * item['qty'] + taxes;
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this.field] = this._sum;
  }
}

const Example36: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(getData());
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [taxRate, setTaxRate] = useState(7.5);
  const [excelExportService] = useState(new ExcelExportService());
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const isDataGroupedRef = useRef(false);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const taxRateRef = useRef(taxRate);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    // the columns field property is type-safe, try to add a different string not representing one of DataItems properties
    const columnDefinitions: Column[] = [
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
            format: '$0.00', // currency format
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
        width: 70,
        filterable: true,
        exportWithFormatter: false,
        formatter: Formatters.multiple,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
        params: {
          formatters: [
            (_row, _cell, _value, _coldef, dataContext) => dataContext.price * dataContext.qty,
            Formatters.dollar,
          ] as Formatter[],
        },
        excelExportOptions: {
          style: {
            font: { outline: true, italic: true, color: 'FF215073' },
            format: '$0.00', // currency format
          },
          width: 12,
          valueParserCallback: excelRegularCellParser,
        },
        groupTotalsExcelExportOptions: {
          style: {
            font: { bold: true, italic: true, size: 11.5 },
            format: '$0.00', // currency format
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
        formatter: Formatters.checkmarkMaterial,
        exportCustomFormatter: (_row, _cell, val) => (val ? '✓' : ''),
        excelExportOptions: {
          style: {
            alignment: { horizontal: 'center' },
          },
        },
      },
      {
        id: 'taxes',
        name: 'Taxes',
        field: 'taxes',
        cssClass: 'text-taxes',
        type: 'number',
        sortable: true,
        width: 70,
        filterable: true,
        formatter: Formatters.multiple,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
        params: {
          formatters: [
            (_row, _cell, _value, _coldef, dataContext) => {
              if (dataContext.taxable) {
                return dataContext.price * dataContext.qty * (taxRateRef.current / 100);
              }
              return null;
            },
            Formatters.dollar,
          ] as Formatter[],
        },
        excelExportOptions: {
          style: {
            font: { outline: true, italic: true, color: 'FFC65911' },
            format: '$0.00', // currency format
          },
          width: 12,
          valueParserCallback: excelRegularCellParser,
        },
        groupTotalsExcelExportOptions: {
          style: {
            font: { bold: true, italic: true, color: 'FFC65911', size: 11.5 },
            format: '$0.00', // currency format
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
        width: 70,
        filterable: true,
        cssClass: 'text-total',
        formatter: Formatters.multiple,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
        params: {
          formatters: [
            (_row, _cell, _value, _coldef, dataContext) => {
              let subTotal = dataContext.price * dataContext.qty;
              if (dataContext.taxable) {
                subTotal += subTotal * (taxRateRef.current / 100);
              }
              return subTotal;
            },
            Formatters.dollar,
          ] as Formatter[],
        },
        excelExportOptions: {
          style: {
            font: { outline: true, bold: true, color: 'FF005A9E' },
            format: '$0.00', // currency format
          },
          width: 12,
          valueParserCallback: excelRegularCellParser,
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
    ];

    const gridOptions: GridOption = {
      autoAddCustomEditorFormatter: customEditableInputFormatter,
      gridHeight: 410,
      gridWidth: 750,
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      rowHeight: 33,
      formatterOptions: {
        maxDecimal: 2,
        minDecimal: 2,
      },
      enableGrouping: true,
      externalResources: [excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        filename: 'grocery-list',
        sanitizeDataExport: true,
        sheetName: 'Grocery List',
        columnHeaderStyle: {
          font: { color: 'FFFFFFFF' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4a6c91' },
        },

        // optionally pass a custom header to the Excel Sheet
        // a lot of the info can be found on Web Archive of Excel-Builder
        // https://ghiscoding.gitbook.io/excel-builder-vanilla/cookbook/fonts-and-colors
        customExcelHeader: (workbook, sheet) => {
          const excelFormat = workbook.getStyleSheet().createFormat({
            // every color is prefixed with FF, then regular HTML color
            font: { size: 18, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
            alignment: { wrapText: true, horizontal: 'center' },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF203764' },
          });
          sheet.setRowInstructions(0, { height: 40 }); // change height of row 0

          // excel cells start with A1 which is upper left corner
          const customTitle = 'Grocery Shopping List';
          const lastCellMerge = isDataGroupedRef.current ? 'H1' : 'G1';
          sheet.mergeCells('A1', lastCellMerge);
          sheet.data.push([{ value: customTitle, metadata: { style: excelFormat.id } }]);
        },
      },
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  // mock a dataset
  function getData() {
    let i = 1;
    const datasetTmp = [
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

    return datasetTmp;
  }

  function invalidateAll() {
    // make sure to call both refresh/invalid in this order so that whenever a cell changes we recalculate all Groups
    reactGridRef.current?.dataView?.refresh();
    reactGridRef.current?.slickGrid?.invalidate();
  }

  function updateTaxRate() {
    // since Aggregator are cached and we provided the Tax Rate to our custom Aggregator,
    // we need to recompile them by resetting the Group
    if (isDataGroupedRef.current) {
      groupByTaxable();
    }

    invalidateAll();
  }

  function exportToExcel() {
    excelExportService.exportToExcel();
  }

  function excelGroupCellParser(totals: SlickGroupTotals, { columnDef, excelFormatId, dataRowIdx }: ExcelGroupValueParserArgs) {
    const colOffset = 0; // col offset of 1x because we skipped 1st column OR 0 offset if we use a Group because the Group column replaces the skip
    const rowOffset = 3; // row offset of 3x because: 1x Title, 1x Headers and Excel row starts at 1 => 3
    const priceIdx = reactGridRef.current?.slickGrid?.getColumnIndex('price') || 0;
    const qtyIdx = reactGridRef.current?.slickGrid?.getColumnIndex('qty') || 0;
    const taxesIdx = reactGridRef.current?.slickGrid?.getColumnIndex('taxes') || 0;
    const subTotalIdx = reactGridRef.current?.slickGrid?.getColumnIndex('subTotal') || 0;
    const totalIdx = reactGridRef.current?.slickGrid?.getColumnIndex('total') || 0;
    const groupItemCount = totals?.group?.count || 0;

    // the code below calculates Excel column position dynamically, technically Price is at "B" and Qty is "C"
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

  /**  We'll use a generic parser to reuse similar logic for all 3 calculable columns (SubTotal, Taxes, Total) */
  function excelRegularCellParser(
    _data: any,
    { columnDef, excelFormatId, dataRowIdx, dataContext }: ExcelCellValueParserArgs<GroceryItem>
  ) {
    // assuming that we want to calculate: (Price * Qty) => Sub-Total
    const colOffset = !isDataGroupedRef.current ? 1 : 0; // col offset of 1x because we skipped 1st column OR 0 offset if we use a Group because the Group column replaces the skip
    const rowOffset = 3; // row offset of 3x because: 1x Title, 1x Headers and Excel row starts at 1 => 3
    const priceIdx = reactGridRef.current?.slickGrid?.getColumnIndex('price') || 0;
    const qtyIdx = reactGridRef.current?.slickGrid?.getColumnIndex('qty') || 0;
    const taxesIdx = reactGridRef.current?.slickGrid?.getColumnIndex('taxes') || 0;

    // the code below calculates Excel column position dynamically, technically Price is at "B" and Qty is "C"
    const excelPriceCol = `${String.fromCharCode('A'.charCodeAt(0) + priceIdx - colOffset)}${dataRowIdx + rowOffset}`;
    const excelQtyCol = `${String.fromCharCode('A'.charCodeAt(0) + qtyIdx - colOffset)}${dataRowIdx + rowOffset}`;
    const excelTaxesCol = `${String.fromCharCode('A'.charCodeAt(0) + taxesIdx - colOffset)}${dataRowIdx + rowOffset}`;

    // `value` is our Excel cells to calculat (e.g.: "B4*C4")
    // metadata `type` has to be set to "formula" and the `style` is what we defined in `excelExportOptions.style` which is `excelFormatId` in the callback arg

    let excelVal = '';
    switch (columnDef.id) {
      case 'subTotal':
        excelVal = `${excelPriceCol}*${excelQtyCol}`; // like "C4*D4"
        break;
      case 'taxes':
        excelVal = dataContext.taxable ? `${excelPriceCol}*${excelQtyCol}*${taxRateRef.current / 100}` : '';
        break;
      case 'total':
        excelVal = `(${excelPriceCol}*${excelQtyCol})+${excelTaxesCol}`;
        break;
    }
    return { value: excelVal, metadata: { type: 'formula', style: excelFormatId } };
  }

  function clearGrouping() {
    isDataGroupedRef.current = false;
    reactGridRef.current?.dataView?.setGrouping([]);
  }

  function groupByTaxable() {
    const checkIcon = 'mdi-check-box-outline';
    const uncheckIcon = 'mdi-checkbox-blank-outline';
    isDataGroupedRef.current = true;

    reactGridRef.current?.dataView?.setGrouping({
      getter: 'taxable',
      formatter: (g) =>
        `Taxable: <span class="mdi ${g.value ? checkIcon : uncheckIcon} text-info"></span> <span class="text-primary">(${g.count} items)</span>`,
      comparer: (a, b) => b.value - a.value,
      aggregators: [
        new Aggregators.Sum('price'),
        new Aggregators.Sum('qty'),
        new CustomSumAggregator('subTotal', taxRateRef.current),
        new CustomSumAggregator('taxes', taxRateRef.current),
        new CustomSumAggregator('total', taxRateRef.current),
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: false,
    } as Grouping);

    reactGridRef.current?.dataView?.refresh();
  }

  function taxRateChanged(val: string) {
    setTaxRate(+val);
    taxRateRef.current = +val;
    console.log('tax rate', +val, taxRateRef.current);
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 36: Excel Export Formulas
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example2.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>

      <div className="subtitle">
        Grid with Excel Formulas (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/export-to-excel#cell-value-parser" target="_blank">
          Wiki docs
        </a>
        ). Calculate Totals via Formatters in the UI, but use Excel Formula when exporting via{' '}
        <code>excelExportOptions.valueParserCallback</code>
        When Grouped we will also calculate the Group Totals in the UI via Group Formatter and we again use Excel Formula to calculate the
        Group Totals (sum) dynamically. For Grouping we need to use <code>groupTotalsExcelExportOptions.valueParserCallback</code> instead.
      </div>

      <section className="row mb-2">
        <div className="mb-1">
          <button className="btn btn-outline-secondary btn-sm btn-icon me-1" onClick={() => exportToExcel()} data-test="export-excel-btn">
            <span className="mdi mdi-file-excel-outline text-success"></span>
            <span>Export to Excel</span>
          </button>
          <span>
            <button className="btn btn-outline-secondary btn-sm btn-icon me-1" onClick={() => groupByTaxable()} data-test="group-by-btn">
              <span>Group by Taxable</span>
            </button>
            <button
              className="btn btn-outline-secondary btn-sm btn-icon me-1"
              onClick={() => clearGrouping()}
              data-test="clear-grouping-btn"
            >
              <span>Clear grouping</span>
            </button>
          </span>
          <span className="ms-4 text-bold d-inline-flex align-items-center gap-4px">
            Tax Rate (%):
            <input
              type="number"
              className="narrow input"
              step="0.25"
              data-test="taxrate"
              defaultValue={taxRate}
              onInput={($event) => taxRateChanged(($event.target as HTMLInputElement).value)}
            />
            <button className="btn btn-outline-secondary btn-sm btn-icon me-1" onClick={() => updateTaxRate()} data-test="update-btn">
              Update
            </button>
          </span>
        </div>
      </section>

      <SlickgridReact
        gridId="grid36"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onCellChange={(_) => invalidateAll()}
      />
    </div>
  );
};

export default Example36;
