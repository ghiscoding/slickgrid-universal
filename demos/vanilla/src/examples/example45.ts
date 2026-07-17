import type { Column, GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example45.scss';

const NB_ITEMS = 150;

interface TaskItem {
  id: number;
  title: string;
  status: 'Todo' | 'In Progress' | 'Done';
  notes: string;
}

export default class Example45 {
  columns: Column[] = [];
  dataset: TaskItem[] = [];
  gridOptions!: GridOption;
  sgb!: SlickVanillaGridBundle;
  isCompact = false;

  attached() {
    this.defineGrid();
    this.dataset = this.getData(NB_ITEMS);

    this.sgb = new Slicker.GridBundle(
      document.querySelector('.grid45') as HTMLDivElement,
      this.columns,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
  }

  dispose() {
    this.sgb?.dispose();
  }

  toggleDensity() {
    this.isCompact = !this.isCompact;
    (this.sgb?.slickGrid as { invalidateRowHeights?: () => void } | undefined)?.invalidateRowHeights?.();
  }

  scrollToRow90() {
    this.sgb?.slickGrid?.scrollRowToTop(90);
  }

  defineGrid() {
    this.columns = [
      { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
      { id: 'title', name: 'Task', field: 'title', minWidth: 180, width: 220 },
      { id: 'status', name: 'Status', field: 'status', minWidth: 120, width: 140 },
      { id: 'notes', name: 'Notes', field: 'notes', cssClass: 'cell-wrap', width: 420, maxWidth: 520 },
    ];

    const gridOptions: GridOption = {
      enableCellNavigation: true,
      enableTextSelectionOnCells: true,
      rowHeight: 40,
      frozenRow: 2,
      gridHeight: 560,
      gridWidth: 1080,
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: TaskItem) => {
            if (item.notes === 'Short note.') {
              return { height: this.isCompact ? 40 : 33 };
            }

            const lineCount = this.getEstimatedLineCount(item.notes);
            const verticalPadding = 8; // 4px top + 4px bottom
            const lineHeight = this.isCompact ? 21 : 18;
            const minRowHeight = this.isCompact ? 46 : 40;
            const baseHeight = Math.max(minRowHeight, verticalPadding + lineCount * lineHeight);

            return { height: baseHeight };
          },
        },
      },
    };
    this.gridOptions = gridOptions;
  }

  private getEstimatedLineCount(text: string): number {
    // Tuned for Notes column width (~420px) and wrapped content in this demo.
    return Math.max(1, Math.ceil(text.length / 55));
  }

  private getData(itemCount: number): TaskItem[] {
    const statuses: Array<TaskItem['status']> = ['Todo', 'In Progress', 'Done'];
    const notesPool = [
      'Short note.',
      'Need to validate keyboard navigation and ensure screen reader output remains stable across frozen panes.',
      'Review row height invalidation path when data changes quickly due to live updates from backend polling.',
      'Longer QA note: validate scrolling behavior at top and bottom boundaries, compare rendered range against expected rows, and confirm no visual clipping for wrapped cells.',
    ];

    const data: TaskItem[] = [];
    for (let i = 0; i < itemCount; i++) {
      data.push({
        id: i,
        title: `Task ${i}`,
        status: statuses[i % statuses.length],
        notes: notesPool[i % notesPool.length],
      });
    }
    return data;
  }
}
