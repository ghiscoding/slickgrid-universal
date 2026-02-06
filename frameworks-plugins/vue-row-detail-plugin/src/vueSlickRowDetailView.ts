import {
  createDomElement,
  emptyElement,
  SlickEventData,
  SlickHybridSelectionModel,
  unsubscribeAll,
  type EventSubscription,
  type OnBeforeRowDetailToggleArgs,
  type OnRowBackOrOutOfViewportRangeArgs,
  type SelectionModel,
  type SlickGrid,
} from '@slickgrid-universal/common';
import { type EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickRowDetailView as UniversalSlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';
import type { GridOption, ViewModelBindableInputData } from 'slickgrid-vue';
import { createApp, type App, type ComponentPublicInstance } from 'vue';
import type { RowDetailView } from './interfaces';

const ROW_DETAIL_CONTAINER_PREFIX = 'container_';
const PRELOAD_CONTAINER_PREFIX = 'container_loading';

type AppData = Record<string, unknown>;
export interface CreatedView {
  id: string | number;
  dataContext: any;
  app: App | null;
  rendered?: boolean;
  instance: ComponentPublicInstance | null;
}

export class VueSlickRowDetailView extends UniversalSlickRowDetailView {
  static readonly pluginName = 'VueSlickRowDetailView';
  protected _component?: any;
  protected _preloadComponent?: any;
  protected _preloadApp?: App<Element>;
  protected _views: CreatedView[] = [];
  protected _subscriptions: EventSubscription[] = [];
  protected _userProcessFn?: (item: any) => Promise<any>;
  protected gridContainerElement!: HTMLElement;

  constructor(private readonly eventPubSubService: EventPubSubService) {
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
    this.disposeAllViewComponents();
    unsubscribeAll(this._subscriptions);
    super.dispose();
  }

  /** Dispose of all the opened Row Detail Panels Components */
  disposeAllViewComponents() {
    do {
      const view = this._views.pop();
      if (view) {
        this.disposeViewByItem(view);
      }
    } while (this._views.length > 0);
  }

  disposeViewByItem(item: any, removeFromArray = false): void {
    const foundViewIdx = this._views.findIndex((view: CreatedView) => view.id === item[this.datasetIdPropName]);
    if (foundViewIdx >= 0) {
      this.disposeViewComponent(this._views[foundViewIdx]);
      if (removeFromArray) {
        this._views.splice(foundViewIdx, 1);
      }
    }
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): VueSlickRowDetailView | null {
    return this;
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    super.init(grid);
    this.gridContainerElement = grid.getContainerNode();
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
      throw new Error('[Slickgrid-Vue] You need to provide a "process" function for the Row Detail Extension to work properly');
    }

    if (this._grid && this.gridOptions?.rowDetailView) {
      // load the Preload & RowDetail Templates (could be straight HTML or Vue Components)
      // when those are Vue Components, we need to create View Component & provide the html containers to the Plugin (preTemplate/postTemplate methods)
      if (!this.gridOptions.rowDetailView.preTemplate) {
        this._preloadComponent = this.gridOptions.rowDetailView.preloadComponent;
        this.addonOptions.preTemplate = () => createDomElement('div', { className: `${PRELOAD_CONTAINER_PREFIX}` });
      }
      if (!this.gridOptions.rowDetailView.postTemplate) {
        this._component = this.gridOptions.rowDetailView.viewComponent;
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
            // unmount preload if exists
            this._preloadApp?.unmount();

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
            await this.renderPreloadView(args.item);

            if (typeof this.rowDetailViewOptions?.onAfterRowDetailToggle === 'function') {
              this.rowDetailViewOptions.onAfterRowDetailToggle(event, args);
            }
          });

          this._eventHandler.subscribe(this.onBeforeRowDetailToggle, (event, args) => {
            // before toggling row detail, we need to create View Component if it doesn't exist
            this.handleOnBeforeRowDetailToggle(event, args);

            if (typeof this.rowDetailViewOptions?.onBeforeRowDetailToggle === 'function') {
              return this.rowDetailViewOptions.onBeforeRowDetailToggle(event, args);
            }
            return true;
          });

          this._eventHandler.subscribe(this.onRowBackToViewportRange, async (event, args) => {
            // when row is back to viewport range, we will re-render the View Component(s)
            this.handleOnRowBackToViewportRange(event, args);

            if (typeof this.rowDetailViewOptions?.onRowBackToViewportRange === 'function') {
              this.rowDetailViewOptions.onRowBackToViewportRange(event, args);
            }
          });

          this._eventHandler.subscribe(this.onBeforeRowOutOfViewportRange, (event, args) => {
            if (typeof this.rowDetailViewOptions?.onBeforeRowOutOfViewportRange === 'function') {
              this.rowDetailViewOptions.onBeforeRowOutOfViewportRange(event, args);
            }
            this.disposeViewByItem(args.item);
          });

          this._eventHandler.subscribe(this.onRowOutOfViewportRange, (event, args) => {
            if (typeof this.rowDetailViewOptions?.onRowOutOfViewportRange === 'function') {
              this.rowDetailViewOptions.onRowOutOfViewportRange(event, args);
            }
          });

          // --
          // hook some events needed by the Plugin itself

          // we need to redraw the open detail views if we change column position (column reorder)
          this.eventHandler.subscribe(this._grid.onColumnsReordered, () => this.redrawAllViewComponents(false));

          // on row selection changed, we also need to redraw
          if (this.gridOptions.enableSelection || this.gridOptions.enableCheckboxSelector) {
            this._eventHandler.subscribe(this._grid.onSelectedRowsChanged, () => this.redrawAllViewComponents(false));
          }

          // on column sort/reorder, all row detail are collapsed so we can dispose of all the Views as well
          this._eventHandler.subscribe(this._grid.onSort, this.disposeAllViewComponents.bind(this));

          // on filter changed, we need to re-render all Views
          this._subscriptions.push(
            this.eventPubSubService?.subscribe(
              [
                'onFilterChanged',
                'onGridMenuColumnsChanged',
                'onColumnPickerColumnsChanged',
                'onGridMenuClearAllFilters',
                'onGridMenuClearAllSorting',
              ],
              () => this.redrawAllViewComponents(true)
            )
          );
        }
      }
    }

    return this;
  }

  /** Redraw (re-render) all the expanded row detail View Components */
  redrawAllViewComponents(forceRedraw = false) {
    setTimeout(() => {
      this.resetRenderedRows();
      this._views.forEach((view) => {
        if (!view.rendered || forceRedraw) {
          forceRedraw && view.app?.unmount();
          this.redrawViewComponent(view);
        }
      });
    });
  }

  /** Render all the expanded row detail View Components */
  renderAllViewModels() {
    Array.from(this._views)
      .filter((x) => x?.dataContext)
      .forEach((x) => this.renderViewModel(x.dataContext));
  }

  /** Redraw the necessary View Component */
  redrawViewComponent(view: CreatedView) {
    const containerElement = this.gridContainerElement.querySelector(`.${ROW_DETAIL_CONTAINER_PREFIX}${view.id}`);
    if (containerElement) {
      this.renderViewModel(view.dataContext);
    }
  }

  /** Render (or re-render) the View Component (Row Detail) */
  renderPreloadView(item: any) {
    const containerElement = this.gridContainerElement.querySelector(`.${PRELOAD_CONTAINER_PREFIX}`);
    if (this._preloadComponent && containerElement) {
      const viewObj = this._views.find((obj) => obj.id === item[this.datasetIdPropName]);
      const bindableData = {
        model: item,
        addon: this,
        grid: this._grid,
        dataView: this.dataView,
        parentRef: this.rowDetailViewOptions?.parentRef,
      } as AppData & ViewModelBindableInputData;

      const tmpDiv = document.createElement('div');
      this._preloadApp = createApp(this._preloadComponent, bindableData);
      const instance = this._preloadApp.mount(tmpDiv) as ComponentPublicInstance;
      bindableData.parentRef = instance;
      containerElement.appendChild(instance.$el);

      if (viewObj) {
        viewObj.app = this._preloadApp;
        viewObj.instance = instance;
      }
    }
  }

  /** Render (or re-render) the View Component (Row Detail) */
  renderViewModel(item: any) {
    const containerElement = this.gridContainerElement.querySelector(`.${ROW_DETAIL_CONTAINER_PREFIX}${item[this.datasetIdPropName]}`);
    if (this._component && containerElement) {
      const bindableData = {
        model: item,
        addon: this,
        grid: this._grid,
        dataView: this.dataView,
        parentRef: this.rowDetailViewOptions?.parentRef,
      } as AppData & ViewModelBindableInputData;

      this.unmountViewWhenExists(item[this.datasetIdPropName]);

      // empty container & load our Row Detail Vue Component dynamically
      emptyElement(containerElement);
      const tmpDiv = document.createElement('div');
      const app = createApp(this._component, bindableData);
      const instance = app.mount(tmpDiv) as ComponentPublicInstance;
      bindableData.parentRef = app.component;
      containerElement.appendChild(instance.$el);
      this.upsertViewRefs(item, { app, instance, rendered: true });
    }
  }

  // --
  // protected functions
  // ------------------

  /** remove any previous mounted views, if found then unmount them and delete them from our references array */
  protected unmountViewWhenExists(itemId: string | number) {
    const viewIdx = this._views.findIndex((obj) => obj.id === itemId);
    if (viewIdx >= 0) {
      const viewObj = this._views[viewIdx];
      viewObj.app?.unmount();
      viewObj.rendered = false;
    }
  }

  protected upsertViewRefs(item: any, options: { app: App | null; instance: ComponentPublicInstance | null; rendered: boolean }) {
    const viewIdx = this._views.findIndex((obj) => obj.id === item[this.datasetIdPropName]);
    const viewInfo: CreatedView = {
      id: item[this.datasetIdPropName],
      dataContext: item,
      app: options.app,
      instance: options.instance,
      rendered: options.rendered,
    };
    if (viewIdx >= 0) {
      this._views[viewIdx] = viewInfo;
    } else {
      this._views.push(viewInfo);
    }
  }

  protected disposeViewComponent(expandedView: CreatedView): CreatedView | void {
    if (expandedView?.instance) {
      expandedView.rendered = false;
      const container = this.gridContainerElement.querySelector(`.${ROW_DETAIL_CONTAINER_PREFIX}${expandedView.id}`);
      if (container) {
        expandedView.app?.unmount();
        container.textContent = '';
        return expandedView;
      }
    }
  }

  /**
   * Just before the row get expanded or collapsed we will do the following
   * First determine if the row is expanding or collapsing,
   * if it's expanding we will add it to our View Components reference array if we don't already have it
   * or if it's collapsing we will remove it from our View Components reference array
   */
  protected handleOnBeforeRowDetailToggle(_e: SlickEventData<OnBeforeRowDetailToggleArgs>, args: { grid: SlickGrid; item: any }) {
    // expanding
    if (args?.item?.__collapsed) {
      // expanding row detail
      this.upsertViewRefs(args.item, { app: null, instance: null, rendered: false });
    } else {
      // collapsing, so dispose of the View
      this.disposeViewByItem(args.item, true);
    }
  }

  /** When Row comes back to Viewport Range, we need to redraw the View */
  protected handleOnRowBackToViewportRange(
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
    const viewModel = this._views.find((x) => x.id === args.rowId);
    if (viewModel && !viewModel.rendered) {
      this.redrawViewComponent(viewModel);
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

      if (this.datasetIdPropName in response) {
        awaitedItemDetail = response; // from Promise
      } else if (response instanceof Response && typeof response['json'] === 'function') {
        awaitedItemDetail = await response['json'](); // from Fetch
      }

      if (!awaitedItemDetail || !(this.datasetIdPropName in awaitedItemDetail)) {
        throw new Error(
          '[Slickgrid-Vue] could not process the Row Detail, please make sure that your "process" callback ' +
            `returns an item object that has an "${this.datasetIdPropName}" property`
        );
      }

      // notify the plugin with the new item details
      this.notifyTemplate(awaitedItemDetail || {});
    }
  }
}
