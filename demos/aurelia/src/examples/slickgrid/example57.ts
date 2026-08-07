import { Formatters, type AureliaGridInstance, type Column, type GridOption } from 'aurelia-slickgrid';

const NB_ITEMS = 100;

export class Example57 {
  gridOptions!: GridOption;
  columns: Column[] = [];
  dataset: any[] = [];

  constructor() {
    this.defineGrid();
  }

  attached() {
    this.dataset = this.mockData(NB_ITEMS);
  }

  defineGrid() {
    this.columns = [
      { id: 'id', name: 'ID', field: 'id', filterable: true, sortable: true, minWidth: 60 },
      { id: 'title', name: 'Title', field: 'title', filterable: true, sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', filterable: true, sortable: true, minWidth: 100, type: 'number' },
      { id: '%', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true, minWidth: 100, type: 'number' },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', minWidth: 80 },
    ];

    this.gridOptions = {
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableResizeByContent: true,
      gridHeight: 500,
      gridWidth: 700,
      rowHeight: 33,
      rtl: true, // ← Enable RTL mode
      showColumnHeader: true,
      showHeaderRow: true,
      showFooterRow: false,
    };
  }

  mockData(count: number) {
    const data: any[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        id: i,
        title: `Task ${i}`,
        duration: Math.round(Math.random() * 100),
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(2024, 0, 1 + Math.floor(Math.random() * 30)).toISOString().split('T')[0],
        finish: new Date(2024, 1, 1 + Math.floor(Math.random() * 28)).toISOString().split('T')[0],
        effortDriven: i % 5 === 0,
      });
    }
    return data;
  }
}
