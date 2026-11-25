<script lang="ts">
  import {
    Editors,
    SlickgridSvelte,
    SlickSelectionUtils,
    type Column,
    type GridOption,
    type OnDragReplaceCellsEventArgs,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { onDestroy } from 'svelte';

  const NB_ITEMS = 100;
  let gridOptions: GridOption;
  let columns: Column[] = [];
  let dataset: any[] = [];
  let isDarkMode = false;
  let showSubTitle = true;
  let svelteGrid: SlickgridSvelteInstance;

  function defineGrid() {
    const colDefs: Column[] = [{ id: 'selector', name: '', field: 'num', width: 30 }];
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
    columns = colDefs;
    gridOptions = {
      autoResize: { container: '#demo-container', rightPadding: 10 },
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      darkMode: isDarkMode,
      editable: true,
      headerRowHeight: 35,
      editorNavigateOnArrows: true,
      enableSelection: true,
      selectionOptions: { rowSelectColumnIds: ['selector'], selectActiveRow: true, selectionType: 'mixed' },
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: { copyActiveEditorCell: true, removeDoubleQuotesOnPaste: true, replaceNewlinesWith: ' ' },
    };
  }

  function getData(itemCount: number) {
    return Array.from({ length: itemCount }, (_, id) => ({ id, num: id }));
  }

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

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', isDarkMode);
    document.querySelector<HTMLElement>('#demo-container')?.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    svelteGrid?.slickGrid?.setOptions({ darkMode: isDarkMode });
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => svelteGrid?.resizerService.resizeGrid());
  }

  onDestroy(() => {
    document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
    document.querySelector<HTMLElement>('#demo-container')?.setAttribute('data-bs-theme', 'light');
  });

  defineGrid();
  dataset = getData(NB_ITEMS);
</script>

<svelte:head><title>Example 49 - Spreadsheet Drag-Fill</title></svelte:head>

<div class="demo49">
  <h2>
    Example 49: Spreadsheet Drag-Fill
    <span class="float-end font18"
      ><a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example49.svelte"
        ><span class="mdi mdi-link-variant"></span> code</a
      ></span
    >
    <button
      class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
      type="button"
      data-test="toggle-subtitle"
      aria-label="Toggle example sub-title details"
      onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-2" onclick={toggleDarkMode} data-test="toggle-dark-mode"
      ><span class="mdi mdi-theme-light-dark"></span><span>Toggle Dark Mode</span></button
    >
  </h2>
  {#if showSubTitle}<div class="subtitle">
      Spreadsheet with drag-fill, hybrid selection model. Type values in the grid, select cells and use the bottom right drag handle to fill
      adjacent cells. The <code>onDragReplaceCells</code> event customizes the drag-fill behavior. Use
      <code>{"{ enableSelection: true, selectionOptions: { selectionType: 'mixed' } }"}</code> to enable the hybrid selection model.
    </div>{/if}
  <br />
  <SlickgridSvelte
    gridId="grid49"
    options={gridOptions}
    {columns}
    {dataset}
    onSvelteGridCreated={(instance) => (svelteGrid = instance)}
    onDragReplaceCells={(event) => copyDraggedCellRange(event.detail.args)}
  />
</div>

<style lang="scss">
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
    :global(.slick-cell.copied) {
      background: rgba(0, 0, 255, 0.2);
      transition: 0.5s background;
    }
    :global(.slick-dark-mode) {
      --slick-border-color: #595959;
      --slick-cell-border-left: 1px solid #595959;
      --slick-grid-border-color: #434343;
      --slick-cell-selected-color: #434343;
      --slick-row-selected-color: #434343;
      --slick-cell-selected-editable-color: #333333;
    }
  }
</style>
