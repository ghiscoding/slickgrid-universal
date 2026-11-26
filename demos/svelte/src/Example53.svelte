<script lang="ts">
  import {
    createDomElement,
    getOffset,
    isDefined,
    SlickgridSvelte,
    type Column,
    type CurrentFilter,
    type GridOption,
    type OperatorType,
    type SlickGrid,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import './example53.scss';

  const NB_ITEMS = 2000;
  let gridOptions: GridOption = $state.raw({});
  let columns: Column[] = $state.raw([]);
  // mock some data (different in each dataset)
  let dataset: any[] = $state.raw(loadData(NB_ITEMS));
  let showSubTitle = $state(true);
  let svelteGrid!: SlickgridSvelteInstance;

  defineGrid();

  /* Define grid Options and Columns */
  function defineGrid() {
    columns = [
      { id: 'item', name: 'Item', field: 'item', filterable: true, sortable: true, width: 90 },
      { id: 'cost', name: 'Cost', field: 'cost', filterable: true, sortable: true, width: 90, type: 'number' },
      { id: 'tax1', name: 'State Tax', field: 'tax1', filterable: true, sortable: true, width: 90, type: 'number' },
      { id: 'tax2', name: 'County Tax', field: 'tax2', filterable: true, sortable: true, width: 90, type: 'number' },
      { id: 'tax3', name: 'Federal Tax', field: 'tax3', filterable: true, sortable: true, width: 90, type: 'number' },
      { id: 'subtotal', name: 'Sub-Total', field: 'subtotal', filterable: true, sortable: true, width: 90, type: 'number' },
      { id: 'total', name: 'Total', field: 'total', filterable: true, sortable: true, width: 90, type: 'number' },
      {
        id: 'itemType',
        name: 'Type',
        field: 'itemType',
        cssClass: 'd-flex justify-content-center',
        filterable: true,
        sortable: true,
        width: 90,
        formatter: (_row, _cell, value) => `<div class="item-type item-type-${value}">${value}</div>`,
      },
    ];

    // add all filter header buttons
    for (let i = 0; i < columns.length; i++) {
      if (i >= 1) {
        columns[i].header = {
          buttons: [
            {
              cssClass: 'mdi mdi-filter-outline',
              command: 'toggle-filter',
              tooltip: 'Toggle filter.',
              action: (e, args) => handleOnCommand(e, args), // you can also use the "onCommand" callback in Grid Options
            },
          ],
        };
      }
    }

    gridOptions = {
      enableAutoResize: true,

      // enabling both header buttons & menus could conflict unless you use `--slick-header-button-float: left`
      enableHeaderButton: true,
      enableHeaderMenu: true,
      autoCommitEdit: true,
      autoEdit: true,
      editable: true,
      autoResize: {
        container: '#demo-container',
        maxWidth: 1250,
      },
      rowHeight: 35,
      enableCellNavigation: true,
      createTopHeaderPanel: true,
      showTopHeaderPanel: true,
      topHeaderPanelHeight: 60,

      // enable filtering but hide the default filter row since we will use a custom one in the top header panel
      enableFiltering: true,
      showHeaderRow: false,
      presets: {
        filters: [
          { columnId: 'tax2', operator: '>=', searchTerms: [2] },
          { columnId: 'total', operator: '<', searchTerms: [777] },
        ],
        sorters: [
          { columnId: 'tax2', direction: 'asc' },
          { columnId: 'total', direction: 'desc' },
        ],
      },
      showCustomFooter: true,
    };
  }

  function handleOnCommand(e: Event, args: { command: string; button: any; column: Column; grid: SlickGrid }) {
    const command = args.command;
    const buttonEl = e.target as HTMLSpanElement;

    if (command === 'toggle-filter' && !buttonEl.classList.contains('mdi mdi-filter-outline')) {
      createFilterModal(e, args);
    }
  }

  function loadData(itemCount: number): any[] {
    const data: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const cost = Math.round(Math.random() * 100000) / 100;
      const tax1 = Math.round(Math.random() * 1000) / 100;
      const tax2 = Math.round(Math.random() * 1000) / 100;
      const tax3 = Math.round(Math.random() * 1000) / 100;
      const subtotal = (tax1 + tax2 + tax3).toFixed(2);
      const total = (cost + parseFloat(subtotal)).toFixed(2);

      data[i] = {
        id: i,
        item: 'Item ' + i,
        cost,
        tax1,
        tax2,
        tax3,
        subtotal,
        total,
        itemType: ['Food', 'Toy', 'Electronics', 'Tool', 'Other'][Math.floor(Math.random() * 5)],
      };
    }

    return data;
  }

  // ----
  // NOTE: the example uses native DOM element but it's just for demo purpose, just replace with framework components
  //

  /** create filter badges to show in the top header bar */
  function createFilterBadge(args: any, currentFilter: CurrentFilter) {
    if (svelteGrid) {
      const topHeaderElm = svelteGrid?.slickGrid?.getTopHeaderPanel();
      topHeaderElm.className = 'top-filters';

      // clear previous filter badge
      topHeaderElm.querySelector(`.top-dropped-filter[data-col-id="${args.column.id}"]`)?.remove();

      const operator = currentFilter.operator ? `${currentFilter.operator} ` : '';
      const filterValue =
        typeof currentFilter.searchTerms?.[0] === 'string' ? `"${currentFilter.searchTerms[0]}"` : currentFilter.searchTerms?.[0];
      const searchValueElm = createDomElement('span', {
        className: 'filter-value',
        textContent: `${operator}${filterValue}`,
      });
      const title = createDomElement('div', {
        className: 'filter-title',
        textContent: `${args.column.name}: `,
      });
      const close = createDomElement('div', {
        className: 'filter-remove mdi mdi-close-circle color-info',
      });
      const container = createDomElement('div', {
        className: 'top-dropped-filter',
        dataset: { colId: args.column.id },
      });
      close.addEventListener('click', (e) => {
        container.remove();
        svelteGrid?.filterService.clearFilterByColumnId(e as any, args.column.id);
        const columnEl = svelteGrid?.slickGrid!.getContainerNode().querySelector<HTMLDivElement>(`[data-id="${args.column.id}"]`);
        if (columnEl) {
          toggleFilterStyling(columnEl, args.column.id, false);
        }
        close.removeEventListener('click', () => {});
      });
      container.appendChild(title);
      container.appendChild(searchValueElm);
      container.appendChild(close);
      topHeaderElm?.appendChild(container);
    }
  }

  /** create a very basic custom filter modal */
  function createFilterModal(e: any, args: any) {
    // remove any other filter modals
    document.body.querySelector('.filter-modal')?.remove();

    const modal = createDomElement('div', { className: 'filter-modal' });
    const title = createDomElement('div', {
      className: 'filter-modal-title',
      textContent: `Filter: ${args.column.name}`,
    });
    const filterContainer = createDomElement('div', {
      className: 'filter-modal-container',
    });
    const inputElm = createDomElement('input', {
      autofocus: true,
      className: 'filter-modal-input',
      type: 'text',
      placeholder: 'Enter filter value',
    });
    const footerContainer = createDomElement('div', { className: 'filter-modal-footer' });
    const okButton = createDomElement('button', { className: 'filter-modal-ok', textContent: 'OK' });
    const cancelButton = createDomElement('button', { className: 'filter-modal-cancel', textContent: 'Cancel' });

    filterContainer.appendChild(inputElm);
    footerContainer.appendChild(okButton);
    footerContainer.appendChild(cancelButton);

    modal.appendChild(title);
    modal.appendChild(filterContainer);
    modal.appendChild(footerContainer);
    document.body.appendChild(modal);

    const offset = getOffset(e.target);
    modal.style.top = offset.top + 30 + 'px';
    modal.style.left = offset.left + 'px';

    // check if we already have a filter value, is so update the custom filter input with same value
    const currentFilters = svelteGrid?.filterService.getColumnFilters() || {};
    for (const filter of Object.values(currentFilters)) {
      if (filter.columnId === args.column.id) {
        const operator = filter.operator && filter.operator !== 'Contains' ? filter.operator + ' ' : '';
        const filterValue = filter.searchTerms?.[0];
        inputElm.value = `${operator}${filterValue}`;
        break;
      }
    }
    inputElm.focus();

    // event listeners
    document.body.addEventListener('click', () => {
      document.body.querySelectorAll('.filter-modal').forEach((m) => m.remove());
    });
    okButton.addEventListener('click', (_se) => {
      handleApplyFilter(e.target.closest('.slick-header-column') as HTMLDivElement, inputElm.value, args, modal);
    });
    cancelButton.addEventListener('click', () => {
      modal.remove();
    });
    inputElm.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        handleApplyFilter(e.target.closest('.slick-header-column') as HTMLDivElement, inputElm.value, args, modal);
      }
    });

    // you could use `drawFilterTemplate()` to render default column filters
    // svelteGrid?.filterService.drawFilterTemplate(args.column, filterContainer);
  }

  function handleApplyFilter(columnEl: HTMLDivElement, value: string, args: any, modal: HTMLDivElement) {
    const [_, operator, val] = value.match(/^([<>!=*]{0,2})(.*[^<>!=*])?([*])*$/) || [];
    if (isDefined(val)) {
      const searchTerm = args.column.type === 'number' ? +val : val;
      const op: OperatorType | undefined = args.column.type !== 'number' ? 'Contains' : (operator as OperatorType) || undefined;
      const cFilter: CurrentFilter = {
        columnId: args.column.id,
        operator: op,
        searchTerms: [searchTerm],
      };
      const allFilters = svelteGrid?.filterService.getColumnFilters() || {};
      const allCurrentFilters: CurrentFilter[] = [];
      for (const f of Object.values(allFilters)) {
        allCurrentFilters.push({
          columnId: String(f.columnId),
          operator: f.operator,
          searchTerms: f.searchTerms,
        });
      }
      svelteGrid?.filterService.updateFilters([...allCurrentFilters.filter((f) => f.columnId !== args.column.id), cFilter]);
      createFilterBadge(args, cFilter);
      toggleFilterStyling(columnEl, args.column.id, true);
    } else {
      svelteGrid?.filterService.clearFilterByColumnId(null as any, args.column.id);
      svelteGrid?.slickGrid?.getTopHeaderPanel()?.querySelector(`.top-dropped-filter[data-col-id="${args.column.id}"]`)?.remove();

      toggleFilterStyling(columnEl, args.column.id, false);
    }
    svelteGrid?.slickGrid?.invalidate();
    modal.remove();
  }

  /** update column filter styling */
  function toggleFilterStyling(columnEl: HTMLDivElement, columndId: number | string, assignFilter?: boolean) {
    const buttonEl = columnEl.querySelector('.slick-header-button .mdi') as HTMLSpanElement;
    if (buttonEl.classList.contains('mdi-filter-outline') || assignFilter) {
      buttonEl.classList.remove('mdi-filter-outline');
      buttonEl.classList.add('mdi-filter');
      columnEl.style.color = '#0b99af';
    } else {
      buttonEl.classList.remove('mdi-filter');
      buttonEl.classList.add('mdi-filter-outline');
      svelteGrid?.slickGrid?.getTopHeaderPanel()?.querySelector(`.top-dropped-filter.col-${columndId}`)?.remove();
      columnEl.style.color = 'black';
    }
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => svelteGrid.resizerService.resizeGrid());
  }

  function gridReady(grid: SlickgridSvelteInstance) {
    svelteGrid = grid;

    const topHeaderElm = svelteGrid.slickGrid.getTopHeaderPanel();
    topHeaderElm.className = 'top-filters';
    topHeaderElm.appendChild(createDomElement('span', { className: 'top-filters-title', textContent: 'Active Filters:' }));

    // read column preset filters and render in the top header as Active Filters
    for (const filter of gridOptions?.presets?.filters || []) {
      createFilterBadge(
        { column: { id: filter.columnId, name: columns.find((col) => col.id === filter.columnId)?.name } },
        filter as CurrentFilter
      );
      const columnEl = svelteGrid.slickGrid!.getContainerNode().querySelector<HTMLDivElement>(`[data-id="${filter.columnId}"]`);
      if (columnEl) {
        toggleFilterStyling(columnEl, filter.columnId, true);
      }
    }
  }
</script>

<h2>
  Example 53: Custom Filter Bar
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example53.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

{#if showSubTitle}
  <div class="subtitle">
    Display Custom Filters in the top header bar, which is similar to how the MSSQL Extension does it. Please note that the html code used
    is not important, what is important though is that we can use <code>filterService.updateFilters()</code>,
    <code>filterService.getColumnFilters()</code>, <code>filterService.clearFilterByColumnId()</code>. Also note that the demo creates
    custom filters, but you could also optionally use <code>filterService.drawFilterTemplate()</code> to render the built-in filters in a
    modal window (see <a href="https://ghiscoding.github.io/slickgrid-universal/#/example07">Example 7</a> which does exactly that).
  </div>
{/if}

<SlickgridSvelte options={gridOptions} {columns} {dataset} gridId="grid53" onSvelteGridCreated={gridReady}></SlickgridSvelte>
