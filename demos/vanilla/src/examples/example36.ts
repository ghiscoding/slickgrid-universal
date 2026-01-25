import { BindingEventService } from '@slickgrid-universal/binding';
import {
  Aggregators,
  createDomElement,
  ExtensionName,
  Filters,
  Formatters,
  GroupTotalFormatters,
  SlickEventHandler,
  SortComparers,
  SortDirectionNumber,
  type Column,
  type GridOption,
  type Grouping,
} from '@slickgrid-universal/common';
import { SlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example36.scss';
import { showToast } from './utilities.js';

const NB_ITEMS = 1200;

interface Item {
  id: number;
  title: string;
  duration: number;
  cost: number;
  percentComplete: number;
  start: Date;
  finish: Date;
  effortDriven: boolean;
}
interface ItemDetail extends Item {
  assignee: string;
  reporter: string;
}

export default class Example36 {
  private _bindingEventService: BindingEventService;
  private _darkMode = false;
  private _eventHandler: SlickEventHandler;
  detailViewRowCount = 7;
  gridOptions!: GridOption;
  columnDefinitions!: Column<Item>[];
  dataset!: Item[];
  sgb!: SlickVanillaGridBundle;
  selectedRowString = '';
  serverApiDelay = 400;
  gridContainerElm: HTMLDivElement;
  fakeNames = [
    'John Doe',
    'Jane Doe',
    'Chuck Norris',
    'Bumblebee',
    'Jackie Chan',
    'Elvis Presley',
    'Bob Marley',
    'Mohammed Ali',
    'Bruce Lee',
    'Rocky Balboa',
  ];
  rowDetail!: SlickRowDetailView;

  constructor() {
    this._bindingEventService = new BindingEventService();
    this._eventHandler = new SlickEventHandler();
  }

  attached() {
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.mockData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`.grid36`) as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(
      this.gridContainerElm,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );

    // you could group by duration on page load (must be AFTER the DataView is created, so after GridBundle)
    this.groupByDuration();

    // add all row detail event listeners
    this.addRowDetailEventHandlers();
    this._bindingEventService.bind(this.gridContainerElm, 'onselectedrowschanged', () => {
      this.selectedRowString = this.sgb.slickGrid?.getSelectedRows().join(',') || '';
      if (this.selectedRowString.length > 50) {
        this.selectedRowString = this.selectedRowString.substring(0, 50) + '...';
      }
    });
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this._bindingEventService.unbindAll();
    this.sgb?.dispose();
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
    document.body.setAttribute('data-theme', 'light');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        width: 110,
        minWidth: 110,
        cssClass: 'cell-title',
        filterable: true,
        sortable: true,
      },
      {
        id: 'duration',
        name: 'Duration',
        field: 'duration',
        width: 90,
        maxWidth: 200,
        filterable: true,
        sortable: true,
        type: 'number',
        groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        params: { groupFormatterPrefix: 'Total: ' },
      },
      {
        id: '%',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 200,
        width: 250,
        resizable: false,
        filterable: true,
        sortable: true,
        type: 'number',
        formatter: Formatters.percentCompleteBar,
        groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        params: { groupFormatterPrefix: '<i>Avg</i>: ' },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        type: 'dateIso',
        formatter: Formatters.dateIso,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        type: 'dateIso',
        formatter: Formatters.dateIso,
      },
      {
        id: 'cost',
        name: 'Cost',
        field: 'cost',
        minWidth: 70,
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
        type: 'number',
        formatter: Formatters.dollar,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        width: 90,
        minWidth: 20,
        maxWidth: 120,
        filterable: true,
        formatter: Formatters.checkmarkMaterial,
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableFiltering: true,
      enableGrouping: true,
      enableRowDetailView: true,
      preRegisterExternalExtensions: (pubSubService) => {
        // Row Detail View is a special case because of its requirement to create extra column definition dynamically
        // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
        this.rowDetail = new SlickRowDetailView(pubSubService);
        return [{ name: ExtensionName.rowDetailView, instance: this.rowDetail }];
      },
      rowHeight: 33,
      rowTopOffsetRenderType: 'top', // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
      rowDetailView: {
        columnIndexPosition: 1,
        preTemplate: this.loadingTemplate.bind(this),
        postTemplate: this.loadView.bind(this),
        process: this.simulateServerAsyncCall.bind(this),
        loadOnce: true,
        singleRowExpand: false,

        // how many grid rows do we want to use for the detail panel
        // also note that the detail view adds an extra 1 row for padding purposes
        // example, if you choosed 6 panelRows, the display will in fact use 5 rows
        panelRows: this.detailViewRowCount,
      },
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
      },

      // You could also enable Row Selection as well, but just make sure to disable `useRowClick: false`
      enableCheckboxSelector: true,
      enableSelection: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideSelectAllCheckbox: true,
      },
    };
  }

  changeDetailViewRowCount() {
    const options = this.rowDetail.getOptions();
    if (options?.panelRows) {
      options.panelRows = this.detailViewRowCount; // change number of rows dynamically
      this.rowDetail.setOptions(options);
    }
  }

  clearGrouping() {
    this.sgb?.dataView?.setGrouping([]);
  }

  closeAllRowDetail() {
    this.rowDetail.collapseAll();
  }

  collapseAllGroups() {
    this.sgb?.dataView?.collapseAllGroups();
  }

  expandAllGroups() {
    this.sgb?.dataView?.expandAllGroups();
  }

  addRowDetailEventHandlers() {
    this.rowDetail.onBeforeRowDetailToggle.subscribe((_e, args) => {
      // you coud cancel opening certain rows
      // if (args.item.id === 1) {
      //   e.preventDefault();
      //   return false;
      // }
      console.log('before toggling row detail', args.item);
    });

    this._eventHandler.subscribe(this.rowDetail.onAfterRowDetailToggle, (_e, args) => {
      // console.log('after toggling row detail', args.item);
      if (args.item._collapsed) {
        this.disposeRowDetailElementListeners(args.item.id);
      } else {
        // reset & recreate event listeners associated to that row detail
        this.disposeRowDetailElementListeners(args.item.id);
        this.addDeleteRowOnClickListener(args.item.id);
        this.addAssigneeOnClickListener(args.item.id);
      }
    });

    this._eventHandler.subscribe(this.rowDetail.onAsyncEndUpdate, (_e, args) => {
      // console.log('finished updating the post async template', args);
      this.addDeleteRowOnClickListener(args.item.id);
      this.addAssigneeOnClickListener(args.item.id);
    });

    // the following subscribers can be useful to Save/Re-Render a View
    // when it goes out of viewport or back to viewport range
    this._eventHandler.subscribe(this.rowDetail.onRowOutOfViewportRange, (_e, args) => {
      this.disposeRowDetailElementListeners(args.item.id);
    });

    this._eventHandler.subscribe(this.rowDetail.onRowBackToViewportRange, (_e, args) => {
      // console.log('row is back to viewport range', args);
      this.addDeleteRowOnClickListener(args.item.id);
      this.addAssigneeOnClickListener(args.item.id);
    });
  }

  groupByDuration() {
    // you need to manually add the sort icon(s) in UI
    this.sgb?.slickGrid?.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
    this.sgb?.dataView?.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    this.sgb?.slickGrid?.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationEffortDriven() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
    ];
    this.sgb?.slickGrid?.setSortColumns(sortColumns);
    this.sgb?.dataView?.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'} <span class="text-green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    this.sgb?.slickGrid?.invalidate(); // invalidate all rows and re-render
  }

  /** Loading template, can be an HTML string or an HTML Element */
  loadingTemplate() {
    const headerElm = createDomElement('h5', { className: 'title is-5' });
    headerElm.appendChild(createDomElement('i', { className: 'mdi mdi-load mdi-spin-1s font-40px' }));
    headerElm.appendChild(document.createTextNode('Loading...'));

    return headerElm;
  }

  /** Row Detail View, can be an HTML string or an HTML Element (we'll use HTML string for simplicity of the demo) */
  loadView(itemDetail: ItemDetail) {
    return `
      <div>
        <h4 class="title is-4">${itemDetail.title}</h4>
        <div class="container">
          <div class="columns">
            <div class="column is-half">
            <div class="detail"><label>Assignee:</label> <input class="input is-small is-8 column mt-1 assignee" id="assignee_${itemDetail.id}" type="text" value="${itemDetail.assignee}"/></div>
              <div class="detail"><label>Reporter:</label> <span>${itemDetail.reporter}</span></div>
              <div class="detail"><label>Duration:</label> <span>${itemDetail.duration}</span></div>
              <div class="detail"><label>% Complete:</label> <span>${itemDetail.percentComplete}</span></div>
              <div class="detail"><label>Start:</label> <span>${itemDetail.start.toDateString()}</span></div>
              <div class="detail"><label>Finish:</label> <span>${itemDetail.finish.toDateString()}</span></div>
              <div class="detail"><label>Effort Driven:</label> <span>${itemDetail.effortDriven}</span></div>
            </div>
            <div class="column is-half">
              <div class="detail">
                <span class="is-flex is-align-items-center">
                  <label>Find out who is the Assignee</label>
                  <button class="button is-small" id="who-is-assignee_${itemDetail.id}" data-test="assignee-btn">Click Me</button>
                </span>
                <button class="button is-small is-danger ml-5" id="delete_row_${itemDetail.id}" data-test="delete-btn">
                  Delete Row
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /** Just for demo purposes, we will simulate an async server call and return more details on the selected row item */
  simulateServerAsyncCall(item: ItemDetail) {
    // random set of names to use for more item detail
    const randomNames = [
      'John Doe',
      'Jane Doe',
      'Chuck Norris',
      'Bumblebee',
      'Jackie Chan',
      'Elvis Presley',
      'Bob Marley',
      'Mohammed Ali',
      'Bruce Lee',
      'Rocky Balboa',
    ];

    // fill the template on async delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;

        // let's add some extra properties to our item for a better async simulation
        itemDetail.assignee = randomNames[this.randomNumber(0, 9)] || '';
        itemDetail.reporter = randomNames[this.randomNumber(0, 9)] || '';

        this.notifyTemplate(itemDetail);

        // resolve the data after delay specified
        resolve(itemDetail);
      }, this.serverApiDelay);
    });
  }

  // notify the onAsyncResponse with the "args.item" (required property)
  // the plugin will then use itemDetail to populate the detail panel with "postTemplate"
  notifyTemplate(itemDetail: ItemDetail) {
    this.rowDetail.onAsyncResponse.notify({ item: itemDetail }, undefined, this);
  }

  addDeleteRowOnClickListener(itemId: string) {
    const deleteBtnElm = document.querySelector('#delete_row_' + itemId);
    if (deleteBtnElm) {
      this._bindingEventService.bind(deleteBtnElm, 'click', this.handleDeleteRow.bind(this, itemId), undefined, `event-detail-${itemId}`);
    }
  }

  addAssigneeOnClickListener(itemId: string) {
    const assigneeBtnElm = document.querySelector('#who-is-assignee_' + itemId);
    if (assigneeBtnElm) {
      this._bindingEventService.bind(
        assigneeBtnElm,
        'click',
        this.handleAssigneeClicked.bind(this, itemId),
        undefined,
        `event-detail-${itemId}`
      );
    }
  }

  handleAssigneeClicked(itemId: string) {
    alert('Assignee is ' + document.querySelector<HTMLInputElement>('#assignee_' + itemId)!.value);
  }

  handleDeleteRow(itemId: string) {
    if (confirm(`Are you sure that you want to delete "Task ${itemId}"?`)) {
      // you first need to collapse all rows (via the 3rd party addon instance)
      this.rowDetail.collapseAll();

      // then you can delete the item from the dataView
      this.sgb.dataView?.deleteItem(+itemId);

      showToast(`Deleted row with Task ${itemId}`, 'danger');
    }
  }

  /** dispose/remove event listener when closing the row detail(s) to avoid event leaks */
  disposeRowDetailElementListeners(itemId: string) {
    // remove all button event listeners attached to a specific row event detail
    this._bindingEventService.unbindAll(`event-detail-${itemId}`);
  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset: Item[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = Math.round(Math.random() * 10000) / 100;

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 100),
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        cost: i % 3 ? randomCost : -randomCost,
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    if (this._darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.querySelector('.demo-container')?.classList.add('dark-mode');
    } else {
      document.body.setAttribute('data-theme', 'light');
      document.querySelector('.demo-container')?.classList.remove('dark-mode');
    }
    // we must close all row details because the grid is invalidated and the events listeners will stop working because they are detached after re-rendering
    this.closeAllRowDetail();
    this.sgb.slickGrid?.setOptions({ darkMode: this._darkMode });
  }
}
