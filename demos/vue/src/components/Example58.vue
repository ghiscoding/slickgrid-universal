<script setup lang="ts">
import { SlickgridVue, type Column, type Formatter, type GridOption, type ItemMetadata, type SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';
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

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset: Ref<FinancialRow[]> = ref([]);
const subTitleStyle = ref('display: block');
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  dataset.value = getData();
});

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}

function defineGrid() {
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

  columns.value = [
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

  gridOptions.value = {
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

function getData(): FinancialRow[] {
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
  const detailRows = accounts.map((account, index) => createFinancialRow(`account-${index}`, account, 3800 + index * 1275, index));
  const totalRevenue = createSummaryRow('total-revenue', 'Total Revenue', detailRows, 1, 'revenue');
  const totalExpenses = createSummaryRow('total-expenses', 'Total Expenses', detailRows, 0.69, 'expenses');
  const netProfit = createSummaryRow('net-profit', 'Net Profit', [totalRevenue, totalExpenses], 1, 'profit', true);
  const followOnDefinitions: Array<[string, string, number]> = [
    ['capex-memo', 'Capex (memo)', 5200],
    ['headcount-cost', 'Headcount cost', 2850],
    ['rnd-memo', 'R&D (memo)', 1900],
    ['grants-memo', 'Grants (memo)', 1500],
    ['fx-gain-loss', 'FX gain/loss', 4700],
    ['provisions', 'Provisions', 5600],
  ];
  const followOnRows = followOnDefinitions.map(([id, account, base], index) =>
    createFinancialRow(id, account, base, accounts.length + index)
  );

  return [...detailRows, totalRevenue, totalExpenses, netProfit, ...followOnRows];
}

function createFinancialRow(id: string, account: string, base: number, seed: number): FinancialRow {
  const months = Object.fromEntries(
    MONTH_FIELDS.map((month, monthIndex) => {
      const seasonalFactor = 0.8 + ((seed * 19 + monthIndex * 13) % 43) / 100;
      return [month, Math.round(base * seasonalFactor)];
    })
  ) as Record<MonthField, number>;

  return createRowFromMonths(id, account, months);
}

function createSummaryRow(
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

  return { ...createRowFromMonths(id, account, months), summaryKind };
}

function createRowFromMonths(id: string, account: string, months: Record<MonthField, number>): FinancialRow {
  const q1 = months.jan + months.feb + months.mar;
  const q2 = months.apr + months.may + months.jun;
  const q3 = months.jul + months.aug + months.sep;
  const q4 = months.oct + months.nov + months.dec;

  return { id, account, ...months, q1, q2, q3, q4, ytd: q1 + q2 + q3 + q4 };
}

function toggleSubTitle() {
  subTitleStyle.value = subTitleStyle.value === 'display: block' ? 'display: none' : 'display: block';
  vueGrid?.resizerService?.resizeGrid();
}
</script>

<template>
  <div id="demo-container" class="container-fluid">
    <h2>
      Example 58: Sticky Financial Report
      <span class="float-end">
        <a
          style="font-size: 18px"
          target="_blank"
          href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example58.vue"
        >
          <span class="mdi mdi-link-variant"></span> code
        </a>
      </span>
      <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle">
        <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
      </button>
    </h2>

    <h6 class="italic content example-details" :style="{ display: subTitleStyle === 'display: block' ? 'block' : 'none' }">
      Financial report fixture for the sticky rows/columns design. Account, Q1–Q4, and YTD dock to whichever edge is closest after normal
      scrolling would clip them. Total Revenue, Total Expenses, and Net Profit also use two-sided stickiness and dock to whichever vertical
      edge is closest after they have been seen.
    </h6>

    <div class="financial-report-grid">
      <slickgrid-vue
        grid-id="grid58"
        :columns="columns"
        :options="gridOptions"
        :dataset="dataset"
        @onVueGridCreated="vueGridReady($event.detail)"
      ></slickgrid-vue>
    </div>

    <div class="financial-report-legend">
      <span><i class="financial-report-legend-swatch financial-report-legend-account"></i> left sticky column</span>
      <span><i class="financial-report-legend-swatch financial-report-legend-total"></i> bottom sticky row</span>
      <span><i class="financial-report-legend-swatch financial-report-legend-intersection"></i> sticky intersection</span>
      <span><i class="financial-report-legend-swatch financial-report-legend-sticky"></i> sticky quarter</span>
    </div>
  </div>
</template>
