<script lang="ts">
  import {
    Editors,
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { CustomSvelteComponentEditor } from './data/custom-svelteComponentEditor.js';
  import { CustomSvelteComponentFilter } from './data/custom-svelteComponentFilter.js';

  const assignees = [
    { id: '', name: '' },
    { id: '1', name: 'John' },
    { id: '2', name: 'Pierre' },
    { id: '3', name: 'Paul' },
  ];
  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      filterable: true,
      sortable: true,
      minWidth: 100,
      editor: { model: Editors.longText, minLength: 5, maxLength: 255 },
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
      editor: { model: CustomSvelteComponentEditor, collection: assignees },
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
      formatter: (_row, _cell, value) => (value?.name ? `<strong>${value.name}</strong>` : ''),
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      filterable: true,
      minWidth: 100,
      sortable: true,
      type: 'number',
      filter: { model: Filters.slider },
      editor: { model: Editors.slider, minValue: 0, maxValue: 100 },
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      filterable: true,
      formatter: Formatters.percentCompleteBar,
      type: 'number',
      minWidth: 100,
      editor: { model: Editors.integer },
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
  const dataset = Array.from({ length: 500 }, (_value, id) => {
    const year = 2000 + Math.floor(Math.random() * 10);
    const month = Math.floor(Math.random() * 11);
    const day = Math.floor(Math.random() * 29);
    return {
      id,
      title: `Task ${id}`,
      assignee: id % 3 ? assignees[2] : id % 2 ? assignees[1] : assignees[0],
      duration: Math.round(Math.random() * 100),
      percentComplete: Math.round(Math.random() * 100),
      percentCompleteNumber: Math.round(Math.random() * 100),
      start: new Date(year, month, day),
      finish: new Date(year, month + 1, day),
    };
  });
  const options: GridOption = {
    asyncEditorLoading: false,
    autoEdit: true,
    autoCommitEdit: false,
    autoResize: { container: '#demo-container', rightPadding: 10 },
    rowHeight: 45,
    editable: true,
    enableCellNavigation: true,
    enableColumnPicker: true,
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    editCommandHandler: (_item: any, _column: Column, editCommand: any) => editCommand.execute(),
  };

  let grid: SlickgridSvelteInstance;
  let autoCommitEdit = false;
  let showSubtitle = true;

  function toggleAutoCommit(event: Event) {
    autoCommitEdit = (event.currentTarget as HTMLInputElement).checked;
    grid.slickGrid.setOptions({ autoCommitEdit });
  }

  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }
</script>

<h2>
  Example 26: Use of Svelte Components
  <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example26.svelte"
      ><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}><i class="mdi mdi-information-outline"></i></button
  >
</h2>
{#if showSubtitle}<div class="subtitle">
    <h5>Custom Filters and Editors with Svelte Components</h5>
    <ul>
      <li>The Assignee column uses a Svelte component dropdown editor.</li>
      <li>The second Assignee column renders a formatted Svelte component value.</li>
    </ul>
  </div>{/if}
<div class="row">
  <div class="col-sm-6">
    <strong>autoEdit setting</strong>
    <div class="row">
      <div class="col">
        <label class="radio-inline me-1"><input type="radio" name="inlineRadioOptions" checked /> ON (single-click)</label><label
          class="radio-inline"><input type="radio" name="inlineRadioOptions" /> OFF (double-click)</label
        >
      </div>
    </div>
    <div class="row">
      <div class="col">
        <button class="btn btn-outline-secondary btn-sm btn-icon me-1" type="button"><i class="mdi mdi-undo"></i> Undo last edit(s)</button
        ><label class="checkbox-inline" for="autoCommitEdit"
          ><input type="checkbox" id="autoCommitEdit" data-test="auto-edit-checkbox" checked={autoCommitEdit} onchange={toggleAutoCommit} /> Auto
          Commit Edit</label
        >
      </div>
    </div>
    <div class="row mt-1">
      <div class="col">
        <button
          class="btn btn-outline-secondary btn-sm btn-icon"
          data-test="clear-filters"
          onclick={() => grid.filterService.clearFilters()}>Clear Filters</button
        ><button
          class="btn btn-outline-secondary btn-sm btn-icon mx-1"
          data-test="clear-sorting"
          onclick={() => grid.sortService.clearSorting()}>Clear Sorting</button
        >
      </div>
    </div>
  </div>
  <div class="col-sm-6">
    <div class="alert alert-info" hidden><strong>Updated Item:</strong></div>
    <div class="alert alert-warning" hidden></div>
  </div>
</div>
<SlickgridSvelte gridId="grid26" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />
