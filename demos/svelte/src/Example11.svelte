<script lang="ts">
  import { Editors, Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { tick } from 'svelte';

  const NB_ITEMS = 1000;
  let showSubTitle = $state(true);
  let svelteGrid!: SlickgridSvelteInstance;

  /* Define grid Options and Columns */
  const columns: Column[] = [
    {
      id: 'delete',
      field: 'id',
      excludeFromHeaderMenu: true,
      formatter: Formatters.icon,
      params: { iconCssClass: 'mdi mdi-trash-can pointer' },
      minWidth: 30,
      maxWidth: 30,
      // use onCellClick OR grid.onClick.subscribe which you can see down below
      onCellClick: (_e, args) => {
        console.log(args);
        if (confirm('Are you sure?')) {
          svelteGrid.gridService.deleteItemById(args.dataContext.id);
        }
      },
    },
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      sortable: true,
      editor: {
        model: Editors.longText,
      },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      type: 'number',
      editor: {
        model: Editors.text,
      },
      onCellChange: (_e, args) => {
        alert('onCellChange directly attached to the column definition');
        console.log(args);
      },
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      type: 'number',
      editor: {
        model: Editors.integer,
      },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      sortable: true,
      type: 'date',
      /*
      editor: {
        model: Editors.date
      }
      */
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      sortable: true,
      type: 'date',
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      formatter: Formatters.checkmarkMaterial,
      type: 'number',
      editor: {
        model: Editors.checkbox,
      },
    },
  ];

  const gridOptions: GridOption = {
    asyncEditorLoading: false,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    editable: true,
    enableColumnPicker: true,
    enableCellNavigation: true,
    enableSelection: true,
  };

  // mock some data
  const dataset = mockData(NB_ITEMS);

  function mockData(itemCount: number) {
    // mock a dataset
    const mockedDataset: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockedDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }
    return mockedDataset;
  }

  function addNewItem(insertPosition?: 'top' | 'bottom') {
    const newItem1 = createNewItem(1);
    // const newItem2 = createNewItem(2);

    // single insert
    svelteGrid.gridService.addItem(newItem1, { position: insertPosition });

    // OR multiple inserts
    // svelteGrid.gridService.addItems([newItem1, newItem2], { position: insertPosition });
  }

  function createNewItem(incrementIdByHowMany = 1) {
    const items = svelteGrid.dataView.getItems();
    let highestId = 0;
    items.forEach((item) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId = highestId + incrementIdByHowMany;
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    return {
      id: newId,
      title: 'Task ' + newId,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 2, randomDay),
      effortDriven: true,
    };
  }

  /** Change the Duration Rows Background Color */
  function changeDurationBackgroundColor() {
    const dataView = svelteGrid.dataView;
    const previousMetadata = dataView.getItemMetadata;
    dataView.getItemMetadata = (rowNumber: number) => {
      const previous = typeof previousMetadata === 'function' ? previousMetadata.call(dataView, rowNumber) : undefined;
      const item = dataView.getItem(rowNumber);
      const cssClasses = item && Number(item.duration) > 40 ? `${previous?.cssClasses ?? ''} duration-bg`.trim() : previous?.cssClasses;
      return cssClasses ? { ...previous, cssClasses } : (previous ?? null);
    };
    svelteGrid.slickGrid.invalidate();
  }

  /** Highlight the 5th row using the Slickgrid-Svelte GridService */
  function highlighFifthRow() {
    scrollGridTop();
    svelteGrid.gridService.highlightRow(4, 1500);
  }

  function updateSecondItem() {
    scrollGridTop();
    const updatedItem = svelteGrid.gridService.getDataItemByRowNumber(1);
    updatedItem.duration = Math.round(Math.random() * 100);
    svelteGrid.gridService.updateItem(updatedItem);

    // OR by id
    // svelteGrid.gridService.updateItemById(updatedItem.id, updatedItem);

    // OR multiple changes
    /*
    const updatedItem1 = svelteGrid.gridService.getDataItemByRowNumber(1);
    const updatedItem2 = svelteGrid.gridService.getDataItemByRowNumber(2);
    updatedItem1.duration = Math.round(Math.random() * 100);
    updatedItem2.duration = Math.round(Math.random() * 100);
    svelteGrid.gridService.updateItems([updatedItem1, updatedItem2], { highlightRow: true });
    */
  }

  function scrollGridBottom() {
    svelteGrid.slickGrid.navigateBottom();
  }

  function scrollGridTop() {
    svelteGrid.slickGrid.navigateTop();
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    svelteGrid.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 11: Add / Update / Highlight a Datagrid Item
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example11.svelte"
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

{#if showSubTitle}
  <div class="subtitle">
    Add / Update / Hightlight an Item from the Datagrid (<a
      href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/add-update-highlight"
      target="_blank"
      rel="noreferrer"
    >
      Wiki docs
    </a>).
    <ul>
      <li><b>Note:</b> this demo is <b>only</b> on the datagrid (client) side, you still need to deal with the backend yourself</li>
      <li>Adding an item, will always be showing as the 1st item in the grid because that is the best visual place to add it</li>
      <li>Add/Update an item requires a valid Slickgrid Selection Model, you have 2 choices to deal with this:</li>
      <ul>
        <li>You can enable "enableCheckboxSelector" or "enableSelection" to True</li>
      </ul>
      <li>Click on any of the buttons below to test this out</li>
      <li>
        You can change the highlighted color &amp; animation by changing the
        <a
          href="https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss"
          target="_blank"
          rel="noreferrer"
        >
          SASS Variables
        </a>
      </li>
      <ul>
        <li>"$row-highlight-background-color" or "$row-highlight-fade-animation"</li>
      </ul>
      <li>You can also add CSS class(es) on the fly (or on page load) on rows with certain criteria, (e.g. click on last button)</li>
      <li>
        <ul>
          <li>
            Example, click on button "Highlight Rows with Duration over 40" to see row styling changing.
            <a
              href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/dynamic-item-metadata"
              target="_blank"
              rel="noreferrer"
            >
              Wiki doc
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </div>
{/if}

<div class="col-sm-12">
  <span>
    <label for="scroll-buttons">Scroll: </label>
    <div id="scroll-buttons" class="btn-group ms-1" role="group" aria-label="...">
      <button
        class="btn btn-sm btn-outline-secondary btn-icon"
        aria-label="Scroll to top"
        data-test="scroll-top-btn"
        onclick={scrollGridTop}
      >
        <i class="mdi mdi-arrow-down mdi-rotate-180 icon"></i>
      </button>
      <button
        class="btn btn-sm btn-outline-secondary btn-icon"
        aria-label="Scroll to bottom"
        data-test="scroll-bottom-btn"
        onclick={scrollGridBottom}
      >
        <i class="mdi mdi-arrow-down icon"></i>
      </button>
    </div>
    <button class="btn btn-sm btn-outline-secondary btn-icon mx-1" data-test="add-new-item-top-btn" onclick={() => addNewItem()}>
      Add New Mocked Item (top)
    </button>
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="add-new-item-bottom-btn" onclick={() => addNewItem('bottom')}>
      Add New Mocked Item (bottom)
    </button>
    <button class="btn btn-sm btn-outline-secondary btn-icon mx-1" data-test="update-second-item-btn" onclick={updateSecondItem}>
      Update 2nd Row Item with Random Duration
    </button>
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="highlight-row5-btn" onclick={highlighFifthRow}>
      Highlight 5th Row
    </button>
    <button
      class="btn btn-sm btn-outline-secondary btn-icon mx-1"
      data-test="highlight-duration40-btn"
      onclick={changeDurationBackgroundColor}
    >
      Highlight Rows with Duration over 40
    </button>
  </span>
  <hr />
</div>

<SlickgridSvelte gridId="grid11" {columns} options={gridOptions} {dataset} onSvelteGridCreated={(instance) => (svelteGrid = instance)} />

<style>
  :global(.duration-bg) {
    background-color: #e9d4f1 !important;
  }
</style>
