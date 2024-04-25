import {
  type Column,
  FieldType,
  Formatters,
  type GridOption,
  Editors,
} from '@slickgrid-universal/common';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { BindingEventService } from '@slickgrid-universal/binding';

import { ExampleGridOptions } from './example-grid-options';
import './example22.scss';
import type { TranslateService } from '../translate.service';

const NB_ITEMS = 20;

export default class Example22 {
  gridOptions!: GridOption;
  columnDefinitions!: Column[];
  dataset!: any[];
  sgb!: SlickVanillaGridBundle;
  translateService: TranslateService;
  selectedLanguage: string;
  selectedLanguageFile: string;
  fetchResult = '';
  statusClass = 'is-success';
  statusStyle = 'display: none';
  private _bindingEventService: BindingEventService;

  constructor() {
    this.translateService = (<any>window).TranslateService;
    this.selectedLanguage = this.translateService.getCurrentLanguage();
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.defineGrids();

    // mock some data (different in each dataset)
    this.dataset = this.mockData(NB_ITEMS);

    this.sgb = new Slicker.GridBundle(
      document.querySelector(`.grid1`) as HTMLDivElement,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );

    this._bindingEventService.bind(document.querySelector(`.grid1`)!, 'onvalidationerror', (event) =>
      alert((event as CustomEvent)?.detail.args.validationResults.msg)
    );
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
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
        editor: { model: Editors.text, validator: (val) => (val > 100 ? { msg: 'Max 100% allowed', valid: false } : { msg: '', valid: true }) },
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

    this.gridOptions = {
      enableAutoResize: false,
      gridHeight: 350,
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
      // NOTE: this will be automatically turned to true by the Row Based Edit Plugin.
      // A console warning will be shown if you omit this flag
      autoEdit: false,
      editable: true,
      enableCellNavigation: true,
      enableRowBasedEdit: true,
      rowBasedEditOptions: {
        allowMultipleRows: false,
        onBeforeEditMode: () => this.clearStatus(),
        onBeforeRowUpdated: (args) => {
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
                this.statusClass = 'notification is-danger';
                return false;
              }
              if (typeof response === 'object') {
                return response!.json();
              }
            })
            .then(json => {
              this.statusStyle = 'display: block';
              this.statusClass = 'notification is-light is-success';
              this.fetchResult = json.message;
              return true;
            });
        },
        actionColumnConfig: { // override the defaults of the action column
          width: 100,
          minWidth: 100,
          maxWidth: 100,
        },
        actionButtons: {
          editButtonClassName: 'button-style padding-3px mr-2',
          iconEditButtonClassName: 'sgi sgi-pencil',
          // since no title and no titleKey is provided, it will fallback to the default text provided by the plugin
          // if the title is provided but no titleKey, it will override the default text
          // last but not least if a titleKey is provided, it will use the translation key to translate the text
          // editButtonTitle: 'Edit row',

          cancelButtonClassName: 'button-style padding-3px',
          cancelButtonTitle: 'Cancel row',
          cancelButtonTitleKey: 'RBE_BTN_CANCEL',
          iconCancelButtonClassName: 'sgi sgi-undo text-color-danger',
          cancelButtonPrompt: 'Are you sure you want to cancel your changes?',

          updateButtonClassName: 'button-style padding-3px mr-2',
          updateButtonTitle: 'Update row',
          updateButtonTitleKey: 'RBE_BTN_UPDATE',
          iconUpdateButtonClassName: 'sgi sgi-check text-color-success',
          updateButtonPrompt: 'Save changes?',

          deleteButtonClassName: 'button-style padding-3px',
          deleteButtonTitle: 'Delete row',
          iconDeleteButtonClassName: 'sgi sgi-trash-can text-color-danger',
          deleteButtonPrompt: 'Are you sure you want to delete this row?',
        },
      },
      enableTranslate: true,
      translater: this.translateService,
      externalResources: [new SlickCustomTooltip()]
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

  clearStatus() {
    this.statusClass = '';
    this.statusStyle = 'display: none';
    this.fetchResult = '';
  }

  toggleSingleMultiRowEdit() {
    this.sgb.gridOptions = {
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

  async switchLanguage() {
    const nextLanguage = (this.selectedLanguage === 'en') ? 'fr' : 'en';
    await this.translateService.use(nextLanguage);
    this.selectedLanguage = nextLanguage;
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
  }
}

function fakeFetch(_input: string | URL | Request, _init?: RequestInit | undefined): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Response(JSON.stringify({ status: 200, message: 'success' })));
      // reduces the delay for automated Cypress tests
    }, (window as any).Cypress ? 10 : 500);
  });
}
