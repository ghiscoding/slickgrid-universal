<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { TextExportService } from '@slickgrid-universal/text-export';
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type Formatter,
    type GridOption,
    type GridStateChange,
    type SlickgridSvelteInstance,
    type SliderOption,
  } from 'slickgrid-svelte';
  import { i18n } from './data/i18n.js';

  const NB_ITEMS = 1500;
  const excelExportService = new ExcelExportService();
  const textExportService = new TextExportService();
  let grid: SlickgridSvelteInstance;
  let showSubTitle = true;
  let selectedLanguage = 'en';
  let duplicateTitleHeaderCount = 1;

  void i18n.changeLanguage('en');

  const taskTranslateFormatter: Formatter = (_row, _cell, value) => i18n.t('TASK_X', { x: value });
  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'id',
      nameKey: 'TITLE',
      minWidth: 100,
      formatter: taskTranslateFormatter,
      sortable: true,
      filterable: true,
      params: { useFormatterOuputToFilter: true },
    },
    { id: 'description', name: 'Description', field: 'description', filterable: true, sortable: true, minWidth: 80 },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      nameKey: 'DURATION',
      sortable: true,
      formatter: Formatters.percentCompleteBar,
      minWidth: 100,
      exportWithFormatter: false,
      filterable: true,
      type: 'number',
      filter: { model: Filters.slider, options: { hideSliderNumber: true } as SliderOption },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      nameKey: 'START',
      minWidth: 100,
      formatter: Formatters.dateIso,
      outputType: 'dateIso',
      type: 'date',
      exportWithFormatter: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      nameKey: 'FINISH',
      formatter: Formatters.dateIso,
      outputType: 'dateIso',
      type: 'date',
      minWidth: 100,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'completedBool',
      name: 'Completed',
      field: 'completedBool',
      nameKey: 'COMPLETED',
      minWidth: 100,
      sortable: true,
      formatter: Formatters.checkmarkMaterial,
      exportCustomFormatter: Formatters.translateBoolean,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, labelKey: 'TRUE' },
          { value: false, labelKey: 'FALSE' },
        ],
        model: Filters.singleSelect,
        enableTranslateLabel: true,
      },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      nameKey: 'COMPLETED',
      formatter: Formatters.translate,
      sortable: true,
      minWidth: 100,
      exportWithFormatter: true,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: 'TRUE', labelKey: 'TRUE' },
          { value: 'FALSE', labelKey: 'FALSE' },
        ],
        collectionSortBy: { property: 'labelKey' },
        enableTranslateLabel: true,
        model: Filters.singleSelect,
      },
    },
  ];

  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableAutoResize: true,
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    enableTranslate: true,
    i18n,
    checkboxSelector: { hideInFilterHeaderRow: false, hideInColumnTitleRow: true },
    enableCheckboxSelector: true,
    enableSelection: true,
    showCustomFooter: true,
    customFooterOptions: {
      metricTexts: { itemsKey: 'ITEMS', ofKey: 'OF', lastUpdateKey: 'LAST_UPDATE' },
      dateFormat: 'YYYY-MM-DD, hh:mm a',
      hideTotalItemCount: false,
      hideLastUpdateTimestamp: false,
    },
    excelExportOptions: {
      customExcelHeader: (workbook: any, sheet: any) => {
        const customTitle =
          selectedLanguage === 'fr' ? 'Titre qui est suffisamment long pour être coupé' : 'My header that is long enough to wrap';
        const formatId = workbook.getStyleSheet().createFormat({
          font: { size: 12, fontName: 'Calibri', bold: true, color: 'FF0000FF' },
          alignment: { wrapText: true },
        });
        sheet.setRowInstructions(0, { height: 30 });
        sheet.mergeCells('B1', 'D1');
        sheet.data.push([{ value: '' }, { value: customTitle, metadata: { style: formatId.id } }]);
      },
    },
    enableExcelExport: true,
    enableTextExport: true,
    textExportOptions: { exportWithFormatter: true, menuFormats: ['csv', 'txt'], sanitizeDataExport: true },
    externalResources: [excelExportService, textExportService],
  };

  let dataset: any[] = Array.from({ length: NB_ITEMS }, (_, id) => {
    const randomYear = 2000 + ((id * 17) % 30);
    const randomMonth = (id * 7) % 11;
    const randomDay = (id * 13) % 29;
    return {
      id,
      description: id % 5 ? `desc ${id}` : '🚀🦄 español',
      duration: String((id * 37) % 101),
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      completedBool: id % 5 === 0,
      completed: id % 5 === 0 ? 'TRUE' : 'FALSE',
    };
  });

  function switchLanguage() {
    selectedLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    void i18n.changeLanguage(selectedLanguage);
  }

  function onGridStateChanged(event: CustomEvent<GridStateChange>) {
    console.log('Grid State changed:: ', event.detail);
    console.log('Grid State changed:: ', event.detail.change);
  }

  function dynamicallyAddTitleHeader() {
    columns.push({
      id: `title${duplicateTitleHeaderCount++}`,
      field: 'id',
      nameKey: 'TITLE',
      formatter: taskTranslateFormatter,
      sortable: true,
      minWidth: 100,
      filterable: true,
      params: { useFormatterOuputToFilter: true },
    });
    grid.slickGrid.setColumns(columns.slice());
  }

  function exportToExcel() {
    excelExportService.exportToExcel({ filename: 'Export', format: 'xlsx' });
  }

  function exportToFile(type: 'csv' | 'txt') {
    textExportService.exportToFile({ delimiter: type === 'csv' ? ',' : '\t', filename: 'myExport', format: type });
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid?.resizerService.resizeGrid(0));
  }
</script>

<h2>
  Example 12: Localization (i18n)
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example12.svelte"
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
    Support multiple locales with i18next. Enable <code>enableTranslate</code>, use <code>nameKey</code> for translated headers, and
    translate cell content with a formatter.
    <ul>
      <li>Use a custom formatter when cell values need interpolation.</li>
      <li>Use translation keys for select-filter labels and custom-footer metrics.</li>
      <li>Dates can use a custom formatter when each locale needs a different date format.</li>
      <li>Text and Excel exports can also use translated formatter output.</li>
    </ul>
  </div>
{/if}

<hr />
<div class="row">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="language-button" onclick={switchLanguage}>
      <i class="mdi mdi-translate"></i> Switch Language
    </button>
    <b>Locale:</b> <span style="font-style: italic" data-test="selected-locale">{selectedLanguage}.json</span>
    <span style="margin-left: 20px">
      <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={() => exportToFile('csv')}
        ><i class="mdi mdi-download"></i> Download to CSV</button
      >
      <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={() => exportToFile('txt')}
        ><i class="mdi mdi-download"></i> Download to Text</button
      >
      <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={exportToExcel}
        ><i class="mdi mdi-file-excel-outline text-success"></i> Download to Excel</button
      >
      <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={dynamicallyAddTitleHeader}
        ><i class="mdi mdi-shape-square-plus"></i> Dynamically Duplicate Title Column</button
      >
    </span>
  </div>
</div>

<SlickgridSvelte gridId="grid12" {dataset} {options} {columns} {onGridStateChanged} onSvelteGridCreated={(instance) => (grid = instance)} />
