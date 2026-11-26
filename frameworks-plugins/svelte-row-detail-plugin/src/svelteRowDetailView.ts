import { SlickEventData, type EventSubscription, type RowDetailView, type SlickGrid } from '@slickgrid-universal/common';
import type { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickRowDetailView } from '@slickgrid-universal/row-detail-plugin';
import { flushSync, mount, unmount, type Component } from 'svelte';

export interface SvelteRowDetailViewOptions extends RowDetailView {
  preloadComponent?: Component<any>;
  viewComponent?: Component<any>;
  parentRef?: any;
  keepComponentAlive?: boolean;
}

interface MountedView {
  item: any;
  element: HTMLElement;
  component?: Record<string, any>;
  rendered: boolean;
}

/** Mount Svelte components in the universal row-detail plugin's virtualized panels. */
export class SvelteRowDetailView extends SlickRowDetailView {
  static readonly pluginName = 'SvelteRowDetailView';
  protected _views = new Map<string | number, MountedView>();
  protected _subscriptions: EventSubscription[] = [];
  protected _userProcess?: (item: any) => Promise<any>;
  protected _renderTimer?: ReturnType<typeof setTimeout>;
  protected _forceRedrawPending = false;
  protected _pubSub: EventPubSubService;
  protected _disposed = false;

  constructor(pubSub: EventPubSubService) {
    super(pubSub);
    this._pubSub = pubSub;
  }

  protected get rowOptions(): SvelteRowDetailViewOptions {
    return this.getOptions() as SvelteRowDetailViewOptions;
  }

  protected get itemIdField(): string {
    return this.gridOptions.datasetIdPropertyName || 'id';
  }

  override init(grid: SlickGrid): void {
    super.init(grid);
    const options = this.rowOptions;
    if (typeof options.process !== 'function') {
      throw new Error('[Slickgrid-Svelte] Row detail requires a process function.');
    }
    this._userProcess = options.process as (item: any) => Promise<any>;
    options.process = (item: any) => this.processItem(item);
    if (!options.preTemplate) {
      options.preTemplate = () => '';
    }
    if (!options.postTemplate) {
      options.postTemplate = () => '';
    }
    options.onExtensionRegistered?.(this);

    this.eventHandler.subscribe(this.onBeforeRowDetailToggle, (event, args) => {
      if (!args.item?.[`${this._keyPrefix}collapsed`]) {
        this.disposeView(args.item, true);
      }
      return this.rowOptions.onBeforeRowDetailToggle?.(event, args);
    });
    this.eventHandler.subscribe(this.onAfterRowDetailToggle, (event, args) => {
      const currentOptions = this.rowOptions;
      if (!args.item?.[`${this._keyPrefix}detailViewLoaded`] && currentOptions.preloadComponent) {
        this.renderComponent(args.item, currentOptions.preloadComponent);
      }
      currentOptions.onAfterRowDetailToggle?.(event, args);
    });
    this.eventHandler.subscribe(this.onAsyncResponse, (event, args) => this.rowOptions.onAsyncResponse?.(event, args));
    this.eventHandler.subscribe(this.onAsyncEndUpdate, (event, args) => this.rowOptions.onAsyncEndUpdate?.(event, args));
    this.eventHandler.subscribe(this.onBeforeRowOutOfViewportRange, (event, args) => {
      const currentOptions = this.rowOptions;
      currentOptions.onBeforeRowOutOfViewportRange?.(event, args);
      if (currentOptions.keepComponentAlive) {
        this.detachViewFromDom(args.item);
      } else {
        // Keep a placeholder so onRendered can recreate the component if SlickGrid
        // replaces the detail panel while the row is being reflowed.
        this.disposeView(args.item, true, false);
      }
    });
    this.eventHandler.subscribe(this.onRowOutOfViewportRange, (event, args) => this.rowOptions.onRowOutOfViewportRange?.(event, args));
    this.eventHandler.subscribe(this.onRowBackToViewportRange, (event, args) => {
      const view = this._views.get(args.rowId);
      if (!view || !view.rendered || !view.element.isConnected) {
        this.redrawView(args.item);
      }
      this.rowOptions.onRowBackToViewportRange?.(event, args);
    });
    this.eventHandler.subscribe(grid.onColumnsReordered, () => this.redrawAll(false));
    if (this.gridOptions.enableSelection || this.gridOptions.enableCheckboxSelector) {
      this.eventHandler.subscribe(grid.onSelectedRowsChanged, () => this.redrawAll(false));
    }
    this.eventHandler.subscribe(grid.onSort, () => this.disposeAll());
    this.eventHandler.subscribe(grid.onRendered, () => this.redrawDetached());
    this._subscriptions.push(
      this._pubSub.subscribe(
        [
          'onFilterChanged',
          'onGridMenuColumnsChanged',
          'onColumnPickerColumnsChanged',
          'onGridMenuClearAllFilters',
          'onGridMenuClearAllSorting',
        ],
        () => this.redrawAll(true)
      )
    );
  }

  protected override beforeDetailViewRender(item: any): void {
    this.disposeView(item, true);
  }

  protected override renderDetailView(item: any): void {
    if (this.rowOptions.viewComponent) {
      this.renderComponent(item, this.rowOptions.viewComponent);
    }
  }

  protected async processItem(item: any): Promise<void> {
    const response = await this._userProcess!(item);
    const detail = response instanceof Response ? await response.json() : response;
    if (!detail || !(this.itemIdField in detail)) {
      throw new Error(`[Slickgrid-Svelte] Row detail process must return an item containing "${this.itemIdField}".`);
    }
    if (!this._disposed) {
      this.onAsyncResponse.notify({ item: detail }, new SlickEventData(), this);
    }
  }

  protected renderComponent(item: any, component: Component<any>, flush = true): void {
    const id = item?.[this.itemIdField];
    const container = this._grid.getContainerNode().getElementsByClassName(`row-detail-${id}`)[0] as HTMLElement | undefined;
    if (!container) {
      return;
    }
    const existing = this._views.get(id);
    if (existing?.component && this.rowOptions.keepComponentAlive && existing.item === item && this.reattachView(existing, container)) {
      return;
    }
    if (existing) {
      this.disposeView(item, true);
    }
    const element = document.createElement('div');
    container.appendChild(element);
    const view = mount(component, {
      target: element,
      props: { model: item, addon: this, grid: this._grid, dataView: this.dataView, parentRef: this.rowOptions.parentRef },
    });
    // effects (e.g. onMount) only run on flush, batched callers flush once after rendering all their views
    if (flush) {
      flushSync();
    }
    this._views.set(id, { item, element, component: view, rendered: true });
  }

  protected disposeView(item: any, destroy: boolean, removeFromMap = destroy): void {
    const id = item?.[this.itemIdField];
    const view = this._views.get(id);
    if (!view) {
      return;
    }
    if (destroy) {
      if (view.component) {
        void unmount(view.component);
        view.component = undefined;
      }
      if (removeFromMap) {
        this._views.delete(id);
      }
    }
    view.rendered = false;
    view.element.remove();
  }

  protected detachViewFromDom(item: any): void {
    this.disposeView(item, false);
  }

  protected reattachView(view: MountedView, container?: HTMLElement): boolean {
    const target =
      container ??
      (this._grid.getContainerNode().getElementsByClassName(`row-detail-${view.item[this.itemIdField]}`)[0] as HTMLElement | undefined);
    if (!target) {
      return false;
    }
    if (view.element.parentElement !== target) {
      target.appendChild(view.element);
    }
    view.rendered = true;
    return true;
  }

  protected disposeAll(): void {
    for (const view of Array.from(this._views.values())) {
      this.disposeView(view.item, true);
    }
  }

  protected redrawView(item: any, flush = true): void {
    const view = this._views.get(item?.[this.itemIdField]);
    const component = item?.[`${this._keyPrefix}detailViewLoaded`] ? this.rowOptions.viewComponent : this.rowOptions.preloadComponent;
    if (view?.component && this.rowOptions.keepComponentAlive && view.item === item && this.reattachView(view)) {
      return;
    } else if (component) {
      this.renderComponent(item, component, flush);
    }
  }

  protected redrawAll(forceRedraw: boolean): void {
    this._forceRedrawPending ||= forceRedraw;
    clearTimeout(this._renderTimer);
    this._renderTimer = setTimeout(() => {
      const forcePendingRedraw = this._forceRedrawPending;
      this._forceRedrawPending = false;
      this.resetRenderedRows();
      for (const view of Array.from(this._views.values())) {
        if (forcePendingRedraw || !view.rendered || !view.element.isConnected) {
          // keep a placeholder so the view is re-created when its panel is back in the DOM
          forcePendingRedraw && this.disposeView(view.item, true, false);
          this.redrawView(view.item, false);
        }
      }
      flushSync();
    });
  }

  protected redrawDetached(): void {
    const renderedRange = this._views.size ? this._grid.getRenderedRange() : undefined;
    if (!renderedRange) {
      return;
    }
    let hasRedrawn = false;
    for (const view of Array.from(this._views.values())) {
      const itemId = view.item?.[this.itemIdField];
      if (!this._renderedViewportRowIds.has(itemId) || (view.rendered && view.element.isConnected)) {
        continue;
      }
      const rowIndex = this.dataView.getRowById(itemId);
      if (rowIndex === undefined || rowIndex < renderedRange.top || rowIndex > renderedRange.bottom) {
        continue;
      }
      this.redrawView(view.item, false);
      hasRedrawn = true;
    }
    if (hasRedrawn) {
      flushSync();
    }
  }

  /** Dispose of an individual mounted view while leaving the row-detail plugin active. */
  disposeViewByItem(item: any, removeFromArray = false): void {
    this.disposeView(item, true, removeFromArray);
  }

  disposeAllViewComponents(): void {
    this.disposeAll();
  }

  /** Redraw the expanded row detail components, `forceRedraw` also re-creates the ones that are currently rendered. */
  redrawAllViewComponents(forceRedraw = false): void {
    this.redrawAll(forceRedraw);
  }

  getAddonInstance(): SvelteRowDetailView {
    return this;
  }

  override collapseDetailView(itemId: number | string, isMultipleCollapsing = false): void {
    const item = this.dataView.getItemById(itemId);
    if (item) {
      this.disposeView(item, true);
    }
    super.collapseDetailView(itemId, isMultipleCollapsing);
  }

  override dispose(): void {
    this._disposed = true;
    clearTimeout(this._renderTimer);
    this._forceRedrawPending = false;
    this._subscriptions.forEach((subscription) => subscription.unsubscribe?.());
    this.disposeAll();
    super.dispose();
  }
}
