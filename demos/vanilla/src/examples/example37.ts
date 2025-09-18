import {
  type Column,
  Editors,
  type GridOption,
  // Handler,
  // OnDragReplaceCellsEventArgs,
  SlickEventHandler,
  SlickHybridSelectionModel,
  SlickSelectionUtils,
} from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options.js';
import './example37.scss';

const NB_ITEMS = 100;

export default class Example37 {
  protected _eventHandler: SlickEventHandler;

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
    this.gridContainerElm = document.querySelector<HTMLDivElement>('.grid37') as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(
      document.querySelector('.grid37') as HTMLDivElement,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
    document.body.classList.add('salesforce-theme');

    const cellSelectionModel = new SlickHybridSelectionModel({ selectActiveRow: true, rowSelectColumnIdArr: ['selector'] });
    this.sgb.slickGrid?.setSelectionModel(cellSelectionModel);

    this.sgb.slickGrid?.onAddNewRow.subscribe((_e, args) => {
      const item = args.item;
      this.sgb.slickGrid?.invalidateRow(this.dataset.length);
      this.dataset.push(item);
      this.sgb.slickGrid?.updateRowCount();
      this.sgb.slickGrid?.render();
    });
    this.sgb.slickGrid?.onDragReplaceCells.subscribe(SlickSelectionUtils.defaultCopyDraggedCellRange);
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this.sgb?.dispose();
    this.gridContainerElm.remove();
    document.body.classList.remove('salesforce-theme');
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
      editable: true,
      headerRowHeight: 35,
      rowHeight: 30,
      editorNavigateOnArrows: true, // enable editor navigation using arrow keys

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        //   onCopyCells: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCells', args.ranges),
        //   onPasteCells: (e, args: { ranges: SelectedRange[] }) => console.log('onPasteCells', args.ranges),
        //   onCopyCancelled: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCancelled', args.ranges),
        onBeforePasteCell: (_e, args) => {
          // deny the whole first row and the cells C-E of the second row
          return !(args.row === 0 || (args.row === 1 && args.cell > 2 && args.cell < 6));
        },
        copyActiveEditorCell: true,
        removeDoubleQuotesOnPaste: true,
        replaceNewlinesWith: ' ',
      },
    };
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
}
