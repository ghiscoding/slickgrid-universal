import {
  toCamelCase,
  type Column,
  type GridOption,
} from '@slickgrid-universal/common';
import { BindingEventService } from '@slickgrid-universal/binding';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options.js';
import './example04.scss';


export default class Example31 {
  importedData = [
    'First Name,Last Name,Age,Type',
    'John,Doe,20,Student',
    'Bob,Smith,33,Teacher',
    'Jane,Doe,21,Student',
  ];
  private _bindingEventService: BindingEventService;
  sgb: SlickVanillaGridBundle;

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    const { columnDefinitions, dataset } = this.dynamicallyCreateGrid();
    const gridContainerElm = document.querySelector(`.grid31`) as HTMLDivElement;

    const gridOptions: GridOption = {
      gridHeight: 300,
      gridWidth: 800,
      enableFiltering: true,
    };

    this.sgb = new Slicker.GridBundle(gridContainerElm, columnDefinitions, { ...ExampleGridOptions, ...gridOptions }, dataset);
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
  }

  dynamicallyCreateGrid() {
    const columnDefinitions: Column[] = [];
    const dataset: any[] = [];

    // create column definitions
    this.importedData.forEach((dataRow, rowIndex) => {
      const cellValues = dataRow.split(',');
      const dataEntryObj = {};

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
            type: isNaN(cellVal as any) ? 'string' : 'number'
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

    return { columnDefinitions, dataset };
  }
}