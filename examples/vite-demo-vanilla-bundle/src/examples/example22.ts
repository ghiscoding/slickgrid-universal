import {
  type Column,
  FieldType,
  Formatters,
  type GridOption,
  Editors,
} from '@slickgrid-universal/common';
import {
  Slicker,
  SlickVanillaGridBundle,
} from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

import './example22.scss';

const NB_ITEMS = 20;

export default class Example22 {
  gridOptions!: GridOption;
  columnDefinitions!: Column[];
  dataset!: any[];
  sgb!: SlickVanillaGridBundle;

  attached() {
    // override CSS template to be Material Design
    // await import('@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-salesforce.scss');

    this.defineGrids();

    // mock some data (different in each dataset)
    this.dataset = this.mockData(NB_ITEMS);

    this.sgb = new Slicker.GridBundle(
      document.querySelector(`.grid1`) as HTMLDivElement,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
  }

  dispose() {
    this.sgb?.dispose();
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        minWidth: 100,
        filterable: true,
        editor: { model: Editors.text },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: FieldType.number,
        editor: { model: Editors.text },
      },
      {
        id: '%',
        name: '% Complete',
        field: 'percentComplete',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: FieldType.number,
        editor: { model: Editors.text },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
        editor: { model: Editors.text },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
        editor: { model: Editors.text },
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        sortable: true,
        minWidth: 100,
        filterable: true,
        editor: { model: Editors.text },
      },
    ];
    this.gridOptions = {
      enableAutoResize: false,
      gridHeight: 225,
      gridWidth: 800,
      rowHeight: 33,
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        onBeforePasteCell: (e, args) => {
          console.log('paste', e, args);
          return args.cell > 0;
        },
      },

      editable: true,
      autoEdit: false,
      enableCellNavigation: true,
      enableRowBasedEdit: true,
      rowBasedEditOptions: {
        allowMultipleRows: false,
        onAfterRowUpdated(args) {
          const { effortDriven, percentComplete, finish, start, duration, title } = args.dataContext;

          fakeFetch('your-backend-api/endpoint', {
            method: 'POST',
            body: JSON.stringify({ effortDriven, percentComplete, finish, start, duration, title }),
            headers: {
              'Content-type': 'application/json; charset=UTF-8'
            }
          }).catch(err => console.error(err))
          .then(response => response!.json())
          .then(json => alert(json.message));
        },
      },
    };
  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  toggleSingleMultiRowEdit() {
    this.sgb.gridOptions = this.sgb.gridOptions = {
      ...this.sgb.gridOptions,
      ...{
        rowBasedEditOptions: {
          ...this.sgb.gridOptions.rowBasedEditOptions,
          ...{ allowMultipleRows: !this.sgb.gridOptions.rowBasedEditOptions?.allowMultipleRows },
        },
      },
    };

    this.gridOptions = this.sgb.gridOptions;
  }
}

function fakeFetch(_input: string | URL | Request, _init?: RequestInit | undefined): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Response(JSON.stringify({ status: 200, message: 'success' })));
    }, 500);
  });
}
