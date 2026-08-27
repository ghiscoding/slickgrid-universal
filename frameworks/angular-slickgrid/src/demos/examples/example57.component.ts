import { Component, type OnDestroy, type OnInit } from '@angular/core';
import { AngularSlickgridComponent, Formatters, type Column, type GridOption } from '../../library';

const NB_ITEMS = 100;

@Component({
  templateUrl: './example57.component.html',
  styleUrls: ['./example57.component.scss'],
  imports: [AngularSlickgridComponent],
})
export class Example57Component implements OnInit, OnDestroy {
  columns: Column[] = [];
  gridOptions!: GridOption;
  dataset!: any[];
  hideSubTitle = false;
  previousBodyDir: string | null = null;

  ngOnInit(): void {
    this.previousBodyDir = document.body.getAttribute('dir');
    document.body.setAttribute('dir', 'rtl');

    this.prepareGrid();
    this.dataset = this.mockData(NB_ITEMS);
  }

  ngOnDestroy(): void {
    if (this.previousBodyDir) {
      document.body.setAttribute('dir', this.previousBodyDir);
    } else {
      document.body.removeAttribute('dir');
    }
  }

  prepareGrid() {
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
      gridWidth: 700,
      rowHeight: 33,
      rtl: true, // ← Enable RTL mode
    };
  }

  mockData(count: number) {
    const data = [];
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

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
  }
}
