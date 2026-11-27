<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { tick } from 'svelte';
  import './example07.scss';

  const NB_ITEMS = 200;
  const columns1WithHighlightingById: Record<string, boolean> = {};
  const columns2WithHighlightingById: Record<string, boolean> = {};

  let showSubTitle = $state(true);
  let svelteGrid1!: SlickgridSvelteInstance;
  let svelteGrid2!: SlickgridSvelteInstance;

  const gridOptions1: GridOption = {
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
  const gridOptions2: GridOption = {
    ...gridOptions1,
    enableHeaderMenu: true,
    enableFiltering: true,
    headerButton: {
      onCommand: (_e: any, args) => handleOnCommand(_e, args, 2),
    },
  };

  const columns1 = defineColumns(1);
  const columns2 = defineColumns(2);
  const dataset1 = loadData(NB_ITEMS, columns1.length);
  const dataset2 = loadData(NB_ITEMS, columns2.length);

  function handleOnCommand(_e: Event, args: any, gridNo: 1 | 2) {
    const column = args.column;
    const button = args.button;
    const command = args.command;

    if (command === 'toggle-highlight') {
      const columnsWithHighlightingById = gridNo === 1 ? columns1WithHighlightingById : columns2WithHighlightingById;
      if (button.cssClass === 'mdi mdi-lightbulb-on text-danger') {
        delete columnsWithHighlightingById[column.id];
        button.cssClass = 'mdi mdi-lightbulb-outline text-warning faded';
        button.tooltip = 'Highlight negative numbers.';
      } else {
        columnsWithHighlightingById[column.id] = true;
        button.cssClass = 'mdi mdi-lightbulb-on text-danger';
        button.tooltip = 'Remove highlight.';
      }

      if (gridNo === 1) {
        svelteGrid1.slickGrid.invalidate();
      } else {
        svelteGrid2.slickGrid.invalidate();
      }
    }
  }

  function defineColumns(gridNo: 1 | 2) {
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

    return cols;
  }

  function loadData(count: number, columnCount: number) {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      const d: any = (mockDataset[i] = {});
      d['id'] = i;
      for (let j = 0; j < columnCount; j++) {
        d[j] = Math.round(Math.random() * 10) - 5;
      }
    }
    return mockDataset;
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    svelteGrid1.resizerService.resizeGrid();
    svelteGrid2.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 7: Header Button Plugin
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example07.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

<div class="subtitle" class:hidden={!showSubTitle}>
  This example demonstrates using the <b>SlickHeaderButtons</b> plugin to easily add buttons to colum headers. These buttons can be
  specified directly in the column definition, and are very easy to configure and use. (<a
    href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/header-menu-header-buttons"
    target="_blank"
  >
    Wiki docs
  </a>)
  <ul>
    <li>Resize the 1st column to see all icon/command</li>
    <li>Mouse hover the 2nd column to see it's icon/command</li>
    <li>For all the other columns, click on top-right red circle icon to enable highlight of negative numbers.</li>
    <li>Use override callback functions to change the properties of show/hide, enable/disable the menu or certain item(s) from the list</li>
    <ol>
      <li>These callbacks are: "itemVisibilityOverride", "itemUsabilityOverride"</li>
      <li>for example the "Column E" does not show the header button via "itemVisibilityOverride"</li>
      <li>for example the "Column J" header button is displayed but it not usable via "itemUsabilityOverride"</li>
    </ol>
  </ul>
</div>

<h5>Grid 1</h5>

<SlickgridSvelte
  gridId="grid7-1"
  columns={columns1}
  options={gridOptions1}
  dataset={dataset1}
  onSvelteGridCreated={(instance) => (svelteGrid1 = instance)}
/>

<br />

<h5>Grid 2 - <span class="subtitle">with both Header Buttons & Menus</span></h5>

<SlickgridSvelte
  gridId="grid7-2"
  columns={columns2}
  options={gridOptions2}
  dataset={dataset2}
  onSvelteGridCreated={(instance) => (svelteGrid2 = instance)}
/>
