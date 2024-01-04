import { type Column, type GridOption, SlickEventHandler, Editors } from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';
import './example19.scss';

const NB_ITEMS = 100;

export default class Example19 {
  protected _eventHandler: SlickEventHandler;

  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  gridOptions!: GridOption;
  gridContainerElm: HTMLDivElement;
  isWithPagination = true;
  sgb: SlickVanillaGridBundle;
  isGridEditable = true;

  attached() {
    this._eventHandler = new SlickEventHandler();

    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.getData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`.grid19`) as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(document.querySelector(`.grid19`) as HTMLDivElement, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    document.body.classList.add('salesforce-theme');

    // bind any of the grid events
    const cellSelectionModel = this.sgb.slickGrid!.getSelectionModel();
    this._eventHandler.subscribe(cellSelectionModel!.onSelectedRangesChanged, (_e, args) => {
      const targetRange = document.querySelector('#selectionRange') as HTMLSpanElement;
      targetRange.textContent = '';

      for (const slickRange of args) {
        targetRange.textContent += JSON.stringify(slickRange);
      }
    });

    const hash = {
      0: {},
      1: {
        2: 'blocked-cell',
        3: 'blocked-cell',
        4: 'blocked-cell',
      }
    };
    for ( let i = 0; i < NB_ITEMS; i++) {
      hash[0][i] = 'blocked-cell';
    }

    this.sgb.slickGrid?.setCellCssStyles(`blocked-cells`, hash);
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
      }
    ];

    for (let i = 0; i < NB_ITEMS; i++) {
      this.columnDefinitions.push({
        id: i,
        name: i < 26
          ? String.fromCharCode('A'.charCodeAt(0) + (i % 26))
          : String.fromCharCode('A'.charCodeAt(0) + (Math.floor(i / 26)) - 1) + String.fromCharCode('A'.charCodeAt(0) + (i % 26)),
        field: String(i),
        minWidth: 60,
        width: 60,
        editor: { model: Editors.text }
      });
    }

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableCellNavigation: true,
      enablePagination: true,
      autoEdit: true,
      editable: this.isGridEditable,
      pagination: {
        pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
        pageSize: 20
      },
      headerRowHeight: 35,
      rowHeight: 30,

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
      //   onCopyCells: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCells', args.ranges),
      //   onPasteCells: (e, args: { ranges: SelectedRange[] }) => console.log('onPasteCells', args.ranges),
      //   onCopyCancelled: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCancelled', args.ranges),
        onBeforePasteCell: (_e, args) => {
          // deny the whole first row and the cells C-E of the second row
          return !(args.row === 0 || (args.row === 1 && args.cell > 2 && args.cell < 6));
        }
      }
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

  generatePhoneNumber(): string {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }

  // Toggle the Grid Pagination
  // IMPORTANT, the Pagination MUST BE CREATED on initial page load before you can start toggling it
  // Basically you cannot toggle a Pagination that doesn't exist (must created at the time as the grid)
  togglePagination() {
    this.isWithPagination = !this.isWithPagination;
    this.sgb.paginationService!.togglePaginationVisibility(this.isWithPagination);
    this.sgb.slickGrid!.setSelectedRows([]);
  }

  toggleGridEditReadonly() {
    // then change a single grid options to make the grid non-editable (readonly)
    this.isGridEditable = !this.isGridEditable;
    this.sgb.gridOptions = { editable: this.isGridEditable };
    this.gridOptions = this.sgb.gridOptions;
  }
}
