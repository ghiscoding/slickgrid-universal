import { SlickPivotTable, type PivotField, type PivotSpec } from '@slickgrid-universal/pivot-plugin';
import '@slickgrid-universal/pivot-plugin/dist/styles/css/slick.pivot-salesforce.css';
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
}

const regions = [
  { name: 'East', countries: ['China', 'India', 'Japan'] },
  { name: 'North', countries: ['Canada', 'Norway', 'Sweden'] },
  { name: 'South', countries: ['Argentina', 'Australia', 'Brazil'] },
  { name: 'West', countries: ['France', 'Spain', 'United States'] },
];
const categories = ['Hardware', 'Software', 'Services'];
const channels = ['Online', 'Retail', 'Partner'];
const fields: PivotField[] = [
  { id: 'region', label: 'Region', group: 'Customer' },
  { id: 'country', label: 'Country', group: 'Customer' },
  { id: 'channel', label: 'Channel', group: 'Customer' },
  { id: 'category', label: 'Category', group: 'Product' },
  { id: 'product', label: 'Product', group: 'Product' },
  { id: 'orderId', label: 'Order Id', type: 'number', group: 'Order' },
  { id: 'orderDate', label: 'Order Date', type: 'date', group: 'Order' },
  { id: 'units', type: 'number', group: 'Measures' },
  { id: 'unitPrice', label: 'Unit Price', type: 'number', group: 'Measures' },
  { id: 'discount', type: 'number', group: 'Measures' },
  { id: 'amount', type: 'number', group: 'Measures', getter: (row) => row.amount },
];
const initialSpec: Partial<PivotSpec> = {
  rows: ['region', 'country'],
  columns: ['orderDate.year'],
  filters: [{ field: 'channel' }],
  values: [{ field: 'amount', aggregator: 'sum', numberFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }],
};

function createSales(count: number): Sale[] {
  return Array.from({ length: count }, (_, index) => {
    const region = regions[index % regions.length];
    const country = region.countries[Math.floor(index / regions.length) % region.countries.length];
    const category = categories[Math.floor(index / 7) % categories.length];
    return {
      orderId: index + 1,
      region: region.name,
      country,
      channel: channels[Math.floor(index / 11) % channels.length],
      category,
      product: `${category} ${1 + (index % 4)}`,
      orderDate: new Date(2023 + (index % 3), index % 12, 1 + (index % 28)),
      units: 1 + (index % 20),
      amount: 75 + ((index * 137 + 53) % 4250),
    };
  });
}

export default class Example48 {
  table?: SlickPivotTable;
  savedSpec?: PivotSpec;
  rowCount = 5000;

  attached(): void {
    const container = document.querySelector<HTMLElement>('.grid48');
    if (!container) {
      return;
    }
    this.table = new SlickPivotTable(container, {
      fields,
      source: createSales(this.rowCount),
      spec: initialSpec,
      gridOptions: { enableCellNavigation: true, editable: true, autoEdit: false },
      fieldList: { width: 320 },
    });
    Object.assign(window, { pivotTable: this.table, grid: this.table.getGrid(), pivot: this.table.getPivot() });
  }

  dispose(): void {
    this.table?.destroy();
    this.table = undefined;
  }

  async changeDataset(value: string): Promise<void> {
    const pivot = this.table?.getPivot();
    if (value === 'excel') {
      await pivot?.load({
        fields: [{ id: 'myCol1', type: 'number' }, { id: 'myCol2' }, { id: 'myCol3', type: 'number' }, { id: 'myCol4' }],
        source: [
          { myCol1: 1, myCol2: 'Apples', myCol3: 43, myCol4: 'Hot' },
          { myCol1: 2, myCol2: 'Apples', myCol3: 43, myCol4: 'Cold' },
          { myCol1: 3, myCol2: 'Bananas', myCol3: 23, myCol4: 'Hot' },
          { myCol1: 4, myCol2: 'Bananas', myCol3: 56, myCol4: 'Cold' },
        ],
        spec: { rows: ['myCol1'], columns: ['myCol2'], values: [{ field: 'myCol1', aggregator: 'sum' }] },
      });
    } else {
      this.rowCount = Number(value);
      await pivot?.load({ fields, source: createSales(this.rowCount), spec: initialSpec });
    }
  }

  async toggleWriteBack(enabled: boolean): Promise<void> {
    const pivot = this.table?.getPivot();
    if (!pivot) return;
    const spec = pivot.getSpec();
    if (enabled && !spec.values.some((value) => value.field === 'units')) {
      await pivot.updateSpec({ values: [...spec.values, { field: 'units', aggregator: 'sum', writeBack: { precision: 0 } }] });
    }
    await pivot.setOptions({ enableWriteBack: enabled });
  }

  async setRowDocking(value: string): Promise<void> {
    await this.table?.getPivot().setOptions({ pinGrandTotalRow: value === 'sticky' ? 'sticky' : value === 'pinned' });
  }

  async setColumnDocking(value: string): Promise<void> {
    await this.table?.getPivot().setOptions({ pinGrandTotalColumns: value === 'sticky' ? 'sticky' : value === 'pinned' });
  }

  setRtl(rtl: boolean): void {
    const pivot = this.table?.getPivot();
    if (!pivot) return;
    const container = document.querySelector<HTMLElement>('.grid48');
    if (!container) return;
    const { fields: currentFields, source, spec, ...options } = pivot.getOptions();
    const currentSpec = pivot.getSpec();
    this.table?.destroy();
    this.table = new SlickPivotTable(container, {
      ...options, fields: currentFields, source, spec: currentSpec,
      gridOptions: { enableCellNavigation: true, editable: true, autoEdit: false, rtl }, fieldList: { width: 320 },
    });
    Object.assign(window, { pivotTable: this.table, grid: this.table.getGrid(), pivot: this.table.getPivot() });
  }

  async toggleServerProvider(enabled: boolean): Promise<void> {
    const pivot = this.table?.getPivot();
    if (!pivot) {
      return;
    }
    await pivot.setOptions({
      provider: enabled
        ? {
            execute: async (request, { signal }) => {
              await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, 400);
                signal.addEventListener('abort', () => {
                  clearTimeout(timer);
                  reject(new DOMException('Aborted', 'AbortError'));
                }, { once: true });
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
    const spec = this.table?.getPivot().getSpec();
    this.savedSpec = spec ? structuredClone(spec) : undefined;
  }

  async restoreLayout(): Promise<void> {
    if (this.savedSpec) {
      await this.table?.getPivot().setSpec(this.savedSpec);
    }
  }

  async resetLayout(): Promise<void> {
    await this.table?.getPivot().setSpec(initialSpec);
  }
}
