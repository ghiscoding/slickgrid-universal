<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  let grid1: SlickgridSvelteInstance;
  let showSubTitle = true;
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => {
      grid1?.resizerService?.resizeGrid();
      grid2?.resizerService?.resizeGrid();
    });
  }
  let grid2: SlickgridSvelteInstance;
  let message = '';
  const highlighted: Array<Record<string, boolean>> = [{}, {}];
  function toggleHighlight(args: any, index: number) {
    if (args.command !== 'toggle-highlight') {
      return;
    }
    const id = String(args.column.id);
    highlighted[index][id] = !highlighted[index][id];
    args.button.cssClass = highlighted[index][id] ? 'mdi mdi-lightbulb-on text-danger' : 'mdi mdi-lightbulb-outline text-warning faded';
    args.button.tooltip = highlighted[index][id] ? 'Remove highlight.' : 'Highlight negative numbers.';
    (index === 0 ? grid1 : grid2).slickGrid.invalidate();
  }
  function makeColumns(index: number): Column[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: i === 0 ? 'Resize me!' : i === 1 ? 'Hover me!' : `Column ${String.fromCharCode(65 + i)}`,
      field: String(i),
      sortable: true,
      filterable: true,
      width: i === 0 ? 70 : 100,
      formatter: (_row, _cell, value, column) =>
        highlighted[index][String(column.id)] && value < 0 ? `<div style="color:red; font-weight:bold;">${value}</div>` : value,
      header: {
        buttons:
          i === 0
            ? [
                { cssClass: 'mdi mdi-message-text', tooltip: 'Tag', handler: () => (message = 'Tag') },
                { cssClass: 'mdi mdi-forum-outline', tooltip: 'Comment', handler: () => (message = 'Comment') },
                { cssClass: 'mdi mdi-information', tooltip: 'Info', handler: () => (message = 'Info') },
                { cssClass: 'mdi mdi-help-circle', tooltip: 'Help', handler: () => (message = 'Help') },
              ]
            : [
                {
                  cssClass: i === 1 ? 'mdi mdi-help-circle' : 'mdi mdi-lightbulb-outline text-warning faded',
                  command: 'toggle-highlight',
                  showOnHover: i === 1,
                  tooltip: i === 1 ? 'This button only appears on hover.' : 'Highlight negative numbers.',
                  itemVisibilityOverride: () => i !== 4,
                  itemUsabilityOverride: () => i !== 9,
                  action: (_event: Event, args: any) =>
                    console.log(`execute a callback action to "${args.command}" on ${args.column.name}`),
                },
              ],
      },
    }));
  }
  const columns1 = makeColumns(0);
  const columns2 = makeColumns(1);
  const dataset1 = Array.from({ length: 200 }, (_, id) =>
    Object.fromEntries([['id', id], ...Array.from({ length: 10 }, (_v, col) => [String(col), ((id * 7 + col * 17) % 100) - 50])])
  );
  const dataset2 = dataset1.map((item) => ({ ...item }));
  const base: GridOption = {
    enableAutoResize: true,
    autoResize: { container: '#demo-container', rightPadding: 10 },
    gridHeight: 275,
    enableCellNavigation: true,
    enableHeaderButton: true,
    enableExcelCopyBuffer: true,
  };
  const options1: GridOption = {
    ...base,
    enableHeaderMenu: false,
    enableFiltering: false,
    headerButton: { onCommand: (_event, args) => toggleHighlight(args, 0) },
  };
  const options2: GridOption = {
    ...base,
    enableHeaderMenu: true,
    enableFiltering: true,
    headerButton: { onCommand: (_event, args) => toggleHighlight(args, 1) },
  };
</script>

<h2>
  Example 7: Header Button Plugin <span class="float-end fs-6"
    ><a
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example07.svelte"
      target="_blank"
      rel="noreferrer"><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>
{#if showSubTitle}<p class="subtitle">
    Click the lightbulb to highlight negative numbers. The first column demonstrates multiple buttons and overflow; the second shows a
    button on hover. Grid 2 also enables filtering and the header menu.
  </p>{/if}
{#if message}<div class="alert alert-info py-1">{message}</div>{/if}
<h3>Grid 1</h3>
<SlickgridSvelte
  gridId="grid7-1"
  columns={columns1}
  options={options1}
  dataset={dataset1}
  onSvelteGridCreated={(instance) => (grid1 = instance)}
/>
<hr />
<h3>Grid 2</h3>
<SlickgridSvelte
  gridId="grid7-2"
  columns={columns2}
  options={options2}
  dataset={dataset2}
  onSvelteGridCreated={(instance) => (grid2 = instance)}
/>
