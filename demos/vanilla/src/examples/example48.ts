import { Filters, Formatters, type Column, type GridOption } from '@slickgrid-universal/common';
import { SlickPivot, SlickPivotFieldList, type PivotField, type PivotSpec } from '@slickgrid-universal/pivot-plugin';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import '@slickgrid-universal/pivot-plugin/dist/styles/css/slick.pivot-salesforce.css';
import { ExampleGridOptions } from './example-grid-options.js';
import './example48.scss';

interface Sale {
  orderId: number;
  region: string;
  country: string;
  channel: string;
  category: string;
  product: string;
  orderDate: Date;
  amount: number;
  units: number;
  unitPrice: number;
  discount: number;
}

const regions = [
  { name: 'East', countries: ['China', 'India', 'Japan'] },
  { name: 'North', countries: ['Canada', 'Norway', 'Sweden'] },
  { name: 'South', countries: ['Argentina', 'Australia', 'Brazil'] },
  { name: 'West', countries: ['France', 'Spain', 'United States'] },
];
const categories = ['Hardware', 'Software', 'Services'];
const channels = ['Online', 'Retail', 'Partner'];
const calculateAmount = (row: Pick<Sale, 'units' | 'unitPrice' | 'discount'>): number =>
  Math.round(row.units * row.unitPrice * (1 - row.discount) * 100) / 100;

const pivotFieldOptions: Record<string, Partial<PivotField>> = {
  region: { group: 'Customer' },
  country: { group: 'Customer' },
  channel: { group: 'Customer' },
  category: { group: 'Product' },
  product: { group: 'Product' },
  orderId: { group: 'Order' },
  orderDate: { group: 'Order' },
  units: { group: 'Measures' },
  unitPrice: { group: 'Measures' },
  discount: { group: 'Measures' },
  amount: { group: 'Measures', getter: (row: Sale) => calculateAmount(row) },
};
const initialSpec: Partial<PivotSpec> = {
  rows: ['region', 'country'],
  columns: ['orderDate.year'],
  filters: [{ field: 'channel' }],
  values: [
    { field: 'amount', aggregator: 'sum', numberFormat: { locale: 'en-CA', style: 'currency', currency: 'USD', maximumFractionDigits: 0 } },
  ],
};

function createSales(count: number): Sale[] {
  return Array.from({ length: count }, (_, index) => {
    const region = regions[index % regions.length];
    const country = region.countries[Math.floor(index / regions.length) % region.countries.length];
    const category = categories[Math.floor(index / 7) % categories.length];
    const units = 1 + (index % 20);
    const unitPrice = 5 + ((index * 137) % 10000) / 100;
    const discount = [0, 0.05, 0.1, 0.15][Math.floor(index / 5) % 4];
    return {
      orderId: index + 1,
      region: region.name,
      country,
      channel: channels[Math.floor(index / 11) % channels.length],
      category,
      product: `${category} ${1 + (index % 4)}`,
      orderDate: new Date(2023 + (index % 3), index % 12, 1 + (index % 28)),
      units,
      unitPrice,
      discount,
      get amount() {
        return calculateAmount(this);
      },
    };
  });
}

export default class Example48 {
  columns: Column[] = [];
  private salesColumns: Column[] = [];
  dataset: Sale[] | Array<{ myCol1: number; myCol2: string; myCol3: number; myCol4: string }> = [];
  gridOptions!: GridOption;
  gridBundle?: SlickVanillaGridBundle;
  pivot?: SlickPivot;
  fieldList?: SlickPivotFieldList;
  savedSpec?: PivotSpec;
  rowCount = 5000;

  attached(): void {
    const container = document.querySelector<HTMLElement>('.grid48');
    if (!container) {
      return;
    }
    const gridElement = container.querySelector<HTMLElement>('.grid48-grid');
    const gridSlot = container.querySelector<HTMLElement>('.grid48-slot');
    if (!gridElement || !gridSlot) {
      return;
    }
    this.pivot = new SlickPivot();
    this.fieldList = new SlickPivotFieldList({ container, pivot: this.pivot, width: 320, details: { gridOptions: { rowHeight: 32 } } });
    this.columns = [
      { id: 'region', field: 'region', name: 'Region', sortable: true, filterable: true, filter: { model: Filters.inputText } },
      { id: 'country', field: 'country', name: 'Country', sortable: true, filterable: true, filter: { model: Filters.inputText } },
      { id: 'channel', field: 'channel', name: 'Channel', sortable: true, filterable: true, filter: { model: Filters.inputText } },
      { id: 'category', field: 'category', name: 'Category', sortable: true, filterable: true, filter: { model: Filters.inputText } },
      { id: 'product', field: 'product', name: 'Product', sortable: true, filterable: true, filter: { model: Filters.inputText } },
      {
        id: 'orderId',
        field: 'orderId',
        name: 'Order Id',
        type: 'number',
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
      },
      {
        id: 'orderDate',
        field: 'orderDate',
        name: 'Order Date',
        formatter: Formatters.dateIso,
        type: 'date',
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      { id: 'units', field: 'units', name: 'units', type: 'number', filterable: true, filter: { model: Filters.compoundInputNumber } },
      {
        id: 'unitPrice',
        field: 'unitPrice',
        name: 'Unit Price',
        type: 'number',
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
      },
      {
        id: 'discount',
        field: 'discount',
        name: 'discount',
        type: 'number',
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
      },
      { id: 'amount', field: 'amount', name: 'amount', type: 'number', filterable: true, filter: { model: Filters.compoundInputNumber } },
    ];
    this.salesColumns = this.columns.slice();
    this.dataset = createSales(this.rowCount);
    this.gridOptions = {
      enableAutoResize: true,
      // Pivot layouts can create many columns, so keep their widths and scroll horizontally.
      enableAutoSizeColumns: false,
      autoFitColumnsOnFirstLoad: false,
      autoResize: { container: gridSlot, calculateAvailableSizeBy: 'container', resizeDetection: 'container', bottomPadding: 0 },
      enableFiltering: true,
      showHeaderRow: true,
      enableCellNavigation: true,
      editable: true,
      autoEdit: false,
      datasetIdPropertyName: 'orderId',
      externalResources: [this.pivot, this.fieldList],
      pivotOptions: {
        fields: Object.entries(pivotFieldOptions).map(([id, options]) => ({ id, ...options })),
        pivotMode: true,
        spec: initialSpec,
      },
    };
    this.gridBundle = new Slicker.GridBundle(gridElement, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    Object.assign(window, { grid: this.gridBundle?.slickGrid, pivot: this.pivot, fieldList: this.fieldList });
  }

  dispose(): void {
    this.gridBundle?.dispose();
    this.gridBundle = undefined;
    this.pivot = undefined;
    this.fieldList = undefined;
  }

  async changeDataset(value: string): Promise<void> {
    const pivot = this.pivot;
    const bundle = this.gridBundle;
    const dataView = bundle?.dataView;
    if (!pivot || !dataView || !bundle) {
      return;
    }
    const wasPivotMode = pivot.isPivotMode();
    if (wasPivotMode) {
      await pivot.setPivotMode(false);
    }
    await bundle.filterService.clearFilters();
    if (value === 'excel') {
      this.columns = [
        {
          id: 'myCol1',
          field: 'myCol1',
          name: 'myCol1',
          type: 'number',
          sortable: true,
          filterable: true,
          filter: { model: Filters.compoundInputNumber },
        },
        { id: 'myCol2', field: 'myCol2', name: 'myCol2', sortable: true, filterable: true, filter: { model: Filters.inputText } },
        {
          id: 'myCol3',
          field: 'myCol3',
          name: 'myCol3',
          type: 'number',
          sortable: true,
          filterable: true,
          filter: { model: Filters.compoundInputNumber },
        },
        { id: 'myCol4', field: 'myCol4', name: 'myCol4', sortable: true, filterable: true, filter: { model: Filters.inputText } },
      ];
      bundle.columns = this.columns;
      const rows = [
        { myCol1: 1, myCol2: 'Apples', myCol3: 43, myCol4: 'Hot' },
        { myCol1: 2, myCol2: 'Apples', myCol3: 43, myCol4: 'Cold' },
        { myCol1: 3, myCol2: 'Bananas', myCol3: 23, myCol4: 'Hot' },
        { myCol1: 4, myCol2: 'Bananas', myCol3: 56, myCol4: 'Cold' },
      ];
      this.dataset = rows;
      dataView.setItems(this.dataset, 'myCol1');
      await pivot.load({
        fields: [{ id: 'myCol1', type: 'number' }, { id: 'myCol2' }, { id: 'myCol3', type: 'number' }, { id: 'myCol4' }],
        source: dataView,
        spec: { rows: ['myCol1'], columns: ['myCol2'], values: [{ field: 'myCol1', aggregator: 'sum' }] },
      });
    } else {
      this.columns = this.salesColumns.slice();
      bundle.columns = this.columns;
      this.rowCount = Number(value);
      this.dataset = createSales(this.rowCount);
      dataView.setItems(this.dataset, 'orderId');
      await pivot.load({ fields: this.gridOptions.pivotOptions?.fields, source: dataView, spec: initialSpec });
    }
    if (wasPivotMode) {
      await pivot.setPivotMode(true);
    }
  }

  async toggleWriteBack(enabled: boolean): Promise<void> {
    const pivot = this.pivot;
    if (!pivot) {
      return;
    }
    const spec = pivot.getSpec();
    if (enabled && !spec.values.some((value) => value.field === 'units')) {
      await pivot.updateSpec({ values: [...spec.values, { field: 'units', aggregator: 'sum', writeBack: { precision: 0 } }] });
    }
    await pivot.setOptions({ enableWriteBack: enabled });
  }

  async setRowDocking(value: string): Promise<void> {
    await this.pivot?.setOptions({ pinGrandTotalRow: value === 'sticky' ? 'sticky' : value === 'pinned' });
  }

  async setColumnDocking(value: string): Promise<void> {
    await this.pivot?.setOptions({ pinGrandTotalColumns: value === 'sticky' ? 'sticky' : value === 'pinned' });
  }

  setRtl(rtl: boolean): void {
    const pivot = this.pivot;
    if (!pivot) {
      return;
    }
    const { fields: currentFields, ...options } = pivot.getOptions();
    delete options.source;
    delete options.spec;
    this.dataset = [...pivot.getSourceRows()];
    const currentSpec = pivot.getSpec();
    this.gridBundle?.dispose();
    const container = document.querySelector<HTMLElement>('.grid48');
    const gridElement = container?.querySelector<HTMLElement>('.grid48-grid');
    const gridSlot = container?.querySelector<HTMLElement>('.grid48-slot');
    if (!container || !gridElement || !gridSlot) {
      return;
    }
    gridElement.replaceChildren();
    this.pivot = new SlickPivot();
    this.fieldList = new SlickPivotFieldList({ container, pivot: this.pivot, width: 320, details: { gridOptions: { rowHeight: 32 } } });
    this.gridOptions = {
      ...this.gridOptions,
      autoResize: { container: gridSlot, calculateAvailableSizeBy: 'container', resizeDetection: 'container', bottomPadding: 0 },
      rtl,
      externalResources: [this.pivot, this.fieldList],
      pivotOptions: { ...options, fields: currentFields, pivotMode: false, spec: currentSpec },
    };
    this.gridBundle = new Slicker.GridBundle(gridElement, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    void this.pivot.setPivotMode(true);
    Object.assign(window, { grid: this.gridBundle?.slickGrid, pivot: this.pivot, fieldList: this.fieldList });
  }

  async toggleServerProvider(enabled: boolean): Promise<void> {
    const pivot = this.pivot;
    if (!pivot) {
      return;
    }
    await pivot.setOptions({
      provider: enabled
        ? {
            execute: async (request, { signal }) => {
              await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, 400);
                signal.addEventListener(
                  'abort',
                  () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                  },
                  { once: true }
                );
              });
              return pivot.getEngine().execute(pivot.getSourceRows(), request.spec);
            },
            getItems: (fieldId, { search }) => pivot.getEngine().getFieldItems(pivot.getSourceRows(), fieldId, { search }),
            getSourceRows: (request, rowKey, columnKey) =>
              pivot.getEngine().getSourceRows(pivot.getSourceRows(), request.spec, rowKey, columnKey),
          }
        : undefined,
    });
  }

  saveLayout(): void {
    const spec = this.pivot?.getSpec();
    this.savedSpec = spec ? structuredClone(spec) : undefined;
  }

  async restoreLayout(): Promise<void> {
    if (this.savedSpec) {
      await this.pivot?.setSpec(this.savedSpec);
    }
  }

  async resetLayout(): Promise<void> {
    await this.pivot?.setSpec(initialSpec);
  }
}
