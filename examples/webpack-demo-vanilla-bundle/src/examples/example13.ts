import {
  BindingEventService,
  Column,
  GridOption,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import '../material-styles.scss';
import './example02.scss';

let columnsWithHighlightingById = {};

// create a custom Formatter to highlight negative values in red
const highlightingFormatter = (_row, _cell, value, columnDef) => {
  if (columnsWithHighlightingById[columnDef.id] && value < 0) {
    return `<div style="color:red; font-weight:bold;">${value}</div>`;
  } else {
    return value;
  }
};

export class Example13 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  commandQueue = [];
  sgb: SlickVanillaGridBundle;
  excelExportService: ExcelExportService;

  constructor() {
    this.excelExportService = new ExcelExportService();
    this._bindingEventService = new BindingEventService();
    columnsWithHighlightingById = {};
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData();
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid13`);

    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
  }

  initializeGrid() {
    this.columnDefinitions = [];

    this.gridOptions = {
      enableAutoResize: true,
      enableHeaderButton: true,
      enableHeaderMenu: false,
      autoResize: {
        container: '.demo-container',
      },
      enableFiltering: false,
      enableCellNavigation: true,
      headerButton: {
        // you can use the "onCommand" (in Grid Options) and/or the "action" callback (in Column Definition)
        onCommand: (_e, args) => {
          const column = args.column;
          const button = args.button;
          const command = args.command;

          if (command === 'toggle-highlight') {
            if (button.cssClass === 'mdi mdi-lightbulb-on color-danger') {
              delete columnsWithHighlightingById[column.id];
              button.cssClass = 'mdi mdi-lightbulb-outline color-warning faded';
              button.tooltip = 'Highlight negative numbers.';
            } else {
              columnsWithHighlightingById[column.id] = true;
              button.cssClass = 'mdi mdi-lightbulb-on color-danger';
              button.tooltip = 'Remove highlight.';
            }
            this.sgb.slickGrid.invalidate();
          }
        }
      }
    };
  }

  loadData() {
    // Set up some test columns.
    for (let i = 0; i < 10; i++) {
      this.columnDefinitions.push({
        id: i,
        name: 'Column ' + String.fromCharCode('A'.charCodeAt(0) + i),
        field: i + '',
        width: i === 0 ? 70 : 100, // have the 2 first columns wider
        sortable: true,
        formatter: highlightingFormatter,
        header: {
          buttons: [
            {
              cssClass: 'mdi mdi-lightbulb-outline color-warning faded',
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
              }
            }
          ]
        }
      });
    }

    // Set multiple buttons on the first column to demonstrate overflow.
    this.columnDefinitions[0].name = 'Resize me!';
    this.columnDefinitions[0].header = {
      buttons: [
        {
          cssClass: 'mdi mdi-message-text',
          handler: () => {
            alert('Tag');
          }
        },
        {
          cssClass: 'mdi mdi-forum-outline',
          handler: () => {
            alert('Comment');
          }
        },
        {
          cssClass: 'mdi mdi-information-outline',
          handler: () => {
            alert('Info');
          }
        },
        {
          cssClass: 'mdi mdi-help-circle-outline',
          handler: () => {
            alert('Help');
          }
        }
      ]
    };

    // Set a button on the second column to demonstrate hover.
    this.columnDefinitions[1].name = 'Hover me!';
    this.columnDefinitions[1].header = {
      buttons: [
        {
          cssClass: 'mdi mdi-help-circle-outline',
          showOnHover: true,
          tooltip: 'This button only appears on hover.',
          handler: () => {
            alert('Help');
          }
        }
      ]
    };

    // mock a dataset
    const mockDataset = [];
    for (let i = 0; i < 100; i++) {
      const d = (mockDataset[i] = {});
      d['id'] = i;
      for (let j = 0; j < this.columnDefinitions.length; j++) {
        d[j] = Math.round(Math.random() * 10) - 5;
      }
    }
    return mockDataset;
  }
}
