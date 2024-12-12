import { type Column, type GridOption, toCamelCase } from '@slickgrid-universal/common';
import { BindingEventService } from '@slickgrid-universal/binding';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options.js';
import './example04.scss';

export default class Example31 {
  staticDataCsv =
    `First Name,Last Name,Age,Type\nBob,Smith,33,Teacher\nJohn,Doe,20,Student\nJane,Doe,21,Student`;
  private _bindingEventService: BindingEventService;
  sgb: SlickVanillaGridBundle;

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    const uploadInputElm = document.getElementById('fileInput') as HTMLInputElement;
    const staticBtnElm = document.getElementById('uploadBtn') as HTMLButtonElement;
    this._bindingEventService.bind(uploadInputElm, 'change', this.handleFileImport.bind(this));
    this._bindingEventService.bind(staticBtnElm, 'click', () => this.dynamicallyCreateGrid(this.staticDataCsv));

    const templateUrl = new URL('./data/users.csv', import.meta.url).href;
    (document.getElementById('template-dl') as HTMLAnchorElement).href = templateUrl;
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
  }

  handleFileImport(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        this.dynamicallyCreateGrid(content);
      };
      reader.readAsText(file);
    }
  }

  dynamicallyCreateGrid(csvContent: string) {
    // dispose of any previous grid before creating a new one
    this.sgb?.dispose();

    const dataRows = csvContent?.split('\n');
    const columnDefinitions: Column[] = [];
    const dataset: any[] = [];

    // create column definitions
    dataRows.forEach((dataRow, rowIndex) => {
      const cellValues = dataRow.split(',');
      const dataEntryObj: any = {};

      if (rowIndex === 0) {
        // the 1st row is considered to be the header titles, we can create the column definitions from it
        for (const cellVal of cellValues) {
          const camelFieldName = toCamelCase(cellVal);
          columnDefinitions.push({
            id: camelFieldName,
            name: cellVal,
            field: camelFieldName,
            filterable: true,
            sortable: true,
          });
        }
      } else {
        // at this point all column defs were created and we can loop through them and
        // we can now start adding data as an object and then simply push it to the dataset array
        cellValues.forEach((cellVal, colIndex) => {
          dataEntryObj[columnDefinitions[colIndex].id] = cellVal;
        });

        // a unique "id" must be provided, if not found then use the row index and push it to the dataset
        if ('id' in dataEntryObj) {
          dataset.push(dataEntryObj);
        } else {
          dataset.push({ ...dataEntryObj, id: rowIndex });
        }
      }
    });

    const gridOptions: GridOption = {
      gridHeight: 300,
      gridWidth: 800,
      enableFiltering: true,
      enableExcelExport: true,
      externalResources: [new ExcelExportService()],
      headerRowHeight: 35,
      rowHeight: 33,
    };

    // for this use case, we need to recreate the grid container div because the previous grid.dispose() drops it
    const gridContainerElm = document.createElement('div');
    gridContainerElm.className = 'grid31';
    document.querySelector('.grid-container-zone')!.appendChild(gridContainerElm);
    this.sgb = new Slicker.GridBundle(gridContainerElm, columnDefinitions, { ...ExampleGridOptions, ...gridOptions }, dataset);
  }
}