import { Formatters, type Column, type GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example46.scss';

const NB_ITEMS = 100;

export default class Example46 {
  gridOptions!: GridOption;
  columns!: Column[];
  dataset!: any[];
  sgb!: SlickVanillaGridBundle;
  previousBodyDir: string | null = null;

  attached() {
    this.previousBodyDir = document.body.getAttribute('dir');
    document.body.setAttribute('dir', 'rtl');

    this.defineGrid();
    this.dataset = this.mockData(NB_ITEMS);

    this.sgb = new Slicker.GridBundle(
      document.querySelector('.grid46') as HTMLDivElement,
      this.columns,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
  }

  dispose() {
    this.sgb?.dispose();
    if (this.previousBodyDir) {
      document.body.setAttribute('dir', this.previousBodyDir);
    } else {
      document.body.removeAttribute('dir');
    }
  }

  defineGrid() {
    this.columns = [
      { id: 'id', name: 'ID', field: 'id', filterable: true, sortable: true, minWidth: 60 },
      { id: 'title', name: 'Title', field: 'title', filterable: true, sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', filterable: true, sortable: true, minWidth: 100, type: 'number' },
      { id: '%', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true, minWidth: 100, type: 'number' },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
      },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', minWidth: 80 },
    ];

    this.gridOptions = {
      enableFiltering: true,
      // Disabled in RTL because SortableJS lacks RTL support; patch SortableJS or use https://github.com/HamadHadi/Sortable-rtl to enable it.
      enableColumnReorder: false,
      gridHeight: 500,
      gridWidth: 900,
      rowHeight: 33,
      rtl: true, // ← Enable RTL mode
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
