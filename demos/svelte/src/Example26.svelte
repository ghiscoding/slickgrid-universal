<script lang="ts">
  import {
    Editors,
    Filters,
    Formatters,
    SlickGlobalEditorLock,
    SlickgridSvelte,
    type Column,
    type EditCommand,
    type Formatter,
    type GridOption,
    type OnEventArgs,
    type SlickgridSvelteInstance,
    type SliderOption,
  } from 'slickgrid-svelte';
  import { mount } from 'svelte';
  import CustomTitleFormatter from './CustomTitleFormatter.svelte';
  import { CustomSvelteComponentEditor } from './data/custom-svelteComponentEditor.js';
  import { CustomSvelteComponentFilter } from './data/custom-svelteComponentFilter.js';

  const NB_ITEMS = 500;
  const assignees = [
    { id: '', name: '' },
    { id: '1', name: 'John' },
    { id: '2', name: 'Pierre' },
    { id: '3', name: 'Paul' },
  ];
  const commandQueue: EditCommand[] = [];
  let grid!: SlickgridSvelteInstance;
  let isAutoEdit = $state(true);
  let autoCommitEdit = $state(false);
  let showSubtitle = $state(true);
  let updatedObject = $state.raw<any>();
  let alertWarning = $state<string>();

  // a Svelte component can be used as a Formatter by returning the element it was mounted into
  const svelteComponentFormatter: Formatter = (_row, _cell, _value, columnDef, dataContext) => {
    const component = columnDef.params?.component;
    if (component) {
      const target = document.createElement('div');
      mount(component, { target, props: { model: dataContext } });
      return target;
    }
    return '';
  };

  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      filterable: true,
      sortable: true,
      minWidth: 100,
      editor: { model: Editors.longText, minLength: 5, maxLength: 255 },
      onCellChange: (_e: Event, args: OnEventArgs) => {
        console.log(args);
        alertWarning = `Updated Title: ${args.dataContext.title}`;
      },
    },
    {
      id: 'assignee',
      name: 'Assignee',
      field: 'assignee',
      minWidth: 100,
      filterable: true,
      sortable: true,
      filter: { model: CustomSvelteComponentFilter, collection: assignees },
      queryFieldFilter: 'assignee.id',
      queryFieldSorter: 'assignee.name',
      formatter: Formatters.complexObject,
      params: { complexFieldLabel: 'assignee.name' },
      exportWithFormatter: true,
      editor: { model: CustomSvelteComponentEditor, collection: assignees },
      onCellChange: (_e: Event, args: OnEventArgs) => {
        console.log(args);
        alertWarning = `Updated Title: ${args.dataContext.title}`;
      },
    },
    {
      id: 'assignee2',
      name: 'Assignee with Svelte Component',
      field: 'assignee',
      minWidth: 125,
      filterable: true,
      sortable: true,
      filter: { model: CustomSvelteComponentFilter, collection: assignees },
      queryFieldFilter: 'assignee.id',
      queryFieldSorter: 'assignee.name',
      formatter: svelteComponentFormatter,
      params: { component: CustomTitleFormatter, complexFieldLabel: 'assignee.name' },
      exportCustomFormatter: Formatters.complexObject,
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      filterable: true,
      minWidth: 100,
      sortable: true,
      type: 'number',
      filter: { model: Filters.slider, options: { hideSliderNumber: false } as SliderOption },
      editor: { model: Editors.slider, minValue: 0, maxValue: 100 },
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      filterable: true,
      formatter: Formatters.multiple,
      type: 'number',
      editor: {
        // we can also add HTML text to be rendered (any bad script will be sanitized) but we have to opt-in, else it will be sanitized
        enableRenderHtml: true,
        collection: Array.from(Array(101).keys()).map((k) => ({
          value: k,
          label: k,
          symbol: '<i class="mdi mdi-percent-outline" style="color:cadetblue"></i>',
        })),
        customStructure: { value: 'value', label: 'label', labelSuffix: 'symbol' },
        collectionSortBy: { property: 'label', sortDesc: true },
        collectionFilterBy: { property: 'value', value: 0, operator: '!=' },
        model: Editors.singleSelect,
      },
      minWidth: 100,
      params: { formatters: [Formatters.collectionEditor, Formatters.percentCompleteBar] },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      filterable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 100,
      type: 'date',
      editor: { model: Editors.date },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      filterable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 100,
      type: 'date',
      editor: { model: Editors.date },
    },
  ];
  const dataset = Array.from({ length: NB_ITEMS }, (_value, id) => {
    const year = 2000 + Math.floor(Math.random() * 10);
    const month = Math.floor(Math.random() * 11);
    const day = Math.floor(Math.random() * 29);
    const percent = Math.round(Math.random() * 100);
    return {
      id,
      title: `Task ${id}`,
      assignee: id % 3 ? assignees[2] : id % 2 ? assignees[1] : assignees[0],
      duration: `${Math.round(Math.random() * 100)}`,
      percentComplete: percent,
      percentCompleteNumber: percent,
      start: new Date(year, month, day),
      finish: new Date(year, month + 1, day),
      effortDriven: id % 5 === 0,
    };
  });
  const options: GridOption = {
    asyncEditorLoading: false,
    autoEdit: true,
    autoCommitEdit: false,
    autoResize: { container: '#demo-container', rightPadding: 10 },
    rowHeight: 45, // increase row height so that the custom elements fit in the cell
    editable: true,
    enableCellNavigation: true,
    enableColumnPicker: true,
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    editCommandHandler: (_item, _column, editCommand) => {
      commandQueue.push(editCommand);
      editCommand.execute();
    },
  };

  function onCellChanged(_e: Event, args: any) {
    console.log('onCellChange', args);
    updatedObject = { ...args.item };
  }

  function onCellClicked(_e: Event, args: any) {
    const metadata = grid.gridService.getColumnFromEventArguments(args);
    console.log(metadata);

    if (metadata.columnDef.id === 'edit') {
      alertWarning = `open a modal window to edit: ${metadata.dataContext.title}`;
      grid.gridService.highlightRow(args.row, 1500);
    } else if (metadata.columnDef.id === 'delete') {
      if (confirm('Are you sure?')) {
        grid.gridService.deleteItemById(metadata.dataContext.id);
        alertWarning = `Deleted: ${metadata.dataContext.title}`;
      }
    }
  }

  function changeAutoCommit() {
    autoCommitEdit = !autoCommitEdit;
    grid.slickGrid.setOptions({ autoCommitEdit });
  }

  function setAutoEdit(autoEdit: boolean) {
    isAutoEdit = autoEdit;
    grid.slickGrid.setOptions({ autoEdit });
  }

  function undo() {
    const command = commandQueue.pop();
    if (command && SlickGlobalEditorLock.cancelCurrentEdit()) {
      command.undo();
      grid.slickGrid.gotoCell(command.row, command.cell, false);
    }
  }

  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }
</script>

<h2>
  Example 26: Use of Svelte Components
  <span class="float-end">
    <a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example26.svelte"
    >
      <i class="mdi mdi-link-variant"></i> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}
  >
    <i class="mdi mdi-information-outline"></i>
  </button>
</h2>
{#if showSubtitle}
  <div class="subtitle">
    <h5>Custom Filters, Editors with Svelte Components</h5>
    <ul>
      <li>Support of Svelte Component as Custom Editor (click on any "Assignee" name cell)</li>
      <ul>
        <li>That column uses a simple select drodown wrapped in a Svelte Component</li>
        <li>Increased Grid Options "rowHeight" &amp; "headerRowHeight" to 45 so that the Custom Element fits in the cell.</li>
      </ul>
      <li>Support of Svelte Component as Custom Filter ("Assignee" columns), which also uses Custom Element</li>
      <li>The 2nd "Assignee" column (showing in bold text) uses a Svelte Component</li>
      <ul>
        <li>Can we use Svelte Component as Customer Formatter? Yes but prefer native as much as possible</li>
      </ul>
    </ul>
  </div>
{/if}
<div class="row">
  <div class="col-sm-6">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>autoEdit setting</label>
    <br />
    <span id="radioAutoEdit">
      <div class="row">
        <div class="col">
          <label class="radio-inline control-label me-1" for="radioTrue">
            <input type="radio" name="inlineRadioOptions" id="radioTrue" checked={isAutoEdit} onclick={() => setAutoEdit(true)} />
            ON (single-click)
          </label>
          <label class="radio-inline control-label" for="radioFalse">
            <input type="radio" name="inlineRadioOptions" id="radioFalse" checked={!isAutoEdit} onclick={() => setAutoEdit(false)} />
            OFF (double-click)
          </label>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <button class="btn btn-outline-secondary btn-sm btn-icon me-1" onclick={undo}>
            <i class="mdi mdi-undo"></i>
            Undo last edit(s)
          </button>
          <label class="checkbox-inline control-label" for="autoCommitEdit">
            <input
              type="checkbox"
              id="autoCommitEdit"
              data-test="auto-edit-checkbox"
              checked={autoCommitEdit}
              onchange={changeAutoCommit}
            />
            Auto Commit Edit
          </label>
        </div>
      </div>
    </span>
    <div class="row" style="margin-top: 5px">
      <div class="col">
        <button
          class="btn btn-outline-secondary btn-sm btn-icon"
          data-test="clear-filters"
          onclick={() => grid.filterService.clearFilters()}
        >
          Clear Filters
        </button>
        <button
          class="btn btn-outline-secondary btn-sm btn-icon mx-1"
          data-test="clear-sorting"
          onclick={() => grid.sortService.clearSorting()}
        >
          Clear Sorting
        </button>
      </div>
    </div>
  </div>

  <div class="col-sm-6">
    <div class="alert alert-info" hidden={!updatedObject}><strong>Updated Item:</strong> {JSON.stringify(updatedObject, null, 2)}</div>
    <div class="alert alert-warning" hidden={!alertWarning}>{alertWarning}</div>
  </div>
</div>

<SlickgridSvelte
  gridId="grid26"
  {columns}
  {options}
  {dataset}
  onCellChange={(e) => onCellChanged(e.detail.eventData, e.detail.args)}
  onClick={(e) => onCellClicked(e.detail.eventData, e.detail.args)}
  onSvelteGridCreated={(instance) => (grid = instance)}
/>
