import {
  Editors,
  SlickEventHandler,
  SlickSelectionUtils,
  type Column,
  type GridOption,
  type OnDragReplaceCellsEventArgs,
} from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example38.scss';

const NB_ITEMS = 100;

export default class Example38 {
  protected _eventHandler: SlickEventHandler;
  private _darkMode = false;

  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  gridOptions!: GridOption;
  gridContainerElm: HTMLDivElement;
  sgb: SlickVanillaGridBundle;

  attached() {
    this._eventHandler = new SlickEventHandler();

    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.getData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>('.grid38') as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(
      document.querySelector('.grid38') as HTMLDivElement,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
    document.body.classList.add('salesforce-theme');

    this.sgb.slickGrid?.onAddNewRow.subscribe((_e, args) => {
      const item = args.item;
      this.sgb.slickGrid?.invalidateRow(this.dataset.length);
      this.dataset.push(item);
      this.sgb.slickGrid?.updateRowCount();
      this.sgb.slickGrid?.render();
    });
    this.sgb.slickGrid?.onDragReplaceCells.subscribe(this.copyDraggedCellRange);
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this.sgb?.dispose();
    this.gridContainerElm.remove();
    document.body.classList.remove('salesforce-theme');
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
    document.body.setAttribute('data-theme', 'light');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'selector',
        name: '',
        field: 'num',
        width: 30,
      },
    ];

    for (let i = 0; i < NB_ITEMS; i++) {
      this.columnDefinitions.push({
        id: i,
        name:
          i < 26
            ? String.fromCharCode('A'.charCodeAt(0) + (i % 26))
            : String.fromCharCode('A'.charCodeAt(0) + Math.floor(i / 26) - 1) + String.fromCharCode('A'.charCodeAt(0) + (i % 26)),
        field: String(i),
        minWidth: 60,
        width: 60,
        editor: { model: Editors.text },
      });
    }

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      darkMode: this._darkMode,
      editable: true,
      headerRowHeight: 35,
      rowHeight: 30,
      editorNavigateOnArrows: true, // enable editor navigation using arrow keys

      // enable new hybrid selection model (rows & cells)
      enableHybridSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
        rowSelectColumnIds: ['selector'],
      },

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        copyActiveEditorCell: true,
        removeDoubleQuotesOnPaste: true,
        replaceNewlinesWith: ' ',
      },
    };
  }

  copyDraggedCellRange(_e: any, args: OnDragReplaceCellsEventArgs) {
    const verticalTargetRange = SlickSelectionUtils.verticalTargetRange(args.prevSelectedRange, args.selectedRange);
    const horizontalTargetRange = SlickSelectionUtils.horizontalTargetRange(args.prevSelectedRange, args.selectedRange);
    const cornerTargetRange = SlickSelectionUtils.cornerTargetRange(args.prevSelectedRange, args.selectedRange);

    if (verticalTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, verticalTargetRange, args.grid);
    }
    if (horizontalTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, horizontalTargetRange, args.grid);
    }
    if (cornerTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, cornerTargetRange, args.grid);
    }
  }

  getData(itemCount: number) {
    // mock a dataset
    const datasetTmp: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const d: any = (datasetTmp[i] = {});
      d['id'] = i;
      d['num'] = i;
    }

    return datasetTmp;
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    this.toggleBodyBackground();
    this.sgb.gridOptions = { ...this.sgb.gridOptions, darkMode: this._darkMode };
    this.sgb.slickGrid?.setOptions({ darkMode: this._darkMode });
  }

  toggleBodyBackground() {
    if (this._darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.querySelector('.demo-container')?.classList.add('dark-mode');
    } else {
      document.body.setAttribute('data-theme', 'light');
      document.querySelector('.demo-container')?.classList.remove('dark-mode');
    }
  }
}
