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
        onBeforePasteCell: (_e, args) => {
          // for the sake of the demo, do not allow to paste into the first column title
          // this will be overriden by the row based edit plugin to additionally only work if the row is in editmode
          return args.cell > 0;
        },
      },
      autoEdit: false, // NOTE: this will be automatically turned to true by the Row Based Edit Plugin
      editable: true,
      enableCellNavigation: true,
      enableRowBasedEdit: true,
      rowBasedEditOptions: {
        allowMultipleRows: false,
        onBeforeRowUpdated(args) {
          const { effortDriven, percentComplete, finish, start, duration, title } = args.dataContext;

          if (duration > 40) {
            alert('Sorry, 40 is the maximum allowed duration.');
            return Promise.resolve(false);
          }

          return fakeFetch('your-backend-api/endpoint', {
            method: 'POST',
            body: JSON.stringify({ effortDriven, percentComplete, finish, start, duration, title }),
            headers: {
              'Content-type': 'application/json; charset=UTF-8'
            }
          }).catch(err => {
            console.error(err);
            return false;
          })
          .then(response => {
            if (response === false) {
              return false;
            }
            if (typeof response === 'object') {
              return response!.json();
            }
          })
          .then(json => {
            alert(json.message);
            return true;
          });
        },
        actionButtons: {
          editButtonClassName: 'button-style padding-1px mr-2',
          iconEditButtonClassName: 'mdi mdi-pencil',
          editButtonTitle: 'Edit row',

          cancelButtonClassName: 'button-style padding-1px',
          cancelButtonTitle: 'Cancel row',
          iconCancelButtonClassName: 'mdi mdi-undo color-danger',
          cancelButtonPrompt: 'Are you sure you want to cancel your changes?',

          updateButtonClassName: 'button-style padding-1px mr-2',
          updateButtonTitle: 'Update row',
          iconUpdateButtonClassName: 'mdi mdi-check color-success',
          updateButtonPrompt: 'Save changes?',

          deleteButtonClassName: 'button-style padding-1px',
          deleteButtonTitle: 'Delete row',
          iconDeleteButtonClassName: 'mdi mdi-trash-can color-danger',
          deleteButtonPrompt: 'Are you sure you want to delete this row?',
        }
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
        duration: Math.round(Math.random() * 40) + '',
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
