<script setup lang="ts">
import {
  Editors,
  SlickgridVue,
  SlickSelectionUtils,
  type Column,
  type GridOption,
  type OnDragReplaceCellsEventArgs,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount, onUnmounted, ref, type Ref } from 'vue';

const NB_ITEMS = 100;

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const isDarkMode = ref(false);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();

  // mock some data (different in each dataset)
  dataset.value = getData(NB_ITEMS);
});

onUnmounted(() => {
  document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
  document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
});

/* Define grid Options and Columns */
function defineGrid() {
  const colDefs: Column[] = [
    {
      id: 'selector',
      name: '',
      field: 'num',
      width: 30,
    },
  ];

  for (let i = 0; i < NB_ITEMS; i++) {
    colDefs.push({
      id: i,
      name:
        i < 26
          ? String.fromCharCode('A'.charCodeAt(0) + (i % 26))
          : String.fromCharCode('A'.charCodeAt(0) + Math.floor(i / 26) - 1) + String.fromCharCode('A'.charCodeAt(0) + (i % 26)),
      field: String(i),
      minWidth: 60,
      width: 60,
      editor: { model: Editors.text },
    });
  }

  columnDefinitions.value = colDefs;

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableCellNavigation: true,
    autoEdit: true,
    autoCommitEdit: true,
    darkMode: isDarkMode.value,
    editable: true,
    headerRowHeight: 35,
    // rowHeight: 30,
    editorNavigateOnArrows: true, // enable editor navigation using arrow keys

    // enable new hybrid selection model (rows & cells)
    enableHybridSelection: true,
    rowSelectionOptions: {
      selectActiveRow: true,
      rowSelectColumnIds: ['selector'],
    },

    // when using the ExcelCopyBuffer, you can see what the selection range is
    enableExcelCopyBuffer: true,
    excelCopyBufferOptions: {
      copyActiveEditorCell: true,
      removeDoubleQuotesOnPaste: true,
      replaceNewlinesWith: ' ',
    },
  };
}

/** Copy the dragged cell values to other cells that are part of the extended drag-fill selection */
function copyDraggedCellRange(args: OnDragReplaceCellsEventArgs) {
  const verticalTargetRange = SlickSelectionUtils.verticalTargetRange(args.prevSelectedRange, args.selectedRange);
  const horizontalTargetRange = SlickSelectionUtils.horizontalTargetRange(args.prevSelectedRange, args.selectedRange);
  const cornerTargetRange = SlickSelectionUtils.cornerTargetRange(args.prevSelectedRange, args.selectedRange);

  if (verticalTargetRange) {
    SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, verticalTargetRange, args.grid);
  }
  if (horizontalTargetRange) {
    SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, horizontalTargetRange, args.grid);
  }
  if (cornerTargetRange) {
    SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, cornerTargetRange, args.grid);
  }
}

function getData(itemCount: number) {
  // mock a dataset
  const datasetTmp: any[] = [];
  for (let i = 0; i < itemCount; i++) {
    const d: any = (datasetTmp[i] = {});
    d['id'] = i;
    d['num'] = i;
  }

  return datasetTmp;
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  toggleBodyBackground();
  vueGrid.slickGrid?.setOptions({ darkMode: isDarkMode.value });
}

function toggleBodyBackground() {
  if (isDarkMode.value) {
    document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
  } else {
    document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
  }
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>

<template>
  <div class="demo49">
    <h2>
      Example 49: Spreadsheet Drag-Fill
      <span class="float-end font18">
        see&nbsp;
        <a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example49.vue">
          <span class="mdi mdi-link-variant"></span> code
        </a>
      </span>
      <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle">
        <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
      </button>
      <button class="btn btn-outline-secondary btn-sm btn-icon ms-2" @click="toggleDarkMode" data-test="toggle-dark-mode">
        <span class="mdi mdi-theme-light-dark"></span>
        <span>Toggle Dark Mode</span>
      </button>
    </h2>

    <div class="subtitle">
      Spreadsheet with drag-fill, hybrid selection model. Type a few values in the grid and then select those cells and use the bottom right
      drag handle spread the selection and auto-fill the values to other cells. Use <code>onDragReplaceCells</code> event to customize the
      drag-fill behavior. Use <code>enableHybridSelection</code> grid option to enable the new Hybrid Selection Model.
    </div>

    <br />

    <slickgrid-vue
      v-model:options="gridOptions"
      v-model:columns="columnDefinitions"
      v-model:data="dataset"
      grid-id="grid49"
      @onVueGridCreated="vueGridReady($event.detail)"
      @onDragReplaceCells="copyDraggedCellRange($event.detail.args)"
    >
    </slickgrid-vue>
  </div>
</template>
<style lang="scss">
/** override slick-cell to make it look like Excel sheet */
.demo49 {
  --slick-border-color: #d4d4d4;
  --slick-cell-odd-background-color: #fbfbfb;
  --slick-cell-border-left: 1px solid var(--slick-border-color);
  --slick-header-menu-display: none;
  --slick-header-column-height: 20px;
  --slick-grid-border-color: #d4d4d4;
  --slick-cell-selected-color: #d4ebfd;
  --slick-row-selected-color: #d4ebfd;
  --slick-text-editor-border: 0px;
  --slick-text-editor-focus-box-shadow: none;

  .slick-cell.copied {
    background: blue;
    background: rgba(0, 0, 255, 0.2);
    transition: 0.5s background;
  }
  .slick-dark-mode {
    --slick-border-color: #595959;
    --slick-cell-border-left: 1px solid #595959;
    --slick-grid-border-color: #434343;
    --slick-cell-selected-color: #434343;
    --slick-row-selected-color: #434343;
    --slick-cell-selected-editable-color: #333333;
  }
}
</style>
