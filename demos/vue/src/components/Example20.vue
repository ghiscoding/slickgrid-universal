<script setup lang="ts">
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  Editors,
  Filters,
  formatNumber,
  Formatters,
  SlickgridVue,
  type Column,
  type ColumnEditorDualInput,
  type GridOption,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';
import { showToast } from './utilities.js';

const NB_ITEMS = 500;
const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
const pinnedColumnCount = ref(2);
const pinnedRightColumnCount = ref(1);
const pinnedRowCount = ref(3);
const isPinnedBottom = ref(false);
const isSelectAllShownAsColumnTitle = ref(false);
let vueGrid!: SlickgridVueInstance;
let checkboxSelectorInstance: any;

const customEditableInputFormatter = (_row: number, _cell: number, value: any) => value ?? '';
const myCustomTitleValidator = (value: any) => {
  if (value === null || value === undefined || !value.length) {
    return { valid: false, msg: 'This is a required field' };
  }
  if (!/^Task\s\d+$/.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number' };
  }
  return { valid: true, msg: '' };
};

onBeforeMount(() => {
  defineGrid();
  dataset.value = mockData(NB_ITEMS);
});

function defineGrid() {
  columns.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      width: 120,
      minWidth: 100,
      sortable: true,
      filterable: true,
      editor: { model: Editors.longText, required: true, alwaysSaveOnEnterKey: true, validator: myCustomTitleValidator },
      formatter: customEditableInputFormatter,
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      width: 140,
      minWidth: 130,
      type: 'number',
      sortable: true,
      filterable: true,
      filter: { model: Filters.slider, operator: '>=' },
      editor: { model: Editors.singleSelect, collection: Array.from({ length: 101 }, (_v, i) => ({ value: i, label: i })) },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      type: 'dateIso',
      sortable: true,
      filterable: true,
      formatter: Formatters.dateIso,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      type: 'dateIso',
      sortable: true,
      filterable: true,
      formatter: Formatters.dateIso,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      sortable: true,
      filterable: true,
      formatter: Formatters.checkmarkMaterial,
      editor: { model: Editors.checkbox },
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
      },
    },
    {
      id: 'cost',
      name: 'Cost | Duration',
      field: 'cost',
      formatter: costDurationFormatter,
      sortable: true,
      filter: { model: Filters.compoundSlider },
      editor: {
        model: Editors.dualInput,
        params: {
          leftInput: {
            field: 'cost',
            type: 'float',
            decimal: 2,
            minValue: 0,
            maxValue: 50000,
            placeholder: '< 50K',
            errorMessage: 'Cost must be positive and below $50K.',
          },
          rightInput: { field: 'duration', type: 'float', minValue: 0, maxValue: 100, errorMessage: 'Duration must be between 0 and 100.' },
        } as ColumnEditorDualInput,
      },
    },
    { id: 'cityOfOrigin', name: 'City of Origin', field: 'cityOfOrigin', minWidth: 100, sortable: true, filterable: true, pinnable: false },
    {
      id: 'action',
      name: 'Action',
      field: 'action',
      width: 100,
      maxWidth: 100,
      excludeFromExport: true,
      formatter: () => '<div class="cell-menu-dropdown">Action<i class="mdi mdi-chevron-down"></i></div>',
      cellMenu: {
        commandTitle: 'Commands',
        commandItems: [
          { command: 'command1', title: 'Command 1' },
          { command: 'command2', title: 'Command 2', itemUsabilityOverride: (args: any) => !args.dataContext.completed },
          { command: 'delete-row', title: 'Delete Row', itemVisibilityOverride: (args: any) => !args.dataContext.completed },
          { divider: true, command: '' },
          { command: 'help', title: 'Help' },
          { command: 'something', title: 'Disabled Command', disabled: true },
        ],
        optionTitle: 'Change Complete Flag',
        optionItems: [
          { option: true, title: 'True' },
          { option: false, title: 'False' },
        ],
      },
    },
  ];

  gridOptions.value = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    // Keep the left-pinned columns compact so two right-pinned columns fit
    // beside the framework demo's route sidebar.
    autoFitColumnsOnFirstLoad: false,
    enableAutoResize: true,
    enableAutoSizeColumns: true,
    enableCellNavigation: true,
    enableFiltering: true,
    editable: true,
    autoEdit: true,
    enableExcelCopyBuffer: true,
    enableExcelExport: true,
    externalResources: [new ExcelExportService()],
    enableSelection: true,
    enableCheckboxSelector: true,
    selectionOptions: { selectActiveRow: false },
    checkboxSelector: {
      hideInColumnTitleRow: !isSelectAllShownAsColumnTitle.value,
      hideInFilterHeaderRow: isSelectAllShownAsColumnTitle.value,
      name: 'Sel',
      onExtensionRegistered: (instance: any) => (checkboxSelectorInstance = instance),
    },
    pinning: {
      columns: { left: ['_checkbox_selector', 'title', 'percentComplete'], right: ['action'] },
      rows: { top: getPinnedRowIndexes() },
    },
    enableCellMenu: true,
    cellMenu: {
      onCommand: (_e: unknown, args: any) => executeCommand(args),
      onOptionSelected: (_e: unknown, args: any) => {
        if (args?.dataContext && Object.prototype.hasOwnProperty.call(args.dataContext, 'completed')) {
          args.dataContext.completed = args.item.option;
          vueGrid?.gridService?.updateItem(args.dataContext);
        }
      },
    },
    enableContextMenu: true,
    contextMenu: getContextMenuOptions(),
    gridMenu: { hideClearPinningCommand: false },
    headerMenu: { hidePinColumnCommand: false, hidePinningColumnsCommand: false },
  };
}

function mockData(count: number) {
  return Array.from({ length: count }, (_v, i) => ({
    id: i,
    title: `Task ${i}`,
    duration: i % 8 ? `${Math.round(Math.random() * 100)}` : null,
    percentComplete: Math.round(Math.random() * 100),
    start: new Date(2009, 0, 1),
    finish: new Date(2009, 4, 5),
    cost: i % 33 === 0 ? null : Math.random() * 10000,
    completed: i % 5 === 0,
    cityOfOrigin: i % 2 ? 'Vancouver, BC, Canada' : 'Boston, MA, United States',
  }));
}

function getPinnedRowIndexes() {
  const count = Math.max(0, Number(pinnedRowCount.value) || 0);
  const dataLength = vueGrid?.slickGrid?.getDataLength?.() ?? dataset.value.length;
  const first = isPinnedBottom.value ? Math.max(0, dataLength - count) : 0;
  return Array.from({ length: count }, (_v, i) => first + i);
}

function costDurationFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, dataContext: any) {
  const costText = isNullUndefinedOrEmpty(dataContext.cost) ? 'n/a' : formatNumber(dataContext.cost, 0, 2, false, '$', '', '.', ',');
  const durationText =
    !isNullUndefinedOrEmpty(dataContext.duration) && dataContext.duration >= 0
      ? `${dataContext.duration} ${dataContext.duration > 1 ? 'days' : 'day'}`
      : 'n/a';
  return `<b>${costText}</b> | ${durationText}`;
}
function isNullUndefinedOrEmpty(data: any) {
  return data === '' || data === null || data === undefined;
}

function getContextMenuOptions(): any {
  const percentItems = [
    { option: 0, title: 'Not Started (0%)' },
    { option: 50, title: 'Half Completed (50%)' },
    { option: 100, title: 'Completed (100%)' },
  ];
  return {
    optionShownOverColumnIds: ['percentComplete'],
    hideCloseButton: true,
    dropSide: 'right',
    optionTitle: 'Change Percent Complete',
    optionItems: [
      ...percentItems,
      'divider',
      { option: null, title: 'Sub-Options (demo)', subMenuTitle: 'Set Percent Complete', optionItems: percentItems },
    ],
    commandItems: [
      { command: '', divider: true, positionOrder: 98 },
      {
        command: 'export',
        title: 'Exports',
        positionOrder: 99,
        commandItems: [
          { command: 'exports-txt', title: 'Text (tab delimited)' },
          {
            command: 'sub-menu',
            title: 'Excel',
            subMenuTitle: 'available formats',
            commandItems: [
              { command: 'exports-csv', title: 'Excel (csv)' },
              { command: 'exports-xlsx', title: 'Excel (xlsx)' },
            ],
          },
        ],
      },
      {
        command: 'feedback',
        title: 'Feedback',
        positionOrder: 100,
        commandItems: [
          { command: 'request-update', title: 'Request update from supplier' },
          'divider',
          {
            command: 'sub-menu',
            title: 'Contact Us',
            subMenuTitle: 'contact us...',
            commandItems: [
              { command: 'contact-email', title: 'Email us' },
              { command: 'contact-chat', title: 'Chat with us' },
              { command: 'contact-meeting', title: 'Book an appointment' },
            ],
          },
        ],
      },
    ],
    onOptionSelected: (_e: unknown, args: any) => {
      if (args?.dataContext) {
        args.dataContext.percentComplete = args.item.option;
        vueGrid?.slickGrid?.updateRow(args.row || 0);
      }
    },
    onCommand: (_e: unknown, args: any) => executeCommand(args),
  };
}

function executeCommand(args: any) {
  switch (args.command) {
    case 'delete-row':
      if (confirm(`Do you really want to delete row (${args.row + 1}) with "${args.dataContext.title}"?`)) {
        vueGrid?.gridService?.deleteItemById(args.dataContext.id);
      }
      break;
    case 'command1':
    case 'command2':
    case 'help':
      alert(args.item.title);
      break;
    case 'exports-csv':
    case 'exports-txt':
    case 'exports-xlsx':
      alert(`Exporting as ${args.item.title}`);
      break;
    default:
      alert(`Command: ${args.command}`);
  }
}

function setPinnedColumns(left: number, right = pinnedRightColumnCount.value) {
  const nextRight = Math.max(0, Number(right) || 0);
  // Keep both edges stable by column ID. Numeric edge shorthands are resolved
  // against visible indexes, which can shift when columns are hidden/shown.
  const leftIds = left >= 0 ? ['_checkbox_selector', 'title', 'percentComplete'].slice(0, left + 1) : [];
  const rightIds = ['cityOfOrigin', 'action'].slice(Math.max(0, 2 - nextRight));
  vueGrid?.slickGrid?.setOptions({ pinning: { columns: { left: leftIds, right: rightIds } } });
  pinnedColumnCount.value = left;
  pinnedRightColumnCount.value = nextRight;
}
function changePinnedColumnCount() {
  setPinnedColumns(Number(pinnedColumnCount.value), pinnedRightColumnCount.value);
}
function changePinnedRightColumnCount() {
  setPinnedColumns(pinnedColumnCount.value, Number(pinnedRightColumnCount.value));
}
function toggleRightPinning() {
  setPinnedColumns(pinnedColumnCount.value, pinnedRightColumnCount.value > 0 ? 0 : 1);
}
function changePinnedRowCount() {
  vueGrid?.slickGrid?.setOptions({
    pinning: { rows: isPinnedBottom.value ? { top: [], bottom: getPinnedRowIndexes() } : { top: getPinnedRowIndexes(), bottom: [] } },
  });
}
function removePinnedColumns() {
  setPinnedColumns(-1, 0);
}
function togglePinnedBottomRows() {
  isPinnedBottom.value = !isPinnedBottom.value;
  changePinnedRowCount();
}
function toggleWhichRowToShowSelectAll() {
  isSelectAllShownAsColumnTitle.value = !isSelectAllShownAsColumnTitle.value;
  checkboxSelectorInstance?.setOptions({
    hideInColumnTitleRow: !isSelectAllShownAsColumnTitle.value,
    hideInFilterHeaderRow: isSelectAllShownAsColumnTitle.value,
  });
}
function setLargePinnedColumns() {
  vueGrid?.gridStateService?.applyColumnLayout?.(
    [
      { columnId: '_checkbox_selector', cssClass: 'slick-cell-checkboxsel', headerCssClass: '', width: 40 },
      { columnId: 'title', cssClass: '', headerCssClass: '', width: 220 },
      { columnId: 'percentComplete', cssClass: '', headerCssClass: '', width: 280 },
      { columnId: 'start', cssClass: '', headerCssClass: '', width: 150 },
      { columnId: 'finish', cssClass: '', headerCssClass: '', width: 280 },
      { columnId: 'completed', cssClass: '', headerCssClass: '', width: 180 },
      { columnId: 'cost', cssClass: '', headerCssClass: '', width: 220 },
      { columnId: 'cityOfOrigin', cssClass: '', headerCssClass: '', width: 180 },
      { columnId: 'action', cssClass: '', headerCssClass: '', width: 110 },
    ],
    false,
    false
  );
  setPinnedColumns(2, pinnedRightColumnCount.value);
}
function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid?.resizerService?.resizeGrid());
}
function onCellValidationError(_e: Event, args: any) {
  showToast(args.validationResults.msg, 'danger');
}
function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>

<template>
  <h2>
    Example 20: Pinned Columns/Rows
    <span class="float-end"
      ><a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example20.vue"
        ><span class="mdi mdi-link-variant"></span> code</a
      ></span
    ><button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>
  <div class="subtitle">
    This example demonstrates the use of Pinned (aka pinned) Columns and/or Rows (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/pinning"
      target="_blank"
      >Wiki docs</a
    >)
    <ul>
      <li>Option to pin any number of columns or rows</li>
      <li>Option to pin the rows at the bottom instead of the top (default)</li>
      <li>You can dynamically change these options through SlickGrid setOptions()</li>
    </ul>
  </div>
  <br />
  <div class="row">
    <div class="col-sm-12">
      <span
        ><label>Pinned Rows: </label><input v-model="pinnedRowCount" type="number" min="-1" /><button
          class="btn btn-outline-secondary btn-xs btn-icon mx-1"
          @click="changePinnedRowCount()"
        >
          Set
        </button></span
      >
      <span style="margin-left: 10px"
        ><label>Pinned Columns: </label><input v-model="pinnedColumnCount" type="number" min="-1" /><button
          class="btn btn-outline-secondary btn-xs btn-icon mx-1"
          @click="changePinnedColumnCount()"
        >
          Set
        </button></span
      >
      <span style="margin-left: 10px"
        ><label>Pinned Right: </label
        ><input v-model="pinnedRightColumnCount" class="pinned-right-column-count" type="number" min="0" /><button
          class="btn btn-outline-secondary btn-xs btn-icon mx-1"
          data-test="set-pinned-right-column"
          @click="changePinnedRightColumnCount()"
        >
          Set
        </button></span
      >
    </div>
  </div>
  <div class="row mt-2">
    <div class="col-sm-12">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="remove-pinned-column-button" @click="removePinnedColumns()">
        <i class="mdi mdi-close"></i> Remove Pinned Columns
      </button>
      <button
        class="btn btn-outline-secondary btn-sm btn-icon mx-1"
        data-test="set-3pinned-columns"
        @click="setPinnedColumns(2, pinnedRightColumnCount)"
      >
        <i class="mdi mdi-pin-outline"></i> Pin 3 Columns
      </button>
      <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="toggle-pinned-right" @click="toggleRightPinning()">
        <i class="mdi mdi-pin-outline"></i> Toggle Pinned Right
      </button>
      <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="toggle-pinned-bottom" @click="togglePinnedBottomRows()">
        <i class="mdi mdi-flip-vertical"></i> Toggle Pinned Rows (top/bottom)
      </button>
      <button
        class="btn btn-outline-secondary btn-sm btn-icon mx-1"
        data-test="toggle-select-all-row"
        @click="toggleWhichRowToShowSelectAll()"
      >
        <i class="mdi mdi-checkbox-marked-circle-outline"></i> Toggle Select All
      </button>
      <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-large-pinned-columns" @click="setLargePinnedColumns()">
        <i class="mdi mdi-arrow-expand-horizontal"></i> Set Large Columns
      </button>
    </div>
  </div>
  <div class="col-sm-12"><hr /></div>
  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columns"
    v-model:dataset="dataset"
    grid-id="grid20"
    @onValidationError="onCellValidationError($event.detail.eventData, $event.detail.args)"
    @onVueGridCreated="vueGridReady($event.detail)"
  />
</template>

<style lang="scss" scoped>
.slick-pane-bottom {
  border-top: 1px solid #969696 !important;
}
</style>
