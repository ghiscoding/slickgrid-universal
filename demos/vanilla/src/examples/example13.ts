import { BindingEventService } from '@slickgrid-universal/binding';
import { type Column, Editors, type GridOption } from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options.js';
import '../material-styles.scss';
import './example13.scss';

let columns1WithHighlightingById = {};
let columns2WithHighlightingById = {};

export default class Example13 {
  private _bindingEventService: BindingEventService;
  columnDefinitions1: Column[];
  columnDefinitions2: Column[];
  gridOptions1: GridOption;
  gridOptions2: GridOption;
  dataset1: any[];
  dataset2: any[];
  sgb1: SlickVanillaGridBundle;
  sgb2: SlickVanillaGridBundle;
  excelExportService1: ExcelExportService;
  excelExportService2: ExcelExportService;

  constructor() {
    this.excelExportService1 = new ExcelExportService();
    this.excelExportService2 = new ExcelExportService();
    this._bindingEventService = new BindingEventService();
    columns1WithHighlightingById = {};
    columns2WithHighlightingById = {};
  }

  attached() {
    this.initializeGrid();
    this.dataset1 = this.loadData(200, 1);
    this.dataset2 = this.loadData(200, 2);
    const gridContainerElm1 = document.querySelector(`.grid13-1`) as HTMLDivElement;
    const gridContainerElm2 = document.querySelector(`.grid13-2`) as HTMLDivElement;

    this.sgb1 = new Slicker.GridBundle(
      gridContainerElm1,
      this.columnDefinitions1,
      { ...ExampleGridOptions, ...this.gridOptions1 },
      this.dataset1
    );
    this.sgb2 = new Slicker.GridBundle(
      gridContainerElm2,
      this.columnDefinitions2,
      { ...ExampleGridOptions, ...this.gridOptions2 },
      this.dataset2
    );
    document.body.classList.add('material-theme');
  }

  dispose() {
    this.sgb1?.dispose();
    this.sgb2?.dispose();
    this._bindingEventService.unbindAll();
    document.body.classList.remove('material-theme');
  }

  initializeGrid() {
    this.columnDefinitions1 = [];
    this.columnDefinitions2 = [];

    this.gridOptions1 = {
      enableAutoResize: true,
      enableHeaderButton: true,
      enableHeaderMenu: false,
      autoCommitEdit: true,
      autoEdit: true,
      editable: true,
      autoResize: {
        container: '.demo-container',
      },
      enableFiltering: false,
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        onCopyCells: (e, args) => console.log('onCopyCells', e, args),
        onPasteCells: (e, args) => console.log('onPasteCells', e, args),
        onCopyCancelled: (e, args) => console.log('onCopyCancelled', e, args),
      },
      enableCellNavigation: true,
      gridHeight: 275,
      headerButton: {
        // you can use the "onCommand" (in Grid Options) and/or the "action" callback (in Column Definition)
        onCommand: (_e, args) => this.handleOnCommand(_e, args, 1),
      },
    };

    // grid 2 options, same as grid 1 + extras
    this.gridOptions2 = {
      ...this.gridOptions1,
      enableHeaderMenu: true,
      enableFiltering: true,
      // frozenColumn: 2,
      // frozenRow: 2,
      headerButton: {
        onCommand: (_e, args) => this.handleOnCommand(_e, args, 2),
      },
    };
  }

  handleOnCommand(_e, args, gridNo: 1 | 2) {
    const column = args.column;
    const button = args.button;
    const command = args.command;

    if (command === 'toggle-highlight') {
      if (button.cssClass === 'mdi mdi-lightbulb-on text-color-danger') {
        if (gridNo === 1) {
          delete columns1WithHighlightingById[column.id];
        } else {
          delete columns2WithHighlightingById[column.id];
        }
        button.cssClass = 'mdi mdi-lightbulb-outline text-color-warning faded';
        button.tooltip = 'Highlight negative numbers.';
      } else {
        if (gridNo === 1) {
          columns1WithHighlightingById[column.id] = true;
        } else {
          columns2WithHighlightingById[column.id] = true;
        }
        button.cssClass = 'mdi mdi-lightbulb-on text-color-danger';
        button.tooltip = 'Remove highlight.';
      }
      this[`sgb${gridNo}`].slickGrid?.invalidate();
    }
  }

  loadData(count: number, gridNo: 1 | 2) {
    // Set up some test columns.
    for (let i = 0; i < 10; i++) {
      this[`columnDefinitions${gridNo}`].push({
        id: i,
        name: 'Column ' + String.fromCharCode('A'.charCodeAt(0) + i),
        field: i + '',
        width: i === 0 ? 70 : 100, // make the first 2 columns wider
        filterable: true,
        sortable: true,
        type: 'number',
        editor: { model: Editors.integer },
        formatter: (_row, _cell, value, columnDef) => {
          if (
            (gridNo === 1 && columns1WithHighlightingById[columnDef.id] && value < 0) ||
            (gridNo === 2 && columns2WithHighlightingById[columnDef.id] && value < 0)
          ) {
            return `<div class="text-red text-bold">${value}</div>`;
          }
          return value;
        },
        header: {
          buttons: [
            {
              cssClass: 'mdi mdi-lightbulb-outline text-color-warning faded',
              command: 'toggle-highlight',
              tooltip: 'Highlight negative numbers.',
              itemVisibilityOverride: (args) => {
                // for example don't show the header button on column "E"
                return args.column.name !== 'Column E';
              },
              itemUsabilityOverride: (args) => {
                // for example the button usable everywhere except on last column ='J"
                return args.column.name !== 'Column J';
              },
              action: (_e, args) => {
                // you can use the "action" callback and/or subscribe to the "onCallback" event, they both have the same arguments
                // do something
                console.log(`execute a callback action to "${args.command}" on ${args.column.name}`);
              },
            },
          ],
        },
      });
    }

    // Set multiple buttons on the first column to demonstrate overflow.
    this[`columnDefinitions${gridNo}`][0].name = 'Resize me!';
    this[`columnDefinitions${gridNo}`][0].header = {
      buttons: [
        {
          cssClass: 'mdi mdi-message-text',
          handler: () => {
            alert('Tag');
          },
        },
        {
          cssClass: 'mdi mdi-forum-outline',
          handler: () => {
            alert('Comment');
          },
        },
        {
          cssClass: 'mdi mdi-information-outline',
          handler: () => {
            alert('Info');
          },
        },
        {
          cssClass: 'mdi mdi-help-circle-outline',
          handler: () => {
            alert('Help');
          },
        },
      ],
    };

    // when floating to left, you might want to inverse the icon orders
    if (gridNo === 2) {
      this.columnDefinitions2[0].header?.buttons?.reverse();
    }

    // Set a button on the second column to demonstrate hover.
    this[`columnDefinitions${gridNo}`][1].name = 'Hover me!';
    this[`columnDefinitions${gridNo}`][1].header = {
      buttons: [
        {
          cssClass: 'mdi mdi-help-circle-outline',
          showOnHover: true,
          tooltip: 'This button only appears on hover.',
          handler: () => {
            alert('Help');
          },
        },
      ],
    };

    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      const d = (mockDataset[i] = {});
      d['id'] = i;
      for (let j = 0; j < this[`columnDefinitions${gridNo}`].length; j++) {
        d[j] = Math.round(Math.random() * 10) - 5;
      }
    }
    return mockDataset;
  }
}
