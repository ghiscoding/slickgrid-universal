import { type Column, Editors, type GridOption, Formatters, FieldType, type Formatter, } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

import { ExampleGridOptions } from './example-grid-options';
import './example23.scss';

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

/**
 * Check if the current item (cell) is editable or not
 * @param {*} dataContext - item data context object
 * @param {*} columnDef - column definition
 * @param {*} grid - slickgrid grid object
 * @returns {boolean} isEditable
 */
function checkItemIsEditable(_dataContext, columnDef, grid) {
  const gridOptions = grid.getOptions();
  const hasEditor = columnDef.editor;
  const isGridEditable = gridOptions.editable;
  const isEditable = (isGridEditable && hasEditor);

  return isEditable;
}

const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef, dataContext, grid) => {
  const isEditableItem = checkItemIsEditable(dataContext, columnDef, grid);
  value = (value === null || value === undefined) ? '' : value;
  const divElm = document.createElement('div');
  divElm.className = 'editing-field';
  if (value instanceof HTMLElement) {
    divElm.appendChild(value);
  } else {
    divElm.textContent = value;
  }
  return isEditableItem ? divElm : value;
};

export default class Example19 {
  columnDefinitions: Column<GroceryItem>[] = [];
  dataset: any[] = [];
  gridOptions!: GridOption;
  gridContainerElm: HTMLDivElement;
  sgb: SlickVanillaGridBundle;
  excelExportService: ExcelExportService;
  taxRate = 7.5;

  constructor() {
    this.excelExportService = new ExcelExportService();
  }

  attached() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.getData();
    this.gridContainerElm = document.querySelector<HTMLDivElement>('.grid23') as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(document.querySelector('.grid23') as HTMLDivElement, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    document.body.classList.add('salesforce-theme');
  }

  dispose() {
    this.sgb?.dispose();
    this.gridContainerElm.remove();
    document.body.classList.remove('salesforce-theme');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'sel', name: '#', field: 'id',
        headerCssClass: 'header-centered',
        cssClass: 'cell-unselectable text-center',
        excludeFromExport: true,
        maxWidth: 30,
      },
      {
        id: 'name', name: 'Name', field: 'name', sortable: true, width: 140, filterable: true,
        excelExportOptions: { width: 18 }
      },
      {
        id: 'price', name: 'Price', field: 'price', type: FieldType.number,
        editor: { model: Editors.float }, sortable: true, width: 70, filterable: true,
        formatter: Formatters.dollar
      },
      { id: 'qty', name: 'Quantity', field: 'qty', type: FieldType.number, editor: { model: Editors.integer }, sortable: true, width: 60, filterable: true },
      {
        id: 'subTotal', name: 'Sub-Total', field: 'subTotal', cssClass: 'text-sub-total',
        type: FieldType.number, sortable: true, width: 70, filterable: true,
        exportWithFormatter: false,
        formatter: Formatters.multiple,
        params: {
          formatters: [
            (_row, _cell, _value, _coldef, dataContext) => dataContext.price * dataContext.qty,
            Formatters.dollar
          ]
        },
        excelExportOptions: {
          style: {
            font: { outline: true, italic: true, color: 'FF215073' },
            format: '$0.00', // currency format
          },
          width: 12,
          valueParserCallback: this.excelColumnParser.bind(this),
        },
      },
      {
        id: 'taxable', name: 'Taxable', field: 'taxable', cssClass: 'text-center', sortable: true, width: 60, filterable: true,
        formatter: Formatters.checkmarkMaterial,
        exportCustomFormatter: (_row, _cell, val) => val ? '✓' : '',
        excelExportOptions: {
          style: {
            alignment: { horizontal: 'center' },
          },
        }
      },
      {
        id: 'taxes', name: 'Taxes', field: 'taxes', cssClass: 'text-taxes',
        type: FieldType.number, sortable: true, width: 70, filterable: true,
        formatter: Formatters.multiple,
        params: {
          formatters: [
            (_row, _cell, _value, _coldef, dataContext) => {
              if (dataContext.taxable) {
                return dataContext.price * dataContext.qty * (this.taxRate / 100);
              }
              return null;
            },
            Formatters.dollar
          ]
        },
        excelExportOptions: {
          style: {
            font: { outline: true, italic: true, color: 'FFC65911' },
            format: '$0.00', // currency format
          },
          width: 12,
          valueParserCallback: this.excelColumnParser.bind(this),
        },
      },
      {
        id: 'total', name: 'Total', field: 'total', type: FieldType.number, sortable: true, width: 70, filterable: true,
        cssClass: 'text-total', formatter: Formatters.multiple,
        params: {
          formatters: [
            (_row, _cell, _value, _coldef, dataContext) => {
              let subTotal = dataContext.price * dataContext.qty;
              if (dataContext.taxable) {
                subTotal += subTotal * (this.taxRate / 100);
              }
              return subTotal;
            },
            Formatters.dollar
          ]
        },
        excelExportOptions: {
          style: {
            font: { outline: true, bold: true, color: 'FF005A9E' },
            format: '$0.00', // currency format
          },
          width: 12,
          valueParserCallback: this.excelColumnParser.bind(this),
        },
      },
    ];

    this.gridOptions = {
      autoAddCustomEditorFormatter: customEditableInputFormatter,
      gridHeight: 410,
      gridWidth: 750,
      enableCellNavigation: true,
      autoEdit: true,
      editable: true,
      rowHeight: 33,
      formatterOptions: {
        maxDecimal: 2,
        minDecimal: 2,
      },
      externalResources: [this.excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        filename: 'grocery-list',
        sanitizeDataExport: true,
        sheetName: 'Grocery List',
        columnHeaderStyle: {
          font: { color: 'FFFFFFFF' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4a6c91' }
        },

        // optionally pass a custom header to the Excel Sheet
        // a lot of the info can be found on Web Archive of Excel-Builder
        // https://ghiscoding.gitbook.io/excel-builder-vanilla/cookbook/fonts-and-colors
        customExcelHeader: (workbook, sheet) => {
          const formatterId = workbook.getStyleSheet().createFormat({
            // every color is prefixed with FF, then regular HTML color
            font: { size: 18, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
            alignment: { wrapText: true, horizontal: 'center' },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF203764' },
          });
          sheet.setRowInstructions(0, { height: 40 }); // change height of row 0

          // excel cells start with A1 which is upper left corner
          const customTitle = 'Grocery Shopping List';
          sheet.mergeCells('A1', 'G1');
          sheet.data.push([{ value: customTitle, metadata: { style: formatterId.id } }]);
        },
      },
    };
  }

  changeTaxRate() {
    this.sgb.slickGrid?.invalidate();
  }

  exportToExcel() {
    this.excelExportService.exportToExcel();
  }

  /**
   * We'll use a generic parser to reuse similar logic for all 3 calculable columns (SubTotal, Taxes, Total)
   */
  excelColumnParser(_data, colDef, excelFormatterId, _stylesheet, _gridOptions, dataContext: GroceryItem) {
    // assuming that we want to calculate: (Price * Qty) => Sub-Total
    const colOffset = 1; // 1st column is not exported
    const rowOffset = 3; // 1x Title, 1x Headers and Excel row starts at 1 => 3
    const itemRow = this.sgb.dataView?.getRowById(dataContext.id) || 0;
    const priceIdx = this.sgb.slickGrid?.getColumnIndex('price') || 0;
    const qtyIdx = this.sgb.slickGrid?.getColumnIndex('qty') || 0;
    const taxesIdx = this.sgb.slickGrid?.getColumnIndex('taxes') || 0;

    // the code below calculates Excel column position dynamically, technically Price is at "B" and Qty is "C"
    const excelPriceCol = `${String.fromCharCode('A'.charCodeAt(0) + priceIdx - colOffset)}${itemRow + rowOffset}`;
    const excelQtyCol = `${String.fromCharCode('A'.charCodeAt(0) + qtyIdx - colOffset)}${itemRow + rowOffset}`;
    const excelTaxesCol = `${String.fromCharCode('A'.charCodeAt(0) + taxesIdx - colOffset)}${itemRow + rowOffset}`;

    // `value` is our Excel cells to calculat (e.g.: "B4*C4")
    // metadata `type` has to be set to "formula" and the `style` is what we defined in `excelExportOptions.style` which is `excelFormatterId` in the callback arg

    let excelVal = '';
    switch (colDef.id) {
      case 'subTotal':
        excelVal = `${excelPriceCol}*${excelQtyCol}`;
        break;
      case 'taxes':
        if (dataContext.taxable) {
          excelVal = `${excelPriceCol}*${excelQtyCol}*${this.taxRate / 100}`;
        } else {
          excelVal = '';
        }
        break;
      case 'total':
        excelVal = `(${excelPriceCol}*${excelQtyCol})+${excelTaxesCol}`;
        break;
    }
    return { value: excelVal, metadata: { type: 'formula', style: excelFormatterId } };
  }

  getData() {
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
      { id: i++, name: 'Chicken Wings', qty: 12, taxable: true, price: .53 },
      { id: i++, name: 'Drinkable Yogurt', qty: 6, taxable: true, price: 1.22 },
      { id: i++, name: 'Milk', qty: 3, taxable: true, price: 3.11 },
    ];

    return datasetTmp;
  }

  generatePhoneNumber(): string {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }
}
