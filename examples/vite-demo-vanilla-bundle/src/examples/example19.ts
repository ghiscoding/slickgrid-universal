import { CellRange, Column, GridOption, SlickEventHandler, SlickNamespace, } from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';
import '../salesforce-styles.scss';
import './example19.scss';

const NB_ITEMS = 100;
declare const Slick: SlickNamespace;
export default class Example34 {
  protected _eventHandler: SlickEventHandler;
  title = 'Example 19: ExcelCopyBuffer with Cell Selection';
  subTitle = `Cell Selection using "Shift+{key}" where "key" can be any of:
  <ul>
    <li>Arrow Up/Down/Left/Right</li>
    <li>Page Up/Down</li>
    <li>Home</li>
    <li>End</li>
  </ul>`;

  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  gridOptions!: GridOption;
  gridContainerElm: HTMLDivElement;
  isWithPagination = true;
  sgb: SlickVanillaGridBundle;

  attached() {
    this._eventHandler = new Slick.EventHandler();

    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.getData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`.grid19`) as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(document.querySelector(`.grid19`) as HTMLDivElement, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    document.body.classList.add('salesforce-theme');

    // bind any of the grid events
    const cellSelectionModel = this.sgb.slickGrid!.getSelectionModel();
    this._eventHandler.subscribe(cellSelectionModel!.onSelectedRangesChanged, (_e, args: CellRange[]) => {
      const targetRange = document.querySelector('#selectionRange') as HTMLSpanElement;
      targetRange.textContent = '';

      for (const slickRange of args) {
        targetRange.textContent += JSON.stringify(slickRange);
      }
    });
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
        width: 30
      }
    ];

    for (let i = 0; i < NB_ITEMS; i++) {
      this.columnDefinitions.push({
        id: i,
        name: i < 26
          ? String.fromCharCode('A'.charCodeAt(0) + (i % 26))
          : String.fromCharCode('A'.charCodeAt(0) + ((i / 26) | 0) -1) + String.fromCharCode('A'.charCodeAt(0) + (i % 26)),
        field: i as any,
        minWidth: 60,
        width: 60,
      });
    }

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableCellNavigation: true,
      enablePagination: true,
      pagination: {
        pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
        pageSize: 20
      },
      headerRowHeight: 35,
      rowHeight: 30,

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      // excelCopyBufferOptions: {
      //   onCopyCells: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCells', args.ranges),
      //   onPasteCells: (e, args: { ranges: SelectedRange[] }) => console.log('onPasteCells', args.ranges),
      //   onCopyCancelled: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCancelled', args.ranges),
      // }
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
}
