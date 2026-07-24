import type { Column, GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example44.scss';

const NB_ITEMS = 200;

interface StoryItem {
  id: number;
  title: string;
  owner: string;
  summary: string;
  rowHeight: number;
}

export default class Example44 {
  columns: Column[] = [];
  dataset: StoryItem[] = [];
  gridOptions!: GridOption;
  sgb!: SlickVanillaGridBundle;

  attached() {
    this.defineGrid();
    this.dataset = this.getData(NB_ITEMS);
    this.sgb = new Slicker.GridBundle(
      document.querySelector('.grid44') as HTMLDivElement,
      this.columns,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
  }

  dispose() {
    this.sgb?.dispose();
  }

  scrollToRow90() {
    this.sgb?.slickGrid?.scrollRowToTop(90);
  }

  defineGrid() {
    this.columns = [
      { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
      { id: 'title', name: 'Story', field: 'title', minWidth: 180, width: 220 },
      { id: 'owner', name: 'Owner', field: 'owner', minWidth: 110, width: 130 },
      { id: 'rowHeight', name: 'Height', field: 'rowHeight', formatter: (_row, _cell, value) => `${value}px`, minWidth: 90, width: 90 },
      { id: 'summary', name: 'Summary', field: 'summary', cssClass: 'cell-wrap', minWidth: 360, width: 500, maxWidth: 620 },
    ];

    const gridOptions: GridOption = {
      enableCellNavigation: true,
      enableTextSelectionOnCells: true,
      rowHeight: 40,
      gridHeight: 560,
      gridWidth: 1080,
      rowHeightProvider: (_grid, _row, item: StoryItem) => item.rowHeight,
    };
    this.gridOptions = gridOptions;
  }

  getData(itemCount: number): StoryItem[] {
    const owners = ['Alex', 'Priya', 'Mia', 'Sam', 'Chris'];
    const fragments = [
      'Refactor keyboard shortcut handling for better readability.',
      'Adjust frozen rows when view-model updates after grouping.',
      'Improve screen-reader labels on grid menu actions.',
      'Align batch editor validation with backend constraints.',
      'Capture edge-case around hidden columns and row-span.',
    ];

    const data: StoryItem[] = [];
    for (let i = 0; i < itemCount; i++) {
      const lineCount = (i % 4) + 1;
      const summary = Array.from({ length: lineCount }, (_, idx) => `${fragments[(i + idx) % fragments.length]}`).join(' ');
      const wordCount = summary.trim().split(/\s+/).length;
      const computedRowHeight = Math.max(45, 8 + lineCount * 16);
      data.push({
        id: i,
        title: `Story ${i}`,
        owner: owners[i % owners.length],
        summary,
        // Keep very short notes compact to make row-height differences easier to spot.
        rowHeight: wordCount < 10 ? 33 : computedRowHeight,
      });
    }
    return data;
  }
}
