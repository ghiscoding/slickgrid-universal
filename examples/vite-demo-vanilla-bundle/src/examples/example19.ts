import {
  Column,
  FieldType,
  Filters,
  Formatters,
  GridOption,
} from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';
import '../material-styles.scss';

const NB_ITEMS = 500;

export default class Example34 {
  title = 'Example 19: ExcelCopyBuffer with Cell Selection';
  subTitle = `Cell Selection using "Shift+{key}" where "key" can be any of:
  <ul>
    <li>Arrow Up/Down/Left/Right</li>
    <li>Page Up/Down</li>
    <li>Home</li>
    <li>End</li>
  </ul>`;

  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  gridOptions!: GridOption;
  sgb: SlickVanillaGridBundle;

  attached() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.getData(NB_ITEMS);
    this.sgb = new Slicker.GridBundle(document.querySelector(`.grid19`) as HTMLDivElement, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    document.body.classList.add('material-theme');
  }

  dispose() {
    this.sgb?.dispose();
    document.body.classList.remove('material-theme');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    // the columns field property is type-safe, try to add a different string not representing one of DataItems properties
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string, width: 70, filterable: true },
      { id: 'phone', name: 'Phone Number using mask', field: 'phone', sortable: true, type: FieldType.number, minWidth: 100, formatter: Formatters.mask, params: { mask: '(000) 000-0000' }, filterable: true },
      {
        id: 'duration', name: 'Duration (days)', field: 'duration', formatter: Formatters.decimal, params: { minDecimal: 1, maxDecimal: 2 },
        sortable: true, type: FieldType.number, minWidth: 90, exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundInputNumber }
      },
      { id: 'complete', name: '% Complete', field: 'percentComplete', formatter: Formatters.percentCompleteBar, type: FieldType.number, sortable: true, minWidth: 100, filterable: true, filter: { model: Filters.slider } },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, sortable: true, type: FieldType.date, minWidth: 90, exportWithFormatter: true, filterable: true },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, sortable: true, type: FieldType.date, minWidth: 90, exportWithFormatter: true, filterable: true },
      {
        id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: FieldType.boolean, sortable: true, minWidth: 100 , filterable: true,
        formatter: (_row, _cell, value) => {
          // you can return a string of a object (of type FormatterResultObject), the 2 types are shown below
          return value ? `<i class="mdi mdi-fire color-danger" aria-hidden="true"></i>` : { text: '<i class="mdi mdi-snowflake color-info-light" aria-hidden="true"></i>', toolTip: 'Freezing' };
        },
        filter: {
          enableRenderHtml: true,
          collection: [
            { value: '', label: '' },
            { value: true, labelPrefix: '<i class="mdi-v-align-middle mdi mdi-fire color-danger" aria-hidden="true"></i> ', label: 'a lot of effort' },
            { value: false, labelPrefix: '<i class="mdi-v-align-middle mdi mdi-snowflake color-info-light" aria-hidden="true"></i> ', label: 'not that much' }
          ],
          model: Filters.singleSelect
        },
      },
      {
        id: 'completed', name: 'Completed', field: 'completed', type: FieldType.boolean, sortable: true, minWidth: 100, filterable: true,
        formatter: (_row, _cell, value) => value ? '<i class="mdi mdi-check"></i>' : '',
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect
        },
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableCellNavigation: true,
      enableFiltering: true,
      enablePagination: true,
      pagination: {
        pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
        pageSize: 10
      },
      rowHeight: 40,

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      // excelCopyBufferOptions: {
      //   onCopyCells: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCells', args.ranges),
      //   onPasteCells: (e, args: { ranges: SelectedRange[] }) => console.log('onPasteCells', args.ranges),
      //   onCopyCancelled: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCancelled', args.ranges),
      // }
    };
  }

  getData(itemCount: number) {
    // mock a dataset
    const datasetTmp: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 20);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      datasetTmp[i] = {
        id: i,
        title: 'Task ' + i,
        phone: this.generatePhoneNumber(),
        duration: Math.random() * 100 + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, (randomMonth + 1), randomDay),
        effortDriven: (i % 4 === 0),
        completed: (i % 3 === 0)
      };
    }
    return datasetTmp;
  }

  generatePhoneNumber(): string {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }
}
