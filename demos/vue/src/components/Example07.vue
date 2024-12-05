<script setup lang="ts">
import type { GridOption, SlickgridVueInstance } from 'slickgrid-vue';
import { type Column, SlickgridVue } from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

const NB_ITEMS = 200;
let columns1WithHighlightingById: any = {};
let columns2WithHighlightingById: any = {};

const gridOptions1 = ref<GridOption>();
const gridOptions2 = ref<GridOption>();
const columnDefinitions1 = ref<Column[]>([]);
const columnDefinitions2 = ref<Column[]>([]);
const dataset1 = ref<any[]>([]);
const dataset2 = ref<any[]>([]);
const showSubTitle = ref(true);
let vueGrid1!: SlickgridVueInstance;
let vueGrid2!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrids();
  columns1WithHighlightingById = {};
  columns2WithHighlightingById = {};

  // populate the dataset once the grid is ready
  dataset1.value = loadData(NB_ITEMS, 1);
  dataset2.value = loadData(NB_ITEMS, 2);
});

/* Define grid Options and Columns */
function defineGrids() {
  columnDefinitions1.value = [];
  columnDefinitions2.value = [];

  gridOptions1.value = {
    enableAutoResize: true,
    enableHeaderButton: true,
    enableHeaderMenu: false,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableFiltering: false,
    enableExcelCopyBuffer: true,
    excelCopyBufferOptions: {
      onCopyCells: (e, args) => console.log('onCopyCells', e, args),
      onPasteCells: (e, args) => console.log('onPasteCells', e, args),
      onCopyCancelled: (e, args) => console.log('onCopyCancelled', e, args),
    },
    enableCellNavigation: true,
    gridHeight: 275,
    headerButton: {
      // you can use the "onCommand" (in Grid Options) and/or the "action" callback (in Column Definition)
      onCommand: (_e: any, args) => handleOnCommand(_e, args, 1),
    },
  };

  // grid 2 options, same as grid 1 + extras
  gridOptions2.value = {
    ...gridOptions1.value,
    enableHeaderMenu: true,
    enableFiltering: true,
    // frozenColumn: 2,
    // frozenRow: 2,
    headerButton: {
      onCommand: (_e: any, args) => handleOnCommand(_e, args, 2),
    },
  };
}

function handleOnCommand(_e: Event, args: any, gridNo: 1 | 2) {
  const column = args.column;
  const button = args.button;
  const command = args.command;

  if (command === 'toggle-highlight') {
    if (button.cssClass === 'mdi mdi-lightbulb-on text-danger') {
      if (gridNo === 1) {
        delete columns1WithHighlightingById[column.id];
      } else {
        delete columns2WithHighlightingById[column.id];
      }
      button.cssClass = 'mdi mdi-lightbulb-outline text-warning faded';
      button.tooltip = 'Highlight negative numbers.';
    } else {
      if (gridNo === 1) {
        columns1WithHighlightingById[column.id] = true;
      } else {
        columns2WithHighlightingById[column.id] = true;
      }
      button.cssClass = 'mdi mdi-lightbulb-on text-danger';
      button.tooltip = 'Remove highlight.';
    }

    if (gridNo === 1) {
      vueGrid1.slickGrid.invalidate();
    } else {
      vueGrid2.slickGrid.invalidate();
    }
  }
}

function loadData(count: number, gridNo: 1 | 2) {
  const cols: Column[] = [];

  // Set up some test columns.
  for (let i = 0; i < 10; i++) {
    cols.push({
      id: i,
      name: 'Column ' + String.fromCharCode('A'.charCodeAt(0) + i),
      field: i + '',
      width: i === 0 ? 70 : 100, // have the 2 first columns wider
      filterable: true,
      sortable: true,
      formatter: (_row, _cell, value, columnDef) => {
        if (gridNo === 1 && columns1WithHighlightingById[columnDef.id] && value < 0) {
          return `<div style="color:red; font-weight:bold;">${value}</div>`;
        } else if (gridNo === 2 && columns2WithHighlightingById[columnDef.id] && value < 0) {
          return `<div style="color:red; font-weight:bold;">${value}</div>`;
        }
        return value;
      },
      header: {
        buttons: [
          {
            cssClass: 'mdi mdi-lightbulb-outline text-warning faded',
            command: 'toggle-highlight',
            tooltip: 'Highlight negative numbers.',
            itemVisibilityOverride: (args) => {
              // for example don't show the header button on column "E"
              return args.column.name !== 'Column E';
            },
            itemUsabilityOverride: (args) => {
              // for example the button usable everywhere except on last column ='J"
              return args.column.name !== 'Column J';
            },
            action: (_e, args) => {
              // you can use the "action" callback and/or subscribe to the "onCallback" event, they both have the same arguments
              // do something
              console.log(`execute a callback action to "${args.command}" on ${args.column.name}`);
            },
          },
        ],
      },
    });
  }

  // Set multiple buttons on the first column to demonstrate overflow.
  cols[0].name = 'Resize me!';
  cols[0].header = {
    buttons: [
      {
        cssClass: 'mdi mdi-message-text',
        handler: () => {
          alert('Tag');
        },
      },
      {
        cssClass: 'mdi mdi-forum-outline',
        handler: () => {
          alert('Comment');
        },
      },
      {
        cssClass: 'mdi mdi-information',
        handler: () => {
          alert('Info');
        },
      },
      {
        cssClass: 'mdi mdi-help-circle',
        handler: () => {
          alert('Help');
        },
      },
    ],
  };

  // when floating to left, you might want to inverse the icon orders
  if (gridNo === 2) {
    cols[0].header?.buttons?.reverse();
  }

  // Set a button on the second column to demonstrate hover.
  cols[1].name = 'Hover me!';
  cols[1].header = {
    buttons: [
      {
        cssClass: 'mdi mdi-help-circle',
        showOnHover: true,
        tooltip: 'This button only appears on hover.',
        handler: () => {
          alert('Help');
        },
      },
    ],
  };

  // mock a dataset
  const mockDataset: any[] = [];
  for (let i = 0; i < count; i++) {
    const d: any = (mockDataset[i] = {});
    d['id'] = i;
    for (let j = 0; j < cols.length; j++) {
      d[j] = Math.round(Math.random() * 10) - 5;
    }
  }

  // assign column definitions only once
  if (gridNo === 1) {
    columnDefinitions1.value = cols;
  } else {
    columnDefinitions2.value = cols;
  }

  return mockDataset;
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => {
    vueGrid1.resizerService.resizeGrid();
    vueGrid2.resizerService.resizeGrid();
  });
}

function vueGrid1Ready(grid: SlickgridVueInstance) {
  vueGrid1 = grid;
}

function vueGrid2Ready(grid: SlickgridVueInstance) {
  vueGrid2 = grid;
}
</script>

<template>
  <h2>
    Example 7: Header Button Plugin
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
       href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/example07.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    This example demonstrates using the <b>Slick.Plugins.HeaderButtons</b> plugin to easily add buttons to colum headers. These buttons can
    be specified directly in the column definition, and are very easy to configure and use. (<a
      href="https://ghiscoding.gitbook.io/aurelia-slickgrid/grid-functionalities/header-menu-header-buttons"
      target="_blank"
      >Wiki docs</a
    >)
    <ul>
      <li>Resize the 1st column to see all icon/command</li>
      <li>Mouse hover the 2nd column to see it's icon/command</li>
      <li>For all the other columns, click on top-right red circle icon to enable highlight of negative numbers.</li>
      <li>
        Use override callback functions to change the properties of show/hide, enable/disable the menu or certain item(s) from the list
      </li>
      <ol>
        <li>These callbacks are: "itemVisibilityOverride", "itemUsabilityOverride"</li>
        <li>for example the "Column E" does not show the header button via "itemVisibilityOverride"</li>
        <li>for example the "Column J" header button is displayed but it not usable via "itemUsabilityOverride"</li>
      </ol>
    </ul>
  </div>

  <h5>Grid 1</h5>

  <slickgrid-vue
    v-model:options="gridOptions1!"
    v-model:columns="columnDefinitions1 as Column[]"
    v-model:data="dataset1"
    grid-id="grid7-1"
    @onVueGridCreated="vueGrid1Ready($event.detail)"
  >
  </slickgrid-vue>

  <br />

  <h5>Grid 2 - <span class="subtitle">with both Header Buttons & Menus</span></h5>

  <slickgrid-vue
    v-model:options="gridOptions2!"
    v-model:columns="columnDefinitions2 as Column[]"
    v-model:data="dataset2"
    grid-id="grid7-2"
    @onVueGridCreated="vueGrid2Ready($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss" scoped>
/* 1st grid */
#grid7-1 {
  --slick-header-button-float: right;
}

/* 2nd grid */
#grid7-2 {
  --slick-header-button-margin: 4px 0 50px 0;
  --slick-header-button-float: left;
}
</style>
