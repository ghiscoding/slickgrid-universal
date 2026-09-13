import { type AureliaGridInstance, type Column, type Formatter, type GridOption, type ItemMetadata } from 'aurelia-slickgrid';
import './example58.scss';

const MONTH_FIELDS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const PERIOD_FIELDS = [...MONTH_FIELDS, 'q1', 'q2', 'q3', 'q4', 'ytd'] as const;

type MonthField = (typeof MONTH_FIELDS)[number];
type PeriodField = (typeof PERIOD_FIELDS)[number];
type SummaryKind = 'revenue' | 'expenses' | 'profit';

interface FinancialRow extends Record<PeriodField, number> {
  account: string;
  id: string;
  summaryKind?: SummaryKind;
}

const numberFormat = new Intl.NumberFormat('en-US');
const numberFormatter: Formatter<FinancialRow> = (_row, _cell, value) => numberFormat.format(Number(value));

const summaryAccountFormatter: Formatter<FinancialRow> = (_row, _cell, value, _column, item) =>
  item.summaryKind ? `<span class="financial-summary-label">${value}</span>` : value;

export class Example58 {
  aureliaGrid?: AureliaGridInstance;
  columns: Column[] = [];
  dataset: FinancialRow[] = [];
  gridOptions!: GridOption;
  subTitleStyle = 'display: block';

  constructor() {
    this.defineGrid();
  }

  attached() {
    this.dataset = this.getData();
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  private defineGrid() {
    const createPeriodColumn = (id: PeriodField, name: string, sticky = false): Column => ({
      id,
      name,
      field: id,
      cssClass: sticky ? 'financial-sticky-candidate' : 'financial-month-column',
      headerCssClass: sticky ? 'financial-sticky-candidate-header' : '',
      minWidth: 88,
      resizable: true,
      sortable: false,
      ...(sticky ? { sticky: 'both' as const } : {}),
      width: 96,
      formatter: numberFormatter,
    });

    this.columns = [
      {
        id: 'account',
        name: 'Account',
        field: 'account',
        cssClass: 'financial-account-column',
        headerCssClass: 'financial-account-header',
        minWidth: 160,
        sticky: 'both',
        resizable: true,
        sortable: false,
        width: 190,
        formatter: summaryAccountFormatter,
      },
      createPeriodColumn('jan', 'Jan'),
      createPeriodColumn('feb', 'Feb'),
      createPeriodColumn('mar', 'Mar'),
      createPeriodColumn('q1', 'Q1', true),
      createPeriodColumn('apr', 'Apr'),
      createPeriodColumn('may', 'May'),
      createPeriodColumn('jun', 'Jun'),
      createPeriodColumn('q2', 'Q2', true),
      createPeriodColumn('jul', 'Jul'),
      createPeriodColumn('aug', 'Aug'),
      createPeriodColumn('sep', 'Sep'),
      createPeriodColumn('q3', 'Q3', true),
      createPeriodColumn('oct', 'Oct'),
      createPeriodColumn('nov', 'Nov'),
      createPeriodColumn('dec', 'Dec'),
      createPeriodColumn('q4', 'Q4', true),
      {
        ...createPeriodColumn('ytd', 'YTD'),
        cssClass: 'financial-ytd-column financial-sticky-candidate',
        headerCssClass: 'financial-ytd-header financial-sticky-candidate-header',
        sticky: 'both',
      },
    ];

    this.gridOptions = {
      autoResize: { container: '#demo-container' },
      docking: {
        maxColumnViewportWidthPercent: 60,
        maxRowViewportHeightPercent: 45,
      },
      enableAutoResize: true,
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableTextSelectionOnCells: true,
      gridHeight: 510,
      gridWidth: 1050,
      rowHeight: 32,
      stickyRows: { both: ['total-revenue', 'total-expenses', 'net-profit'] },
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: FinancialRow): ItemMetadata | null =>
            item.summaryKind ? { cssClasses: `financial-summary-row financial-summary-${item.summaryKind}` } : null,
        },
      },
    };
  }

  private getData(): FinancialRow[] {
    const accounts = [
      'Product A sales',
      'Product B sales',
      'Product C sales',
      'License revenue',
      'Service revenue',
      'Support contracts',
      'Training income',
      'Consulting',
      'Hosting fees',
      'Hardware resale',
      'Royalties',
      'Interest income',
      'Partner rebates',
      'Marketplace sales',
      'Data subscriptions',
      'Maintenance renewals',
      'Professional services',
      'Implementation fees',
      'Usage overages',
      'Other operating income',
    ];
    const detailRows = accounts.map((account, index) => this.createFinancialRow(`account-${index}`, account, 3800 + index * 1275, index));
    const totalRevenue = this.createSummaryRow('total-revenue', 'Total Revenue', detailRows, 1, 'revenue');
    const totalExpenses = this.createSummaryRow('total-expenses', 'Total Expenses', detailRows, 0.69, 'expenses');
    const netProfit = this.createSummaryRow('net-profit', 'Net Profit', [totalRevenue, totalExpenses], 1, 'profit', true);
    const followOnDefinitions: Array<[string, string, number]> = [
      ['capex-memo', 'Capex (memo)', 5200],
      ['headcount-cost', 'Headcount cost', 2850],
      ['rnd-memo', 'R&D (memo)', 1900],
      ['grants-memo', 'Grants (memo)', 1500],
      ['fx-gain-loss', 'FX gain/loss', 4700],
      ['provisions', 'Provisions', 5600],
    ];
    const followOnRows = followOnDefinitions.map(([id, account, base], index) =>
      this.createFinancialRow(id, account, base, accounts.length + index)
    );

    return [...detailRows, totalRevenue, totalExpenses, netProfit, ...followOnRows];
  }

  private createFinancialRow(id: string, account: string, base: number, seed: number): FinancialRow {
    const months = Object.fromEntries(
      MONTH_FIELDS.map((month, monthIndex) => {
        const seasonalFactor = 0.8 + ((seed * 19 + monthIndex * 13) % 43) / 100;
        return [month, Math.round(base * seasonalFactor)];
      })
    ) as Record<MonthField, number>;

    return this.createRowFromMonths(id, account, months);
  }

  private createSummaryRow(
    id: string,
    account: string,
    source: FinancialRow[],
    factor: number,
    summaryKind: SummaryKind,
    subtractExpenses = false
  ): FinancialRow {
    const months = Object.fromEntries(
      MONTH_FIELDS.map((month) => {
        const total = subtractExpenses ? source[0][month] - source[1][month] : source.reduce((sum, row) => sum + row[month], 0) * factor;
        return [month, Math.round(total)];
      })
    ) as Record<MonthField, number>;

    return { ...this.createRowFromMonths(id, account, months), summaryKind };
  }

  private createRowFromMonths(id: string, account: string, months: Record<MonthField, number>): FinancialRow {
    const q1 = months.jan + months.feb + months.mar;
    const q2 = months.apr + months.may + months.jun;
    const q3 = months.jul + months.aug + months.sep;
    const q4 = months.oct + months.nov + months.dec;

    return { id, account, ...months, q1, q2, q3, q4, ytd: q1 + q2 + q3 + q4 };
  }

  toggleSubTitle() {
    this.subTitleStyle = this.subTitleStyle === 'display: block' ? 'display: none' : 'display: block';
    this.aureliaGrid?.resizerService?.resizeGrid();
  }
}
