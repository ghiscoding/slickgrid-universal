import {
  addToArrayWhenNotExists,
  createDomElement,
  type EventSubscription,
  type OnBeforeRowDetailToggleArgs,
  type OnRowBackToViewportRangeArgs,
  SlickEventData,
  type SlickGrid,
  SlickRowSelectionModel,
  unsubscribeAll,
} from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickRowDetailView as UniversalSlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';
import type { ICustomElementController } from '@aurelia/runtime-html';
import { type Constructable, resolve, transient } from 'aurelia';

import type { AureliaViewOutput, GridOption, RowDetailView, ViewModelBindableInputData } from '../models/index.js';
import { AureliaUtilService } from '../services/aureliaUtil.service.js';

const ROW_DETAIL_CONTAINER_PREFIX = 'container_';
const PRELOAD_CONTAINER_PREFIX = 'container_loading';

export interface CreatedView extends AureliaViewOutput {
  id: string | number;
  dataContext: any;
}

@transient()
export class SlickRowDetailView extends UniversalSlickRowDetailView {
  protected _preloadViewModel?: Constructable;
  protected _preloadController?: ICustomElementController;
  protected _slots: CreatedView[] = [];
  protected _subscriptions: EventSubscription[] = [];
  protected _userProcessFn?: (item: any) => Promise<any>;
  protected _viewModel?: Constructable;

  constructor(
    protected readonly aureliaUtilService: AureliaUtilService = resolve(AureliaUtilService),
    private readonly eventPubSubService: EventPubSubService = resolve(EventPubSubService),
    private readonly gridContainerElement: HTMLElement = resolve(HTMLElement)
  ) {
    super(eventPubSubService);
  }

  get addonOptions() {
    return this.getOptions();
  }

  protected get datasetIdPropName(): string {
    return this.gridOptions.datasetIdPropertyName || 'id';
  }

  get gridOptions(): GridOption {
    return (this._grid?.getOptions() || {}) as GridOption;
  }

  get rowDetailViewOptions(): RowDetailView | undefined {
    return this.gridOptions.rowDetailView;
  }

  /** Dispose of the RowDetailView Extension */
  dispose() {
    this.disposeAllViewSlot();
    unsubscribeAll(this._subscriptions);
    super.dispose();
  }

  /** Dispose of all the opened Row Detail Panels Aurelia View Slots */
  disposeAllViewSlot() {
    do {
      const view = this._slots.pop();
      if (view) {
        this.disposeView(view);
      }
    } while (this._slots.length > 0);
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickRowDetailView | null {
    return this;
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    super.init(this._grid);
    this.register(grid?.getSelectionModel() as SlickRowSelectionModel);
  }

  /**
   * Create the plugin before the Grid creation, else it will behave oddly.
   * Mostly because the column definitions might change after the grid creation
   */
  register(rowSelectionPlugin?: SlickRowSelectionModel) {
    if (typeof this.gridOptions.rowDetailView?.process === 'function') {
      // we need to keep the user "process" method and replace it with our own execution method
      // we do this because when we get the item detail, we need to call "onAsyncResponse.notify" for the plugin to work
      this._userProcessFn = this.gridOptions.rowDetailView.process as (item: any) => Promise<any>; // keep user's process method
      this.addonOptions.process = (item) => this.onProcessing(item); // replace process method & run our internal one
    } else {
      throw new Error('[Aurelia-Slickgrid] You need to provide a "process" function for the Row Detail Extension to work properly');
    }

    if (this._grid && this.gridOptions?.rowDetailView) {
      // load the Preload & RowDetail Templates (could be straight HTML or Aurelia View/ViewModel)
      // when those are Aurelia View/ViewModel, we need to create View Slot & provide the html containers to the Plugin (preTemplate/postTemplate methods)
      if (!this.gridOptions.rowDetailView.preTemplate) {
        this._preloadViewModel = this.gridOptions?.rowDetailView?.preloadViewModel;
        this.addonOptions.preTemplate = () => createDomElement('div', { className: `${PRELOAD_CONTAINER_PREFIX}` });
      }
      if (!this.gridOptions.rowDetailView.postTemplate) {
        this._viewModel = this.gridOptions?.rowDetailView?.viewModel;
        this.addonOptions.postTemplate = (itemDetail: any) =>
          createDomElement('div', { className: `${ROW_DETAIL_CONTAINER_PREFIX}${itemDetail[this.datasetIdPropName]}` });
      }

      if (this._grid && this.gridOptions) {
        // this also requires the Row Selection Model to be registered as well
        if (!rowSelectionPlugin || !this._grid.getSelectionModel()) {
          rowSelectionPlugin = new SlickRowSelectionModel(this.gridOptions.rowSelectionOptions || { selectActiveRow: true });
          this._grid.setSelectionModel(rowSelectionPlugin);
        }

        // hook all events
        if (this._grid && this.rowDetailViewOptions) {
          if (this.rowDetailViewOptions.onExtensionRegistered) {
            this.rowDetailViewOptions.onExtensionRegistered(this);
          }

          this._eventHandler.subscribe(this.onAsyncResponse, (event, args) => {
            if (typeof this.rowDetailViewOptions?.onAsyncResponse === 'function') {
              this.rowDetailViewOptions.onAsyncResponse(event, args);
            }
          });

          this._eventHandler.subscribe(this.onAsyncEndUpdate, async (event, args) => {
            // dispose preload if exists
            this._preloadController?.dispose();

            // triggers after backend called "onAsyncResponse.notify()"
            await this.renderViewModel(args?.item);

            if (typeof this.rowDetailViewOptions?.onAsyncEndUpdate === 'function') {
              this.rowDetailViewOptions.onAsyncEndUpdate(event, args);
            }
          });

          this._eventHandler.subscribe(this.onAfterRowDetailToggle, async (event, args) => {
            // display preload template & re-render all the other Detail Views after toggling
            // the preload View will eventually go away once the data gets loaded after the "onAsyncEndUpdate" event
            await this.renderPreloadView();

            if (typeof this.rowDetailViewOptions?.onAfterRowDetailToggle === 'function') {
              this.rowDetailViewOptions.onAfterRowDetailToggle(event, args);
            }
          });

          this._eventHandler.subscribe(this.onBeforeRowDetailToggle, (event, args) => {
            // before toggling row detail, we need to create View Slot if it doesn't exist
            this.handleOnBeforeRowDetailToggle(event, args);

            if (typeof this.rowDetailViewOptions?.onBeforeRowDetailToggle === 'function') {
              return this.rowDetailViewOptions.onBeforeRowDetailToggle(event, args);
            }
            return true;
          });

          this._eventHandler.subscribe(this.onRowBackToViewportRange, async (event, args) => {
            // when row is back to viewport range, we will re-render the View Slot(s)
            await this.handleOnRowBackToViewportRange(event, args);

            if (typeof this.rowDetailViewOptions?.onRowBackToViewportRange === 'function') {
              this.rowDetailViewOptions.onRowBackToViewportRange(event, args);
            }
          });

          this._eventHandler.subscribe(this.onBeforeRowOutOfViewportRange, (event, args) => {
            if (typeof this.rowDetailViewOptions?.onBeforeRowOutOfViewportRange === 'function') {
              this.rowDetailViewOptions.onBeforeRowOutOfViewportRange(event, args);
            }
            this.disposeView(args.item);
          });

          this._eventHandler.subscribe(this.onRowOutOfViewportRange, (event, args) => {
            if (typeof this.rowDetailViewOptions?.onRowOutOfViewportRange === 'function') {
              this.rowDetailViewOptions.onRowOutOfViewportRange(event, args);
            }
          });

          // --
          // hook some events needed by the Plugin itself

          // we need to redraw the open detail views if we change column position (column reorder)
          this._eventHandler.subscribe(this._grid.onColumnsReordered, this.redrawAllViewSlots.bind(this, false));

          // on row selection changed, we also need to redraw
          if (this.gridOptions.enableRowSelection || this.gridOptions.enableCheckboxSelector) {
            this._eventHandler.subscribe(this._grid.onSelectedRowsChanged, this.redrawAllViewSlots.bind(this, false));
          }

          // on column sort/reorder, all row detail are collapsed so we can dispose of all the Views as well
          this._eventHandler.subscribe(this._grid.onSort, this.disposeAllViewSlot.bind(this));

          // redraw all Views whenever certain events are triggered
          this._subscriptions.push(
            this.eventPubSubService?.subscribe(
              ['onFilterChanged', 'onGridMenuColumnsChanged', 'onColumnPickerColumnsChanged'],
              this.redrawAllViewSlots.bind(this, false)
            ),
            this.eventPubSubService?.subscribe(['onGridMenuClearAllFilters', 'onGridMenuClearAllSorting'], () =>
              window.setTimeout(() => this.redrawAllViewSlots())
            )
          );
        }
      }
    }

    return this;
  }

  /** Redraw (re-render) all the expanded row detail View Slots */
  async redrawAllViewSlots(forceRedraw = false) {
    this.resetRenderedRows();
    const promises: Promise<void>[] = [];
    this._slots.forEach((x) => {
      forceRedraw && x.controller?.deactivate(x.controller, null);
      promises.push(this.redrawViewSlot(x));
    });
    await Promise.all(promises);
  }

  /** Render all the expanded row detail View Slots */
  async renderAllViewModels() {
    const promises: Promise<void>[] = [];
    this._slots.filter((x) => x?.dataContext).forEach((x) => promises.push(this.renderViewModel(x.dataContext)));
    await Promise.all(promises);
  }

  /** Redraw the necessary View Slot */
  async redrawViewSlot(slot: CreatedView) {
    const containerElement = this.gridContainerElement.querySelector(`.${ROW_DETAIL_CONTAINER_PREFIX}${slot.id}`);
    if (containerElement) {
      await this.renderViewModel(slot.dataContext);
    }
  }

  /** Render (or re-render) the View Slot (Row Detail) */
  async renderPreloadView() {
    const containerElement = this.gridContainerElement.querySelector<HTMLElement>(`.${PRELOAD_CONTAINER_PREFIX}`);
    if (this._preloadViewModel && containerElement) {
      const preloadComp = await this.aureliaUtilService.createAureliaViewModelAddToSlot(
        this._preloadViewModel,
        undefined,
        containerElement
      );
      this._preloadController = preloadComp?.controller;
    }
  }

  /** Render (or re-render) the View Slot (Row Detail) */
  async renderViewModel(item: any) {
    const containerElement = this.gridContainerElement.querySelector<HTMLElement>(
      `.${ROW_DETAIL_CONTAINER_PREFIX}${item[this.datasetIdPropName]}`
    );
    if (this._viewModel && containerElement) {
      // render row detail
      const bindableData = {
        model: item,
        addon: this,
        grid: this._grid,
        dataView: this.dataView,
        parent: this.rowDetailViewOptions?.parent,
      } as ViewModelBindableInputData;
      const aureliaComp = await this.aureliaUtilService.createAureliaViewModelAddToSlot(this._viewModel, bindableData, containerElement);
      const slotObj = this._slots.find((obj) => obj.id === item[this.datasetIdPropName]);

      if (slotObj && aureliaComp) {
        slotObj.controller = aureliaComp.controller;
      }
    }
  }

  // --
  // protected functions
  // ------------------

  protected disposeView(item: any, removeFromArray = false): void {
    const foundSlotIndex = this._slots.findIndex((slot: CreatedView) => slot.id === item[this.datasetIdPropName]);
    if (foundSlotIndex >= 0 && this.disposeViewSlot(this._slots[foundSlotIndex])) {
      if (removeFromArray) {
        this._slots.splice(foundSlotIndex, 1);
      }
    }
  }

  protected disposeViewSlot(expandedView: CreatedView): CreatedView | void {
    if (expandedView?.controller) {
      const container = this.gridContainerElement.querySelector(`.${ROW_DETAIL_CONTAINER_PREFIX}${expandedView.id}`);
      if (container) {
        expandedView.controller.deactivate(expandedView.controller, null);
        container.textContent = '';
        return expandedView;
      }
    }
  }

  /**
   * Just before the row get expanded or collapsed we will do the following
   * First determine if the row is expanding or collapsing,
   * if it's expanding we will add it to our View Slots reference array if we don't already have it
   * or if it's collapsing we will remove it from our View Slots reference array
   */
  protected handleOnBeforeRowDetailToggle(_e: SlickEventData<OnBeforeRowDetailToggleArgs>, args: { grid: SlickGrid; item: any }) {
    // expanding
    if (args?.item?.__collapsed) {
      // expanding row detail
      const viewInfo: CreatedView = {
        id: args.item[this.datasetIdPropName],
        dataContext: args.item,
      };
      addToArrayWhenNotExists(this._slots, viewInfo, this.datasetIdPropName);
    } else {
      // collapsing, so dispose of the View/ViewSlot
      this.disposeView(args.item, true);
    }
  }

  /** When Row comes back to Viewport Range, we need to redraw the View */
  protected async handleOnRowBackToViewportRange(
    _e: SlickEventData<OnRowBackToViewportRangeArgs>,
    args: {
      item: any;
      rowId: string | number;
      rowIndex: number;
      expandedRows: (string | number)[];
      rowIdsOutOfViewport: (string | number)[];
      grid: SlickGrid;
    }
  ) {
    const slot = this._slots.find((x) => x.id === args.rowId);
    if (slot) {
      this.redrawViewSlot(slot);
    }
  }

  /**
   * notify the onAsyncResponse with the "args.item" (required property)
   * the plugin will then use item to populate the row detail panel with the "postTemplate"
   * @param item
   */
  protected notifyTemplate(item: any) {
    this.onAsyncResponse.notify({ item, itemDetail: item }, new SlickEventData(), this);
  }

  /**
   * On Processing, we will notify the plugin with the new item detail once backend server call completes
   * @param item
   */
  protected async onProcessing(item: any) {
    if (item && typeof this._userProcessFn === 'function') {
      let awaitedItemDetail: any;
      const userProcessFn = this._userProcessFn(item);

      // wait for the "userProcessFn", once resolved we will save it into the "collection"
      const response: any | any[] = await userProcessFn;

      if (response.hasOwnProperty(this.datasetIdPropName)) {
        awaitedItemDetail = response; // from Promise
      } else if (response instanceof Response && typeof response['json'] === 'function') {
        awaitedItemDetail = await response['json'](); // from Fetch
      } else if (response && response['content']) {
        awaitedItemDetail = response['content']; // from aurelia-http-client
      }

      if (!awaitedItemDetail || !awaitedItemDetail.hasOwnProperty(this.datasetIdPropName)) {
        throw new Error(
          '[Aurelia-Slickgrid] could not process the Row Detail, please make sure that your "process" callback ' +
            `returns an item object that has an "${this.datasetIdPropName}" property`
        );
      }

      // notify the plugin with the new item details
      this.notifyTemplate(awaitedItemDetail || {});
    }
  }
}
