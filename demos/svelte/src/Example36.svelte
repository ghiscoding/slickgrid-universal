<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    Aggregators,
    Editors,
    Formatters,
    GroupTotalFormatters,
    SlickgridSvelte,
    type Aggregator,
    type Column,
    type ExcelCellValueParserArgs,
    type ExcelGroupValueParserArgs,
    type Formatter,
    type GridOption,
    type Grouping,
    type SlickGrid,
    type SlickgridSvelteInstance,
    type SlickGroupTotals,
  } from 'slickgrid-svelte';

  interface GroceryItem {
    id: number;
    name: string;
    qty: number;
    price: number;
    taxable: boolean;
    subTotal?: number;
    taxes?: number;
    total?: number;
  }

  let columns: Column[] = [];
  let dataset: GroceryItem[] = [];
  let gridOptions: GridOption;
  let isDataGrouped = false;
  let taxRate = 7.5;
  let showSubTitle = true;
  let grid: SlickgridSvelteInstance;
  const excelExportService = new ExcelExportService();

  class CustomSumAggregator implements Aggregator {
    sum = 0;
    aggregatorType = 'sum' as const;
    field: number | string;
    taxRate: number;

    constructor(field: number | string, taxRate: number) {
      this.field = field;
      this.taxRate = taxRate;
    }

    get type() {
      return this.aggregatorType;
    }
    init() {
      this.sum = 0;
    }
    accumulate(item: GroceryItem) {
      if (this.field === 'taxes' && item.taxable) {
        this.sum += item.price * item.qty * (this.taxRate / 100);
      }
      if (this.field === 'subTotal') {
        this.sum += item.price * item.qty;
      }
      if (this.field === 'total') {
        this.sum += item.price * item.qty * (item.taxable ? 1 + this.taxRate / 100 : 1);
      }
    }
    storeResult(groupTotals: any) {
      if (!groupTotals || groupTotals[this.aggregatorType] === undefined) {
        groupTotals[this.aggregatorType] = {};
      }
      groupTotals[this.aggregatorType][this.field] = this.sum;
    }
  }

  const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef, _item: GroceryItem, slickGrid) => {
    const isEditable = slickGrid.getOptions().editable && columnDef.editor;
    value = value === null || value === undefined ? '' : value;
    if (!isEditable) {
      return value;
    }
    const element = document.createElement('div');
    element.className = 'editing-field';
    element.appendChild(value instanceof HTMLElement ? value : document.createTextNode(value));
    return element;
  };

  function excelGroupCellParser(totals: SlickGroupTotals, { columnDef, excelFormatId, dataRowIdx }: ExcelGroupValueParserArgs) {
    const rowOffset = 3;
    const priceIndex = grid.slickGrid.getColumnIndex('price') ?? 0;
    const qtyIndex = grid.slickGrid.getColumnIndex('qty') ?? 0;
    const subTotalIndex = grid.slickGrid.getColumnIndex('subTotal') ?? 0;
    const taxesIndex = grid.slickGrid.getColumnIndex('taxes') ?? 0;
    const totalIndex = grid.slickGrid.getColumnIndex('total') ?? 0;
    const groupItemCount = totals?.group?.count || 0;
    const toExcelColumn = (index: number) => String.fromCharCode('A'.charCodeAt(0) + index);
    const columnsById: Record<string, string> = {
      price: toExcelColumn(priceIndex),
      qty: toExcelColumn(qtyIndex),
      subTotal: toExcelColumn(subTotalIndex),
      taxes: toExcelColumn(taxesIndex),
      total: toExcelColumn(totalIndex),
    };
    const excelColumn = columnsById[String(columnDef.id)] ?? '';
    return {
      value: `SUM(${excelColumn}${dataRowIdx + rowOffset - groupItemCount}:${excelColumn}${dataRowIdx + rowOffset - 1})`,
      metadata: { type: 'formula', style: excelFormatId },
    };
  }

  function excelRegularCellParser(
    _data: any,
    { columnDef, excelFormatId, dataRowIdx, dataContext }: ExcelCellValueParserArgs<GroceryItem>
  ) {
    const colOffset = isDataGrouped ? 0 : 1;
    const rowOffset = 3;
    const excelCell = (columnId: string) =>
      `${String.fromCharCode('A'.charCodeAt(0) + (grid.slickGrid.getColumnIndex(columnId) ?? 0) - colOffset)}${dataRowIdx + rowOffset}`;
    const priceCell = excelCell('price');
    const qtyCell = excelCell('qty');
    const taxesCell = excelCell('taxes');
    let formula = '';
    if (columnDef.id === 'subTotal') {
      formula = `${priceCell}*${qtyCell}`;
    }
    if (columnDef.id === 'taxes') {
      formula = dataContext.taxable ? `${priceCell}*${qtyCell}*${taxRate / 100}` : '';
    }
    if (columnDef.id === 'total') {
      formula = `(${priceCell}*${qtyCell})+${taxesCell}`;
    }
    return { value: formula, metadata: { type: 'formula', style: excelFormatId } };
  }

  function defineGrid() {
    columns = [
      {
        id: 'sel',
        name: '#',
        field: 'id',
        headerCssClass: 'header-centered',
        cssClass: 'cell-unselectable',
        excludeFromExport: true,
        maxWidth: 30,
      },
      { id: 'name', name: 'Name', field: 'name', sortable: true, width: 140, filterable: true, excelExportOptions: { width: 18 } },
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
          style: { font: { bold: true, size: 11.5 }, format: '$0.00', border: { top: { color: 'FF747474', style: 'thick' } } },
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
          style: { font: { bold: true, size: 11.5 }, border: { top: { color: 'FF747474', style: 'thick' } } },
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
        params: { formatters: [(_row, _cell, _value, _column, item) => item.price * item.qty, Formatters.dollar] as Formatter[] },
        excelExportOptions: {
          style: { font: { outline: false, italic: true, color: 'FF215073' }, format: '$0.00' },
          width: 12,
          valueParserCallback: excelRegularCellParser,
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
        formatter: Formatters.checkmarkMaterial,
        exportCustomFormatter: (_row, _cell, value) => (value ? '✓' : ''),
        excelExportOptions: { style: { alignment: { horizontal: 'center' } } },
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
            (_row, _cell, _value, _column, item) => (item.taxable ? (item.price * item.qty * taxRate) / 100 : null),
            Formatters.dollar,
          ] as Formatter[],
        },
        excelExportOptions: {
          style: { font: { outline: false, italic: true, color: 'FFC65911' }, format: '$0.00' },
          width: 12,
          valueParserCallback: excelRegularCellParser,
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
        width: 70,
        filterable: true,
        cssClass: 'text-total',
        formatter: Formatters.multiple,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
        params: {
          formatters: [
            (_row, _cell, _value, _column, item) => item.price * item.qty * (item.taxable ? 1 + taxRate / 100 : 1),
            Formatters.dollar,
          ] as Formatter[],
        },
        excelExportOptions: {
          style: { font: { outline: false, bold: true, color: 'FF005A9E' }, format: '$0.00' },
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

    gridOptions = {
      autoAddCustomEditorFormatter: customEditableInputFormatter,
      gridHeight: 410,
      gridWidth: 750,
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      rowHeight: 33,
      formatterOptions: { maxDecimal: 2, minDecimal: 2 },
      enableGrouping: true,
      externalResources: [excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        filename: 'grocery-list',
        sanitizeDataExport: true,
        sheetName: 'Grocery List',
        columnHeaderStyle: { font: { color: 'FFFFFFFF' }, fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4a6c91' } },
        customExcelHeader: (workbook, sheet) => {
          const format = workbook.getStyleSheet().createFormat({
            font: { size: 18, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
            alignment: { wrapText: true, horizontal: 'center' },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF203764' },
          });
          sheet.setRowInstructions(0, { height: 40 });
          sheet.mergeCells('A1', isDataGrouped ? 'H1' : 'G1');
          sheet.data.push([{ value: 'Grocery Shopping List', metadata: { style: format.id } }]);
        },
      },
    };
  }

  function checkItemIsEditable(column: Column, slickGrid: SlickGrid) {
    return slickGrid.getOptions().editable && !!column.editor;
  }
  function invalidateAll() {
    grid?.dataView?.refresh();
    grid?.slickGrid?.invalidate();
  }
  function onCellChange() {
    invalidateAll();
  }
  function exportToExcel() {
    excelExportService.exportToExcel();
  }
  function clearGrouping() {
    isDataGrouped = false;
    grid?.dataView?.setGrouping([]);
  }
  function groupByTaxable() {
    isDataGrouped = true;
    grid?.dataView?.setGrouping({
      getter: 'taxable',
      formatter: (group) =>
        `Taxable: <span class="mdi ${group.value ? 'mdi-check-box-outline' : 'mdi-checkbox-blank-outline'} text-info"></span> <span class="text-primary">(${group.count} items)</span>`,
      comparer: (a, b) => Number(b.value) - Number(a.value),
      aggregators: [
        new Aggregators.Sum('price'),
        new Aggregators.Sum('qty'),
        new CustomSumAggregator('subTotal', taxRate),
        new CustomSumAggregator('taxes', taxRate),
        new CustomSumAggregator('total', taxRate),
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: false,
    } as Grouping);
    grid?.dataView?.refresh();
  }
  function updateTaxRate() {
    if (isDataGrouped) {
      groupByTaxable();
    }
    invalidateAll();
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid?.resizerService.resizeGrid());
  }
  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
  }

  defineGrid();
  dataset = [
    { id: 1, name: 'Oranges', qty: 4, taxable: false, price: 2.22 },
    { id: 2, name: 'Apples', qty: 3, taxable: false, price: 1.55 },
    { id: 3, name: 'Honeycomb Cereals', qty: 2, taxable: true, price: 4.55 },
    { id: 4, name: 'Raisins', qty: 77, taxable: false, price: 0.23 },
    { id: 5, name: 'Corn Flake Cereals', qty: 1, taxable: true, price: 6.62 },
    { id: 6, name: 'Tomatoes', qty: 3, taxable: false, price: 1.88 },
    { id: 7, name: 'Butter', qty: 1, taxable: false, price: 3.33 },
    { id: 8, name: 'BBQ Chicken', qty: 1, taxable: false, price: 12.33 },
    { id: 9, name: 'Chicken Wings', qty: 12, taxable: true, price: 0.53 },
    { id: 10, name: 'Drinkable Yogurt', qty: 6, taxable: true, price: 1.22 },
    { id: 11, name: 'Milk', qty: 3, taxable: true, price: 3.11 },
  ];
  const events = { onCellChange };
</script>

<svelte:head><title>Example 36 - Excel Export Formulas</title></svelte:head>

<h2>
  Example 36: Excel Export Formulas
  <span class="float-end"
    ><a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example36.vue"
      ><span class="mdi mdi-link-variant"></span> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>
{#if showSubTitle}<div class="subtitle">
    Grid with Custom and/or included Slickgrid Formatters (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/column-functionalities/formatters"
      target="_blank">Wiki docs</a
    >).
    <ul>
      <li>The calculated columns display totals using Slickgrid formatters.</li>
      <li>Support Excel Copy Buffer and Excel export, with formula callbacks for row values and group totals.</li>
      <li>Change the tax rate or group by Taxable to see calculated values and aggregate totals update.</li>
    </ul>
    Grid with Excel Formulas (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/export-to-excel#cell-value-parser"
      target="_blank">Wiki docs</a
    >). UI totals use formatters while Excel export uses formulas.
  </div>{/if}
<section class="row mb-2">
  <div class="mb-1">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="export-excel-btn" onclick={exportToExcel}
      ><span class="mdi mdi-file-excel-outline text-success"></span><span>Export to Excel</span></button
    >
    <span
      ><button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="group-by-btn" onclick={groupByTaxable}
        >Group by Taxable</button
      ><button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-grouping-btn" onclick={clearGrouping}
        >Clear grouping</button
      ></span
    >
    <span class="ms-4 text-bold d-inline-flex align-items-center gap-4px"
      >Tax Rate (%): <input bind:value={taxRate} type="number" class="narrow input" step="0.25" data-test="taxrate" /><button
        class="btn btn-outline-secondary btn-sm btn-icon ms-1"
        data-test="update-btn"
        onclick={updateTaxRate}>Update</button
      ></span
    >
  </div>
</section>
<SlickgridSvelte gridId="grid36" {columns} options={gridOptions} {dataset} {events} onSvelteGridCreated={gridReady} />

<style>
  input[type='number'].narrow {
    height: 32px;
    width: 50px;
    border: 1px solid #c0c0c0;
    border-radius: 3px;
  }
  :global(#grid36 .slick-row:not(.slick-group) > .cell-unselectable) {
    background: #ececec !important;
    font-weight: bold;
  }
  :global(#grid36 .text-sub-total) {
    font-style: italic;
    color: rgb(33, 80, 115) !important;
  }
  :global(#grid36 .text-taxes) {
    font-style: italic;
    color: rgb(198, 89, 17);
  }
  :global(#grid36 .text-total) {
    font-weight: bold;
    color: rgb(0, 90, 158);
  }
</style>
