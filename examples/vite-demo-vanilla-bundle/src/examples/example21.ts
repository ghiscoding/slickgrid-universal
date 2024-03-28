import { BindingEventService } from '@slickgrid-universal/binding';
import { type Column, createDomElement, FieldType, Filters, Formatters, type GridOption, SlickEventHandler, Editors } from '@slickgrid-universal/common';
import { SlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import './example21.scss';

const NB_ITEMS = 995;

interface Item {
  id: number;
  title: string;
  duration: number;
  percentComplete: number;
  start: Date;
  finish: Date;
  effortDriven: boolean;
}
interface ItemDetail extends Item {
  assignee: string;
  reporter: string;
}

export default class Example21 {
  private _bindingEventService: BindingEventService;
  private _eventHandler: SlickEventHandler;
  detailViewRowCount = 7;
  gridOptions!: GridOption;
  columnDefinitions!: Column<Item>[];
  dataset!: Item[];
  sgb!: SlickVanillaGridBundle;
  status = '';
  statusClass = '';
  gridContainerElm: HTMLDivElement;
  fakeNames = ['John Doe', 'Jane Doe', 'Chuck Norris', 'Bumblebee', 'Jackie Chan', 'Elvis Presley', 'Bob Marley', 'Mohammed Ali', 'Bruce Lee', 'Rocky Balboa'];
  rowDetail!: SlickRowDetailView;

  constructor() {
    this._bindingEventService = new BindingEventService();
    this._eventHandler = new SlickEventHandler();
  }

  attached() {
    this.defineGrids();

    // mock some data (different in each dataset)
    this.dataset = this.mockData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`.grid21`) as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(this.gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    this.rowDetail = new SlickRowDetailView(this.sgb.instances!.eventPubSubService!);
    this.rowDetail.create(this.columnDefinitions, this.gridOptions);
    this.rowDetail.init(this.sgb.slickGrid!);

    // we need to sync the column definitions to include the new row detail icon column in the grid
    this.sgb.columnDefinitions = this.columnDefinitions.slice();

    // add all row detail event listeners
    this.addRowDetailEventHandlers();
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this._bindingEventService.unbindAll();
    this.sgb?.dispose();
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', width: 110, minWidth: 110, cssClass: 'cell-title', filterable: true, sortable: true, editor: { model: Editors.text } },
      { id: 'duration', name: 'Duration', field: 'duration', width: 90, maxWidth: 200, filterable: true, sortable: true, type: FieldType.number },
      { id: '%', name: '% Complete', field: 'percentComplete', minWidth: 100, width: 250, resizable: false, filterable: true, sortable: true, editor: { model: Editors.slider }, type: FieldType.number, formatter: Formatters.percentCompleteBar },
      { id: 'start', name: 'Start', field: 'start', minWidth: 60, maxWidth: 130, filterable: true, filter: { model: Filters.compoundDate }, type: FieldType.dateIso, formatter: Formatters.dateIso },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 60, maxWidth: 130, filterable: true, filter: { model: Filters.compoundDate }, type: FieldType.dateIso, formatter: Formatters.dateIso },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', width: 90, minWidth: 20, maxWidth: 120, filterable: true, formatter: Formatters.checkmarkMaterial }
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableColumnReorder: true,
      enableFiltering: true,
      enableRowDetailView: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      rowHeight: 33,
      rowDetailView: {
        cssClass: 'detail-view-toggle',
        preTemplate: this.loadingTemplate.bind(this),
        postTemplate: this.loadView.bind(this),
        process: this.simulateServerAsyncCall.bind(this),
        useRowClick: true,

        // how many grid rows do we want to use for the detail panel
        // also note that the detail view adds an extra 1 row for padding purposes
        // example, if you choosed 6 panelRows, the display will in fact use 5 rows
        panelRows: this.detailViewRowCount,

        // make only every 2nd row an expandable row,
        // by using the override function to provide custom logic of which row is expandable
        // you can override it here in the options or externally by calling the method on the plugin instance
        expandableOverride: (_row, dataContext) => dataContext.id % 2 === 1,
      }
    };
  }

  changeEditableGrid() {
    this.rowDetail.collapseAll();
    this.rowDetail.addonOptions.useRowClick = false;
    this.gridOptions.autoCommitEdit = !this.gridOptions.autoCommitEdit;
    this.sgb.slickGrid?.setOptions({
      editable: true,
      autoEdit: true,
      enableCellNavigation: true,
    });
    return true;
  }

  closeAllRowDetail() {
    this.rowDetail.collapseAll();
  }

  changeDetailViewRowCount() {
    const options = this.rowDetail.getOptions();
    if (options?.panelRows) {
      options.panelRows = this.detailViewRowCount; // change number of rows dynamically
      this.rowDetail.setOptions(options);
    }
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
      console.log('after toggling row detail', args.item);
      if (args.item._collapsed) {
        this.disposeRowDetailElementListeners(args.item.id);
      }
    });

    this._eventHandler.subscribe(this.rowDetail.onAsyncEndUpdate, (_e, args) => {
      console.log('finished updating the post async template', args);
      this.handleDeleteRowOnClick(args.item.id);
      this.handleAssigneeOnClick(args.item.id);
    });

    // the following subscribers can be useful to Save/Re-Render a View
    // when it goes out of viewport or back to viewport range
    this._eventHandler.subscribe(this.rowDetail.onRowOutOfViewportRange, (_e, args) => {
      this.disposeRowDetailElementListeners(args.item.id);
    });

    this._eventHandler.subscribe(this.rowDetail.onRowBackToViewportRange, (_e, args) => {
      this.handleDeleteRowOnClick(args.item.id);
      this.handleAssigneeOnClick(args.item.id);
    });
  }

  /** Loading template, can be an HTML string or an HTML Element */
  loadingTemplate() {
    const headerElm = createDomElement('h5', { className: 'title is-5' });
    headerElm.appendChild(createDomElement('i', { className: 'mdi mdi-load mdi-spin-1s mdi-v-align-middle mdi-40px' }));
    headerElm.appendChild(document.createTextNode('Loading...'));

    return headerElm;
  }

  /** Row Detail View, can be an HTML string or an HTML Element */
  loadView(itemDetail: ItemDetail) {
    return `
      <div>
        <h4 class="title is-4">${itemDetail.title}</h4>
        <div class="container">
          <div class="columns">
            <div class="column is-half">
            <div class="detail"><label>Assignee:</label> <input class="input is-small is-8 column mt-1" id="assignee_${itemDetail.id}" type="text" value="${itemDetail.assignee}"/></div>
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
    const randomNames = ['John Doe', 'Jane Doe', 'Chuck Norris', 'Bumblebee', 'Jackie Chan', 'Elvis Presley', 'Bob Marley', 'Mohammed Ali', 'Bruce Lee', 'Rocky Balboa'];

    // fill the template on async delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;

        // let's add some extra properties to our item for a better async simulation
        itemDetail.assignee = randomNames[this.randomNumber(0, 10)];
        itemDetail.reporter = randomNames[this.randomNumber(0, 10)];

        this.notifyTemplate(itemDetail);

        // resolve the data after delay specified
        resolve(itemDetail);
      }, 1000);
    });
  }

  // notify the onAsyncResponse with the "args.item" (required property)
  // the plugin will then use itemDetail to populate the detail panel with "postTemplate"
  notifyTemplate(itemDetail: ItemDetail) {
    this.rowDetail.onAsyncResponse.notify({
      item: itemDetail,
      itemDetail,
    }, undefined, this);
  }

  handleDeleteRowOnClick(itemId: string) {
    const deleteBtnElm = document.querySelector('#delete_row_' + itemId);
    if (deleteBtnElm) {
      this._bindingEventService.bind(deleteBtnElm, 'click', this.handleDeleteRow.bind(this, itemId), undefined, `event-detail-${itemId}`);
    }
  }

  handleAssigneeOnClick(itemId: string) {
    const assigneeBtnElm = document.querySelector('#who-is-assignee_' + itemId);
    if (assigneeBtnElm) {
      this._bindingEventService.bind(assigneeBtnElm, 'click', this.handleAssigneeClicked.bind(this, itemId), undefined, `event-detail-${itemId}`);
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

      this.status = `Deleted row with Task ${itemId}`;
      this.statusClass = 'notification is-light is-danger is-narrow';

      // remove message after 2sec.
      setTimeout(() => {
        this.status = '';
        this.statusClass = '';
      }, 2000);
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
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100),
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        effortDriven: (i % 5 === 0)
      };
    }

    return mockDataset;
  }

  randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
