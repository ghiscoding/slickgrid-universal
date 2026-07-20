import { transient, type Constructable } from '@aurelia/kernel';
import type { ICustomElementController } from '@aurelia/runtime-html';
import {
  addToArrayWhenNotExists,
  createDomElement,
  SlickEventData,
  SlickHybridSelectionModel,
  unsubscribeAll,
  type EventSubscription,
  type OnBeforeRowDetailToggleArgs,
  type OnRowBackOrOutOfViewportRangeArgs,
  type SelectionModel,
  type SlickGrid,
} from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickRowDetailView as UniversalSlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';
import type { AureliaUtilService, CreatedView, GridOption, ViewModelBindableInputData } from 'aurelia-slickgrid';
import type { RowDetailView } from './interfaces.js';

const ROW_DETAIL_CONTAINER_PREFIX = 'container_';
const PRELOAD_CONTAINER_PREFIX = 'container_loading';

@transient()
export class AureliaRowDetailView extends UniversalSlickRowDetailView {
  static readonly pluginName = 'AureliaRowDetailView';
  protected _preloadViewModel?: Constructable;
  protected _preloadController?: ICustomElementController;
  protected _slots: CreatedView[] = [];
  protected _subscriptions: EventSubscription[] = [];
  protected _userProcessFn?: (item: any) => Promise<any>;
  protected _viewModel?: Constructable;
  protected _timer?: any;
  protected _keepAliveSlotIds = new Set<string | number>();

  constructor(
    protected readonly aureliaUtilService: AureliaUtilService,
    protected readonly eventPubSubService: EventPubSubService,
    protected readonly gridContainerElement: HTMLElement
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
    // Read from getOptions() (which returns _addonOptions) instead of gridOptions.rowDetailView
    // so that dynamic updates via setOptions() are reflected
    return this.getOptions() as RowDetailView | undefined;
  }

  /** Dispose of the RowDetailView Extension */
  dispose() {
    clearTimeout(this._timer);
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
  getAddonInstance(): AureliaRowDetailView | null {
    return this;
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    super.init(grid);
    this.register(grid.getSelectionModel());
  }

  /**
   * Create the plugin before the Grid creation, else it will behave oddly.
   * Mostly because the column definitions might change after the grid creation
   */
  register(rowSelectionPlugin?: SelectionModel) {
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
        this._preloadViewModel = this.gridOptions.rowDetailView.preloadViewModel;
        this.addonOptions.preTemplate = () => createDomElement('div', { className: `${PRELOAD_CONTAINER_PREFIX}` });
      }
      if (!this.gridOptions.rowDetailView.postTemplate) {
        this._viewModel = this.gridOptions.rowDetailView.viewModel;
        this.addonOptions.postTemplate = (itemDetail: any) =>
          createDomElement('div', { className: `${ROW_DETAIL_CONTAINER_PREFIX}${itemDetail[this.datasetIdPropName]}` });
      }

      if (this._grid && this.gridOptions) {
        // this also requires the Row Selection Model to be registered as well
        if (!rowSelectionPlugin || !this._grid.getSelectionModel()) {
          const selectionType = this.gridOptions.selectionOptions?.selectionType || 'row';
          const selectActiveRow = this.gridOptions.selectionOptions?.selectActiveRow ?? true;
          rowSelectionPlugin = new SlickHybridSelectionModel({ ...this.gridOptions.selectionOptions, selectionType, selectActiveRow });
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
            // because of the preload destroy above, we need a small delay to make sure the DOM element is ready to render the Row Detail
            queueMicrotask(async () => {
              await this.renderViewModel(args?.item);

              if (typeof this.rowDetailViewOptions?.onAsyncEndUpdate === 'function') {
                this.rowDetailViewOptions.onAsyncEndUpdate(event, args);
              }
            });
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
            if (this.rowDetailViewOptions?.keepComponentAlive) {
              this.detachViewFromDom(args.item);
            } else {
              this.disposeView(args.item);
            }
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
          if (this.gridOptions.enableSelection || this.gridOptions.enableCheckboxSelector) {
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
            this.eventPubSubService?.subscribe(['onGridMenuClearAllFilters', 'onGridMenuClearAllSorting'], () => {
              clearTimeout(this._timer);
              this._timer = setTimeout(() => this.redrawAllViewSlots());
            })
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
      const slotObj = this._slots.find((obj) => obj.id === item[this.datasetIdPropName]);

      // If keep-component-alive is enabled and component already exists (but detached), try to reattach it
      // If reattach fails, fall back to re-rendering fresh
      if (this.rowDetailViewOptions?.keepComponentAlive && slotObj?.controller && this._keepAliveSlotIds.has(slotObj.id)) {
        const reattachSuccess = this.reattachViewSlot(slotObj);
        if (reattachSuccess) {
          return;
        }
        // If reattach failed, fall through to re-render fresh below
      }

      // render row detail
      const bindableData = {
        model: item,
        addon: this,
        grid: this._grid,
        dataView: this.dataView,
        parentRef: this.rowDetailViewOptions?.parentRef,
      } as ViewModelBindableInputData;
      const aureliaComp = await this.aureliaUtilService.createAureliaViewModelAddToSlot(this._viewModel, bindableData, containerElement);

      if (slotObj && aureliaComp) {
        slotObj.controller = aureliaComp.controller;
      }
    }
  }

  // --
  // protected functions
  // ------------------

  /**
   * Detach a view slot from the DOM without deactivating its controller.
   * Used when `keepComponentAlive` is enabled so component state is preserved.
   */
  protected detachViewFromDom(item: any): void {
    const foundSlot = this._slots.find((slot: CreatedView) => slot.id === item[this.datasetIdPropName]);
    if (foundSlot?.controller) {
      // physically remove the controller's host element from the visible DOM without calling deactivate()
      const host = (foundSlot.controller as any).host as HTMLElement | undefined;
      host?.remove();
      this._keepAliveSlotIds.add(foundSlot.id);
    }
  }

  /**
   * Reattach a preserved (detached) view slot into the freshly rendered container element.
   * Used when `keepComponentAlive` is enabled and the row scrolls back into view.
   * Returns true if reattach succeeded, false if it failed (in which case re-rendering is needed).
   */
  protected reattachViewSlot(slot: CreatedView): boolean {
    const containerElement = this.gridContainerElement.querySelector<HTMLElement>(`.${ROW_DETAIL_CONTAINER_PREFIX}${slot.id}`);
    const host = (slot.controller as any)?.host as HTMLElement | undefined;
    if (containerElement && host) {
      try {
        // If host and containerElement are the same, component is already in correct position
        if (host === containerElement) {
          this._keepAliveSlotIds.delete(slot.id);
          return true;
        }

        // If containerElement is a descendant of host, there's a circular reference - can't reattach
        if (host.contains(containerElement)) {
          return false;
        }

        // Remove any old/stale container elements from within the host to prevent circular references
        const oldContainers = host.querySelectorAll(`.${ROW_DETAIL_CONTAINER_PREFIX}${slot.id}`);
        oldContainers.forEach((oldContainer) => {
          if (oldContainer !== containerElement && oldContainer.parentElement === host) {
            oldContainer.remove();
          }
        });

        // Only append if not already in this container (prevents HierarchyRequestError)
        if (host.parentElement !== containerElement) {
          containerElement.appendChild(host);
        }
        this._keepAliveSlotIds.delete(slot.id);
        return true;
      } catch {
        // If reattach fails (e.g., circular reference, DOM constraints), return false to trigger re-render
        return false;
      }
    }
    return false;
  }

  protected disposeView(item: any, removeFromArray = false): void {
    const foundSlotIndex = this._slots.findIndex((slot: CreatedView) => slot.id === item[this.datasetIdPropName]);
    if (foundSlotIndex >= 0 && this.disposeViewSlot(this._slots[foundSlotIndex])) {
      this._keepAliveSlotIds.delete(this._slots[foundSlotIndex].id);
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
    _e: SlickEventData<OnRowBackOrOutOfViewportRangeArgs>,
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
      if (this.rowDetailViewOptions?.keepComponentAlive && this._keepAliveSlotIds.has(args.rowId)) {
        // Try to reattach; if it fails, fall back to redraw
        const reattachSuccess = this.reattachViewSlot(slot);
        if (!reattachSuccess) {
          await this.redrawViewSlot(slot);
        }
      } else {
        await this.redrawViewSlot(slot);
      }
    }
  }

  /**
   * notify the onAsyncResponse with the "args.item" (required property)
   * the plugin will then use item to populate the row detail panel with the "postTemplate"
   * @param item
   */
  protected notifyTemplate(item: any) {
    this.onAsyncResponse.notify({ item }, new SlickEventData(), this);
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
