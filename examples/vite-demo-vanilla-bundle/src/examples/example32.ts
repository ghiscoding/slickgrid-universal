import { Editors, type Column, type GridOption, type ItemMetadata } from '@slickgrid-universal/common';
import { BindingEventService } from '@slickgrid-universal/binding';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options.js';
import './example32.scss';

export default class Example32 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  isEditable = false;
  gridOptions: GridOption;
  dataset: any[] = [];
  sgb: SlickVanillaGridBundle;
  gridContainerElm: HTMLDivElement;
  metadata: ItemMetadata | Record<number, ItemMetadata> = {
    // 10001: Davolio
    0: {
      columns: {
        1: { rowspan: 2 },
        2: { colspan: 2 },
        6: { colspan: 3 },
        10: { colspan: 3, rowspan: 10 },
        13: { colspan: 2 },
        17: { colspan: 2, rowspan: 2 },
      },
    },
    // 10002: (Buchanan... name not shown since Davolio has rowspan=2)
    1: {
      columns: {
        3: { colspan: 3 },
        6: { colspan: 4 },
        13: { colspan: 2, rowspan: 5 },
        15: { colspan: 2 },
      },
    },
    // 10003: Fuller
    2: {
      columns: {
        2: { colspan: 3, rowspan: 2 },
        5: { colspan: 2 },
        7: { colspan: 3 },
        15: { colspan: 2 },
        17: { colspan: 2 },
      },
    },
    // 10004: Leverling
    3: {
      columns: {
        6: { colspan: 4 },
        16: { colspan: 2 },
      },
    },
    // 10005: Peacock
    4: {
      columns: {
        2: { colspan: 4 },
        7: { colspan: 3 },
        15: { colspan: 2, rowspan: 2 },
        17: { colspan: 2 },
      },
    },
    // 10006: Janet
    5: {
      columns: {
        2: { colspan: 2 },
        4: { colspan: 3 },
        7: { colspan: 3 },
        17: { colspan: 2 },
      },
    },
    // 10007: Suyama
    6: {
      columns: {
        2: { colspan: 2 },
        5: { colspan: 2 },
        7: { colspan: 3 },
        14: { colspan: 2 },
        16: { colspan: 3 },
      },
    },
    // 10008: Robert
    7: {
      columns: {
        2: { colspan: 3 },
        5: { colspan: 3 },
        13: { colspan: 3, rowspan: 2 },
        16: { colspan: 2 },
      },
    },
    // 10009: Andrew
    8: {
      columns: {
        2: { colspan: 3 },
        7: { colspan: 3, rowspan: 2 },
        17: { colspan: 2 },
      },
    },
    // 10010: Michael
    9: {
      columns: {
        2: { colspan: 3 },
        5: { colspan: 2 },
        13: { colspan: 3 },
        16: { colspan: 3 },
      },
    },
  };

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData();
    this.gridContainerElm = document.querySelector('.grid32') as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(
      this.gridContainerElm,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );

    document.body.classList.add('salesforce-theme');
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
    document.body.classList.remove('salesforce-theme');
  }

  initializeGrid() {
    this.columnDefinitions = [
      { id: 'employeeID', name: 'Employee ID', field: 'employeeID', minWidth: 100 },
      { id: 'employeeName', name: 'Employee Name', field: 'employeeName', editor: { model: Editors.text }, minWidth: 120 },
      { id: '9:00', name: '9:00 AM', field: '9:00', editor: { model: Editors.text }, minWidth: 120 },
      { id: '9:30', name: '9:30 AM', field: '9:30', editor: { model: Editors.text }, minWidth: 120 },
      { id: '10:00', name: '10:00 AM', field: '10:00', editor: { model: Editors.text }, minWidth: 120 },
      { id: '10:30', name: '10:30 AM', field: '10:30', editor: { model: Editors.text }, minWidth: 120 },
      { id: '11:00', name: '11:00 AM', field: '11:00', editor: { model: Editors.text }, minWidth: 120 },
      { id: '11:30', name: '11:30 AM', field: '11:30', editor: { model: Editors.text }, minWidth: 120 },
      { id: '12:00', name: '12:00 PM', field: '12:00', editor: { model: Editors.text }, minWidth: 120 },
      { id: '12:30', name: '12:30 PM', field: '12:30', editor: { model: Editors.text }, minWidth: 120 },
      { id: '1:00', name: '1:00 PM', field: '1:00', editor: { model: Editors.text }, minWidth: 120 },
      { id: '1:30', name: '1:30 PM', field: '1:30', editor: { model: Editors.text }, minWidth: 120 },
      { id: '2:00', name: '2:00 PM', field: '2:00', editor: { model: Editors.text }, minWidth: 120 },
      { id: '2:30', name: '2:30 PM', field: '2:30', editor: { model: Editors.text }, minWidth: 120 },
      { id: '3:00', name: '3:00 PM', field: '3:00', editor: { model: Editors.text }, minWidth: 120 },
      { id: '3:30', name: '3:30 PM', field: '3:30', editor: { model: Editors.text }, minWidth: 120 },
      { id: '4:00', name: '4:00 PM', field: '4:00', editor: { model: Editors.text }, minWidth: 120 },
      { id: '4:30', name: '4:30 PM', field: '4:30', editor: { model: Editors.text }, minWidth: 120 },
      { id: '5:00', name: '5:00 PM', field: '5:00', editor: { model: Editors.text }, minWidth: 120 },
    ];

    this.gridOptions = {
      autoResize: {
        bottomPadding: 30,
        rightPadding: 50,
      },
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableCellRowSpan: true,
      enableExcelExport: true,
      externalResources: [new ExcelExportService()],
      enableExcelCopyBuffer: true,
      autoEdit: true,
      editable: false,
      datasetIdPropertyName: 'employeeID',
      frozenColumn: 0,
      gridHeight: 348,
      rowHeight: 30,
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (_item, row) => {
            return this.metadata[row];
          },
        },
      },
      rowTopOffsetRenderType: 'top', // rowspan doesn't render well with 'transform', default is 'top'
    };
  }

  navigateDown() {
    this.sgb.slickGrid?.navigateDown();
  }

  navigateUp() {
    this.sgb.slickGrid?.navigateUp();
  }

  navigateNext() {
    this.sgb.slickGrid?.navigateNext();
  }

  navigatePrev() {
    this.sgb.slickGrid?.navigatePrev();
  }

  toggleEditing() {
    this.isEditable = !this.isEditable;
    this.sgb.gridOptions = { ...this.sgb.gridOptions, editable: this.isEditable };
    this.gridOptions = this.sgb.gridOptions;
  }

  loadData() {
    return [
      {
        employeeID: 10001,
        employeeName: 'Davolio',
        '9:00': 'Analysis Tasks',
        '9:30': 'Analysis Tasks',
        '10:00': 'Team Meeting',
        '10:30': 'Testing',
        '11:00': 'Development',
        '11:30': 'Development',
        '12:00': 'Development',
        '12:30': 'Support',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Testing',
        '3:00': 'Testing',
        '3:30': 'Development',
        '4:00': 'Conference',
        '4:30': 'Team Meeting',
        '5:00': 'Team Meeting',
      },
      {
        employeeID: 10002,
        employeeName: 'Buchanan',
        '9:00': 'Task Assign',
        '9:30': 'Support',
        '10:00': 'Support',
        '10:30': 'Support',
        '11:00': 'Testing',
        '11:30': 'Testing',
        '12:00': 'Testing',
        '12:30': 'Testing',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Check Mail',
        '4:00': 'Check Mail',
        '4:30': 'Team Meeting',
        '5:00': 'Team Meeting',
      },
      {
        employeeID: 10003,
        employeeName: 'Fuller',
        '9:00': 'Check Mail',
        '9:30': 'Check Mail',
        '10:00': 'Check Mail',
        '10:30': 'Analysis Tasks',
        '11:00': 'Analysis Tasks',
        '11:30': 'Support',
        '12:00': 'Support',
        '12:30': 'Support',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Team Meeting',
        '4:00': 'Team Meeting',
        '4:30': 'Development',
        '5:00': 'Development',
      },
      {
        employeeID: 10004,
        employeeName: 'Leverling',
        '9:00': 'Testing',
        '9:30': 'Check Mail',
        '10:00': 'Check Mail',
        '10:30': 'Support',
        '11:00': 'Testing',
        '11:30': 'Testing',
        '12:00': 'Testing',
        '12:30': 'Testing',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Check Mail',
        '4:00': 'Conference',
        '4:30': 'Conference',
        '5:00': 'Team Meeting',
      },
      {
        employeeID: 10005,
        employeeName: 'Peacock',
        '9:00': 'Task Assign',
        '9:30': 'Task Assign',
        '10:00': 'Task Assign',
        '10:30': 'Task Assign',
        '11:00': 'Check Mail',
        '11:30': 'Support',
        '12:00': 'Support',
        '12:30': 'Support',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Team Meeting',
        '4:00': 'Team Meeting',
        '4:30': 'Testing',
        '5:00': 'Testing',
      },
      {
        employeeID: 10006,
        employeeName: 'Janet',
        '9:00': 'Testing',
        '9:30': 'Testing',
        '10:00': 'Support',
        '10:30': 'Support',
        '11:00': 'Support',
        '11:30': 'Team Meeting',
        '12:00': 'Team Meeting',
        '12:30': 'Team Meeting',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Team Meeting',
        '4:00': 'Team Meeting',
        '4:30': 'Development',
        '5:00': 'Development',
      },
      {
        employeeID: 10007,
        employeeName: 'Suyama',
        '9:00': 'Analysis Tasks',
        '9:30': 'Analysis Tasks',
        '10:00': 'Testing',
        '10:30': 'Development',
        '11:00': 'Development',
        '11:30': 'Testing',
        '12:00': 'Testing',
        '12:30': 'Testing',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Support',
        '3:00': 'Build',
        '3:30': 'Build',
        '4:00': 'Check Mail',
        '4:30': 'Check Mail',
        '5:00': 'Check Mail',
      },
      {
        employeeID: 10008,
        employeeName: 'Robert',
        '9:00': 'Task Assign',
        '9:30': 'Task Assign',
        '10:00': 'Task Assign',
        '10:30': 'Development',
        '11:00': 'Development',
        '11:30': 'Development',
        '12:00': 'Testing',
        '12:30': 'Support',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Check Mail',
        '3:00': 'Check Mail',
        '3:30': 'Check Mail',
        '4:00': 'Team Meeting',
        '4:30': 'Team Meeting',
        '5:00': 'Build',
      },
      {
        employeeID: 10009,
        employeeName: 'Andrew',
        '9:00': 'Check Mail',
        '9:30': 'Team Meeting',
        '10:00': 'Team Meeting',
        '10:30': 'Support',
        '11:00': 'Testing',
        '11:30': 'Development',
        '12:00': 'Development',
        '12:30': 'Development',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Check Mail',
        '3:00': 'Check Mail',
        '3:30': 'Check Mail',
        '4:00': 'Team Meeting',
        '4:30': 'Development',
        '5:00': 'Development',
      },
      {
        employeeID: 10010,
        employeeName: 'Michael',
        '9:00': 'Task Assign',
        '9:30': 'Task Assign',
        '10:00': 'Task Assign',
        '10:30': 'Analysis Tasks',
        '11:00': 'Analysis Tasks',
        '11:30': 'Development',
        '12:00': 'Development',
        '12:30': 'Development',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Testing',
        '3:00': 'Testing',
        '3:30': 'Testing',
        '4:00': 'Build',
        '4:30': 'Build',
        '5:00': 'Build',
      },
    ];
  }
}
