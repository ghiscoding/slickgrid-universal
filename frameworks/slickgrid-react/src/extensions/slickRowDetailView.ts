import {
  addToArrayWhenNotExists,
  createDomElement,
  type EventSubscription,
  type OnBeforeRowDetailToggleArgs,
  type OnRowBackOrOutOfViewportRangeArgs,
  SlickEventData,
  type SlickGrid,
  SlickRowSelectionModel,
  unsubscribeAll,
} from '@slickgrid-universal/common';
import { type EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickRowDetailView as UniversalSlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';
import type { Root } from 'react-dom/client';

import type { GridOption, RowDetailView, ViewModelBindableInputData } from '../models/index.js';
import { createReactComponentDynamically } from '../services/reactUtils.js';

const ROW_DETAIL_CONTAINER_PREFIX = 'container_';
const PRELOAD_CONTAINER_PREFIX = 'container_loading';

export interface CreatedView {
  id: string | number;
  dataContext: any;
  root: Root | null;
  rendered?: boolean;
}
// interface SRDV extends React.Component<Props, State>, UniversalSlickRowDetailView {}s

export class SlickRowDetailView extends UniversalSlickRowDetailView {
  protected _component?: any;
  protected _preloadComponent?: any;
  protected _preloadRoot?: Root;
  protected _views: CreatedView[] = [];
  protected _subscriptions: EventSubscription[] = [];
  protected _userProcessFn?: (item: any) => Promise<any>;
  protected gridContainerElement!: HTMLElement;
  _root?: Root;

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

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickRowDetailView | null {
    return this;
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    super.init(this._grid);
    this.gridContainerElement = grid.getContainerNode();
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
      throw new Error('[Slickgrid-React] You need to provide a "process" function for the Row Detail Extension to work properly');
    }

    if (this._grid && this.gridOptions?.rowDetailView) {
      // load the Preload & RowDetail Templates (could be straight HTML or React Components)
      // when those are React Components, we need to create View Component & provide the html containers to the Plugin (preTemplate/postTemplate methods)
      if (!this.gridOptions.rowDetailView.preTemplate) {
        this._preloadComponent = this.gridOptions?.rowDetailView?.preloadComponent;
        this.addonOptions.preTemplate = () => createDomElement('div', { className: `${PRELOAD_CONTAINER_PREFIX}` });
      }
      if (!this.gridOptions.rowDetailView.postTemplate) {
        this._component = this.gridOptions?.rowDetailView?.viewComponent;
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
            this._preloadRoot?.unmount();

            // triggers after backend called "onAsyncResponse.notify()"
            // because of the preload destroy above, we need a small delay to make sure the DOM element is ready to render the Row Detail
            queueMicrotask(() => {
              this.renderViewModel(args?.item);

              if (typeof this.rowDetailViewOptions?.onAsyncEndUpdate === 'function') {
                this.rowDetailViewOptions.onAsyncEndUpdate(event, args);
              }
            });
          });

          this._eventHandler.subscribe(this.onAfterRowDetailToggle, async (event, args) => {
            // display preload template & re-render all the other Detail Views after toggling
            // the preload View will eventually go away once the data gets loaded after the "onAsyncEndUpdate" event
            this.renderPreloadView(args.item);

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
          if (this.gridOptions.enableRowSelection || this.gridOptions.enableCheckboxSelector) {
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
  async redrawAllViewComponents(forceRedraw = false) {
    setTimeout(() => {
      this.resetRenderedRows();
      this._views.forEach((view) => {
        if (!view.rendered || forceRedraw) {
          forceRedraw && this.disposeViewComponent(view);
          this.redrawViewComponent(view);
        }
      });
    });
  }

  /** Render all the expanded row detail View Components */
  async renderAllViewModels() {
    this._views.filter((x) => x?.dataContext).forEach((x) => this.renderViewModel(x.dataContext));
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
      // render row detail
      const bindableData = {
        model: item,
        addon: this,
        grid: this._grid,
        dataView: this.dataView,
        parentRef: this.rowDetailViewOptions?.parentRef,
      } as ViewModelBindableInputData;
      const detailContainer = document.createElement('section');
      containerElement.appendChild(detailContainer);

      const { root } = createReactComponentDynamically(this._preloadComponent, detailContainer, bindableData);
      this._preloadRoot = root;
    }
  }

  /** Render (or re-render) the View Component (Row Detail) */
  renderViewModel(item: any) {
    const containerElement = this.gridContainerElement.querySelector<HTMLElement>(
      `.${ROW_DETAIL_CONTAINER_PREFIX}${item[this.datasetIdPropName]}`
    );
    if (this._component && containerElement) {
      const bindableData = {
        model: item,
        addon: this,
        grid: this._grid,
        dataView: this.dataView,
        parentRef: this.rowDetailViewOptions?.parentRef,
      } as ViewModelBindableInputData;

      // load our Row Detail React Component dynamically, typically we would want to use `root.render()` after the preload component (last argument below)
      // BUT the root render doesn't seem to work and shows a blank element, so we'll use `createRoot()` every time even though it shows a console log in Dev
      // that is the only way I got it working so let's use it anyway and console warnings are removed in production anyway
      const viewObj = this._views.find((obj) => obj.id === item[this.datasetIdPropName]);
      const { root } = createReactComponentDynamically(this._component, containerElement, bindableData);
      if (viewObj) {
        viewObj.root = root;
        viewObj.rendered = true;
      } else {
        this.upsertViewRefs(item, root);
      }
    }
  }

  // --
  // protected functions
  // ------------------

  protected upsertViewRefs(item: any, root: Root | null) {
    const viewIdx = this._views.findIndex((obj) => obj.id === item[this.datasetIdPropName]);
    const viewInfo: CreatedView = {
      id: item[this.datasetIdPropName],
      dataContext: item,
      root,
      rendered: !!root,
    };
    if (viewIdx >= 0) {
      this._views[viewIdx] = viewInfo;
    } else {
      this._views.push(viewInfo);
    }
    addToArrayWhenNotExists(this._views, viewInfo, this.datasetIdPropName);
  }

  protected disposeViewByItem(item: any, removeFromArray = false): void {
    const foundViewIdx = this._views.findIndex((view: CreatedView) => view.id === item[this.datasetIdPropName]);
    if (foundViewIdx >= 0) {
      this.disposeViewComponent(this._views[foundViewIdx]);
      if (removeFromArray) {
        this._views.splice(foundViewIdx, 1);
      }
    }
  }

  protected disposeViewComponent(expandedView: CreatedView): CreatedView | void {
    expandedView.rendered = false;
    if (expandedView?.root) {
      const container = this.gridContainerElement.querySelector(`.${ROW_DETAIL_CONTAINER_PREFIX}${expandedView.id}`);
      if (container) {
        expandedView.root.unmount();
        container.textContent = '';
        return expandedView;
      }
    }
  }

  /**
   * Just before the row get expanded or collapsed we will do the following
   * First determine if the row is expanding or collapsing,
   * if it's expanding we will add it to our View Components reference array,
   * if we don't already have it or if it's collapsing we will remove it from our View Components reference array
   */
  protected handleOnBeforeRowDetailToggle(_e: SlickEventData<OnBeforeRowDetailToggleArgs>, args: { grid: SlickGrid; item: any }) {
    // expanding
    if (args?.item?.__collapsed) {
      // expanding row detail
      this.upsertViewRefs(args.item, null);
    } else {
      // collapsing, so dispose of the View
      this.disposeViewByItem(args.item, true);
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

      if (response.hasOwnProperty(this.datasetIdPropName)) {
        awaitedItemDetail = response; // from Promise
      } else if (response instanceof Response && typeof response['json'] === 'function') {
        awaitedItemDetail = await response['json'](); // from Fetch
      } else if (response && response['content']) {
        awaitedItemDetail = response['content']; // from http-client
      }

      if (!awaitedItemDetail || !awaitedItemDetail.hasOwnProperty(this.datasetIdPropName)) {
        throw new Error(
          '[Slickgrid-React] could not process the Row Detail, please make sure that your "process" callback ' +
            `returns an item object that has an "${this.datasetIdPropName}" property`
        );
      }

      // notify the plugin with the new item details
      this.notifyTemplate(awaitedItemDetail || {});
    }
  }
}
