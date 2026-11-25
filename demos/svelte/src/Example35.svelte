<script lang="ts">
  import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
  import { Editors, Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { i18n } from './data/i18n.js';

  const NB_ITEMS = 20;
  let columns: Column[] = [];
  let dataset: any[] = [];
  let gridOptions: GridOption;
  let selectedLanguage = 'en';
  let fetchResult = '';
  let statusClass = 'alert alert-light';
  let statusStyle = 'display: none';
  let showSubTitle = true;
  let grid: SlickgridSvelteInstance;

  void i18n.changeLanguage('en');

  function defineGrid() {
    columns = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true, editor: { model: Editors.text } },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: 'number',
        editor: { model: Editors.text },
      },
      {
        id: '%',
        name: '% Complete',
        field: 'percentComplete',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: 'number',
        editor: { model: Editors.text },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
        editor: { model: Editors.date },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
        editor: { model: Editors.date },
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: 'boolean',
        editor: { model: Editors.checkbox },
      },
    ];

    gridOptions = {
      enableAutoResize: false,
      gridHeight: 350,
      gridWidth: 800,
      rowHeight: 33,
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        onBeforePasteCell: (_event, args) => args.cell > 0,
      },
      autoEdit: false,
      editable: true,
      enableCellNavigation: true,
      enableRowBasedEdit: true,
      enableTranslate: true,
      i18n,
      rowBasedEditOptions: {
        allowMultipleRows: false,
        onBeforeEditMode: () => clearStatus(),
        onBeforeRowUpdated: (args) => {
          const { effortDriven, percentComplete, finish, start, duration, title } = args.dataContext;
          if (duration > 40) {
            alert('Sorry, 40 is the maximum allowed duration.');
            return Promise.resolve(false);
          }

          return fakeFetch('your-backend-api/endpoint', {
            method: 'POST',
            body: JSON.stringify({ effortDriven, percentComplete, finish, start, duration, title }),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
          })
            .catch((error) => {
              console.error(error);
              return false;
            })
            .then((response: any) => {
              if (response === false) {
                statusClass = 'alert alert-danger';
                return false;
              }
              return response.json();
            })
            .then((json) => {
              if (json) {
                statusStyle = 'display: block';
                statusClass = 'alert alert-success';
                fetchResult = json.message;
              }
              return true;
            });
        },
        actionColumnConfig: { width: 100, minWidth: 100, maxWidth: 100 },
        actionButtons: {
          editButtonClassName: 'button-style margin-auto btn-icon px-2 me-1',
          iconEditButtonClassName: 'mdi mdi-pencil',
          cancelButtonClassName: 'button-style btn-icon px-2',
          cancelButtonTitle: 'Cancel row',
          cancelButtonTitleKey: 'RBE_BTN_CANCEL',
          iconCancelButtonClassName: 'mdi mdi-undo text-danger',
          cancelButtonPrompt: 'Are you sure you want to cancel your changes?',
          updateButtonClassName: 'button-style btn-icon px-2 me-1',
          updateButtonTitle: 'Update row',
          updateButtonTitleKey: 'RBE_BTN_UPDATE',
          iconUpdateButtonClassName: 'mdi mdi-check text-success',
          updateButtonPrompt: 'Save changes?',
          deleteButtonClassName: 'button-style btn-icon px-2',
          deleteButtonTitle: 'Delete row',
          iconDeleteButtonClassName: 'mdi mdi-trash-can text-danger',
          deleteButtonPrompt: 'Are you sure you want to delete this row?',
        },
      },
      externalResources: [new SlickCustomTooltip()],
    };
  }

  function getData(count: number) {
    return Array.from({ length: count }, (_item, id) => {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      return {
        id,
        title: `Task ${id}`,
        duration: Math.round(Math.random() * 40) + '',
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        effortDriven: id % 5 === 0,
      };
    });
  }

  function clearStatus() {
    statusClass = 'alert alert-light';
    statusStyle = 'display: none';
    fetchResult = '';
  }

  function toggleSingleMultiRowEdit() {
    const options = grid.slickGrid.getOptions() as GridOption;
    options.rowBasedEditOptions = { ...options.rowBasedEditOptions, allowMultipleRows: !options.rowBasedEditOptions?.allowMultipleRows };
    grid.slickGrid.setOptions(options);
    gridOptions = grid.slickGrid.getOptions() as GridOption;
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(nextLanguage);
    selectedLanguage = nextLanguage;
  }

  function fakeFetch(_input: string | URL | Request, _init?: RequestInit): Promise<Response> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(new Response(JSON.stringify({ status: 200, message: 'success' }))), (window as any).Cypress ? 10 : 500);
    });
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid?.resizerService.resizeGrid());
  }

  defineGrid();
  dataset = getData(NB_ITEMS);
</script>

<svelte:head><title>Example 35 - Row Based Editing</title></svelte:head>

<h2>
  Example 35: Row Based Editing
  <span class="float-end"
    ><a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example35.vue"
      ><span class="mdi mdi-link-variant"></span> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>

{#if showSubTitle}
  <div class="subtitle">
    <ul>
      <li>
        The Row Based Edit plugin allows you to edit either a single or multiple specific rows at a time, while disabling the rest of the
        grid rows.
      </li>
      <li>Editable rows, as well as modified cells are highlighted with a different color, which you can customize using css variables</li>
      <li>Modifications are kept track of and if the cancel button is pressed, all modifications are rolled back.</li>
      <li>
        If the save button is pressed, a custom "onBeforeRowUpdated" callback is called, which you can use to save the data with your
        backend.<br />The callback needs to return a Promise&lt;boolean&gt; and if it resolves to true, the row is updated; otherwise it
        stays in edit mode. Try entering a Duration value <b>larger than 40</b>.<br /><small
          ><span class="has-text-danger">NOTE:</span> You can also combine this with e.g. Batch Editing like shown
          <a href="#/example30">in Example 30</a></small
        >
      </li>
      <li>
        This example also uses the ExcelCopyBuffer Plugin. The example prohibits pasting into the first column; while editing a row, pasting
        is limited to edited rows.
      </li>
    </ul>
  </div>
{/if}

<section>
  <div class="row mb-4">
    <div class="col-sm-8">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="single-multi-toggle" onclick={toggleSingleMultiRowEdit}
        >Toggle Single/Multi Row Edit</button
      >
      <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="toggle-language" onclick={switchLanguage}
        ><i class="mdi mdi-translate"></i> Switch Language for Action column buttons</button
      >
      <span class="mx-1">Locale:</span><span style="font-style: italic; width: 70px" data-test="selected-locale"
        >{selectedLanguage}.json</span
      >
    </div>
    <div class={'col-sm-4 ' + statusClass} style={statusStyle}>
      <strong>Status: </strong><span data-test="fetch-result">{fetchResult}</span>
    </div>
  </div>
</section>

<SlickgridSvelte gridId="grid35" {columns} options={gridOptions} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />
