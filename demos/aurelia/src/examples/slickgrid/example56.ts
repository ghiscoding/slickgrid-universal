import { type AureliaGridInstance, type Column, type GridOption } from 'aurelia-slickgrid';
import './example56.scss';

const NB_ITEMS = 150;

interface TaskItem {
  id: number;
  title: string;
  status: 'Todo' | 'In Progress' | 'Done';
  notes: string;
}

export class Example56 {
  aureliaGrid?: AureliaGridInstance;
  columns: Column[] = [];
  dataset: TaskItem[] = [];
  gridOptions!: GridOption;
  isCompact = false;

  attached() {
    this.defineGrid();
    this.dataset = this.getData(NB_ITEMS);
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  toggleDensity() {
    this.isCompact = !this.isCompact;
    this.aureliaGrid?.slickGrid?.invalidateRowHeights?.();
  }

  scrollToRow90() {
    this.aureliaGrid?.slickGrid?.scrollRowToTop(90);
  }

  defineGrid() {
    this.columns = [
      { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
      { id: 'title', name: 'Task', field: 'title', minWidth: 180, width: 220 },
      { id: 'status', name: 'Status', field: 'status', minWidth: 120, width: 140 },
      { id: 'notes', name: 'Notes', field: 'notes', cssClass: 'cell-wrap', width: 420, maxWidth: 520 },
    ];

    this.gridOptions = {
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
            const verticalPadding = 8;
            const lineHeight = this.isCompact ? 21 : 18;
            const minRowHeight = this.isCompact ? 46 : 40;
            const baseHeight = Math.max(minRowHeight, verticalPadding + lineCount * lineHeight);

            return { height: baseHeight };
          },
        },
      },
    };
  }

  private getEstimatedLineCount(text: string): number {
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
