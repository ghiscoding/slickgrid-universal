import { dragAndDrop, remapNodes, tearDown, type ParentConfig } from '@formkit/drag-and-drop';
import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService, EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { classNameToList, createDomElement, emptyElement, isEmptyObject } from '@slickgrid-universal/utils';
import { SlickEvent, SlickEventData, SlickEventHandler, type SlickDataView, type SlickGrid } from '../core/index.js';
import { SortDirectionNumber } from '../enums/index.js';
import type {
  Column,
  DOMMouseOrTouchEvent,
  DraggableGrouping,
  DraggableGroupingOption,
  GridOption,
  Grouping,
  GroupingGetterFunction,
} from '../interfaces/index.js';
import type { SharedService } from '../services/shared.service.js';
import { sortByFieldType } from '../sortComparers/sortUtilities.js';
import type { ExtensionUtility } from './extensionUtility.js';

/**
 *
 * Draggable Grouping contributed by:  Muthukumar Selconstasu
 *  muthukumar{dot}se{at}gmail{dot}com
 *  github.com/muthukumarse/Slickgrid
 *
 * NOTES:
 *     This plugin provides the Draggable Grouping feature which could be located in either the Top-Header or the Pre-Header
 *
 * A plugin to add drop-down menus to column headers.
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.columns = [{
 *     id: 'cost', name: 'Cost', field: 'cost',
 *     grouping: {
 *       getter: 'cost',
 *       formatter: (g) => `Cost: ${g.value} <span style="color:green">(${g.count} items)</span>`,
 *       aggregators: [new Aggregators.Sum('cost')],
 *       aggregateCollapsed: true,
 *       collapsed: true
 *     }
 *   }];
 */
export class SlickDraggableGrouping {
  columnsGroupBy: Column[] = [];
  onGroupChanged: SlickEvent;
  readonly pluginName = 'DraggableGrouping';

  protected _addonOptions!: DraggableGrouping;
  protected _bindingEventService: BindingEventService;
  protected _draggedColumnId: string | null = null;
  protected _droppableParent?: HTMLElement;
  protected _dropzoneElm!: HTMLDivElement;
  protected _dropzonePlaceholderElm!: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _grid?: SlickGrid;
  protected _gridColumns: Column[] = [];
  protected _gridUid = '';
  protected _groupToggler?: HTMLDivElement;
  protected _isInitialized = false;
  protected _reorderedColumns: Column[] = [];
  protected _sortableLeftParent?: HTMLElement;
  protected _sortableRightParent?: HTMLElement;
  protected _subscriptions: EventSubscription[] = [];
  protected _defaults = {
    dropPlaceHolderText: 'Drop a column header here to group by the column',
    hideGroupSortIcons: false,
    hideToggleAllButton: false,
    toggleAllButtonText: '',
    toggleAllPlaceholderText: 'Toggle all Groups',
  } as DraggableGroupingOption;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService
  ) {
    this._bindingEventService = new BindingEventService();
    this.onGroupChanged = new SlickEvent<{ caller?: string; groupColumns: Grouping[] }>('onGroupChanged');
    this._eventHandler = new SlickEventHandler();
  }

  protected ensureWindowAbortSignal(parent: HTMLElement): void {
    const win = parent.ownerDocument.defaultView;
    if (win && globalThis.AbortController !== win.AbortController) {
      globalThis.AbortController = win.AbortController;
    }
    if (win && globalThis.AbortSignal !== win.AbortSignal) {
      globalThis.AbortSignal = win.AbortSignal;
    }
  }

  get addonOptions(): DraggableGroupingOption {
    return this._addonOptions;
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView {
    return this.grid?.getData<SlickDataView>() ?? {};
  }

  get dropboxElement(): HTMLDivElement {
    return this._dropzoneElm;
  }

  get droppableParent(): HTMLElement | undefined {
    return this._droppableParent;
  }

  get sortableLeftParent(): HTMLElement | undefined {
    return this._sortableLeftParent;
  }

  get sortableRightParent(): HTMLElement | undefined {
    return this._sortableRightParent;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get grid(): SlickGrid {
    return this._grid ?? this.sharedService.slickGrid ?? {};
  }

  get gridOptions(): GridOption {
    return this.sharedService.gridOptions ?? {};
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this._gridUid || (this.grid?.getUID() ?? '');
  }

  get gridContainer(): HTMLElement {
    return this.grid.getContainerNode();
  }
  set isInitialized(state: boolean) {
    this._isInitialized = state;
  }

  /** Initialize plugin. */
  init(grid: SlickGrid, groupingOptions?: DraggableGrouping): this {
    this._addonOptions = { ...this._defaults, ...groupingOptions };
    this._grid = grid;
    if (grid) {
      this._gridUid = grid.getUID();
      this._gridColumns = grid.getColumns();
      this._dropzoneElm = grid.getTopHeaderPanel() || grid.getPreHeaderPanel();
      if (!this._dropzoneElm) {
        throw new Error(
          '[Slickgrid-Universal] Draggable Grouping requires the pre-header to be created and shown for the plugin to work correctly (use `createPreHeaderPanel` and `showPreHeaderPanel`).'
        );
      }
      this._dropzoneElm.classList.add('slick-dropzone');

      // add PubSub instance to all SlickEvent
      this.onGroupChanged.setPubSubService(this.pubSubService);

      // add optional group "Toggle All" with its button & text when provided
      if (!this._addonOptions.hideToggleAllButton) {
        this._groupToggler = createDomElement('div', {
          className: 'slick-group-toggle-all',
          title: this._addonOptions.toggleAllPlaceholderText ?? '',
          style: { display: 'none' },
        });
        const groupTogglerIconElm = createDomElement('span', { className: 'sgi slick-group-toggle-all-icon' }, this._groupToggler);

        if (this.gridOptions.enableTranslate && this._addonOptions.toggleAllButtonTextKey) {
          this._addonOptions.toggleAllButtonText = this.extensionUtility.translateWhenEnabledAndServiceExist(
            this._addonOptions.toggleAllButtonTextKey,
            'TEXT_TOGGLE_ALL_GROUPS'
          );
        }
        if (this.gridOptions.enableTranslate && this._addonOptions.toggleAllPlaceholderTextKey) {
          this._addonOptions.toggleAllPlaceholderText = this.extensionUtility.translateWhenEnabledAndServiceExist(
            this._addonOptions.toggleAllPlaceholderTextKey,
            'TEXT_TOGGLE_ALL_GROUPS'
          );
        }
        this._groupToggler.title = this._addonOptions.toggleAllPlaceholderText ?? '';

        if (this._addonOptions.toggleAllButtonText) {
          this._groupToggler.appendChild(
            createDomElement('span', {
              className: 'slick-group-toggle-all-text',
              textContent: this._addonOptions.toggleAllButtonText || '',
            })
          );
        }
        this._dropzoneElm.appendChild(this._groupToggler);

        // when calling Expand/Collapse All Groups from Context Menu, we also need to inform this plugin as well of the action
        this._subscriptions.push(
          this.pubSubService.subscribe('onContextMenuCollapseAllGroups', () => this.toggleGroupToggler(groupTogglerIconElm, true, false)),
          this.pubSubService.subscribe('onContextMenuExpandAllGroups', () => this.toggleGroupToggler(groupTogglerIconElm, false, false))
        );
      }

      this._dropzonePlaceholderElm = createDomElement('div', { className: 'slick-draggable-dropzone-placeholder' }, this._dropzoneElm);
      if (this.gridOptions.enableTranslate && this._addonOptions?.dropPlaceHolderTextKey) {
        this._addonOptions.dropPlaceHolderText = this.extensionUtility.translateWhenEnabledAndServiceExist(
          this._addonOptions.dropPlaceHolderTextKey,
          'TEXT_TOGGLE_ALL_GROUPS'
        );
      }
      this._dropzonePlaceholderElm.textContent = this._addonOptions?.dropPlaceHolderText ?? this._defaults.dropPlaceHolderText ?? '';

      this.setupColumnDropbox();

      this._eventHandler.subscribe(grid.onHeaderCellRendered, (_e, args) => {
        const node = args.node;

        if (!isEmptyObject(args.column?.grouping) && node) {
          node.style.cursor = 'pointer'; // add the pointer cursor on each column title

          // also optionally add an icon beside each column title that can be dragged
          if (this._addonOptions.groupIconCssClass) {
            const groupableIconElm = createDomElement('span', { className: 'slick-column-groupable' }, node);
            if (this._addonOptions.groupIconCssClass) {
              groupableIconElm.classList.add(...classNameToList(this._addonOptions.groupIconCssClass));
            }
          }
        }
      });

      // when calling Clear All Groups from Context Menu, we also need to inform this plugin as well of the action
      this._subscriptions.push(this.pubSubService.subscribe('onContextMenuClearGrouping', () => this.clearDroppedGroups()));

      for (const col of this._gridColumns) {
        const columnId = col.field;
        grid.updateColumnHeader(columnId);
      }
    }
    return this;
  }

  /** Dispose the plugin. */
  dispose(): void {
    this.destroySortableInstances();
    if (this._droppableParent) {
      tearDown(this._droppableParent);
      this._droppableParent = undefined;
    }
    this.onGroupChanged.unsubscribe();
    this._eventHandler.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);
    this._bindingEventService.unbindAll();
    emptyElement(this.gridContainer.querySelector(`.${this.gridUid} .slick-preheader-panel,.${this.gridUid} .slick-topheader-panel`));
  }

  clearDroppedGroups(): void {
    this.columnsGroupBy = [];
    this.updateGroupBy('clear-all');
    const allDroppedGroupingElms = this._dropzoneElm.querySelectorAll('.slick-dropped-grouping');
    for (const groupElm of Array.from(allDroppedGroupingElms)) {
      const groupRemoveBtnElm = this._dropzoneElm.querySelector('.slick-groupby-remove');
      groupRemoveBtnElm?.remove();
      groupElm?.remove();
    }

    // show placeholder text & hide the "Toggle All" when that later feature is enabled
    this._dropzonePlaceholderElm.style.display = 'inline-block';
    if (this._groupToggler) {
      this._groupToggler.style.display = 'none';
    }
  }

  destroySortableInstances(): void {
    this._bindingEventService.unbindAll('colreorder');
    if (this._sortableLeftParent) {
      tearDown(this._sortableLeftParent);
      this._sortableLeftParent = undefined;
    }
    if (this._sortableRightParent) {
      tearDown(this._sortableRightParent);
      this._sortableRightParent = undefined;
    }
  }

  setAddonOptions(options: Partial<DraggableGroupingOption>): void {
    this._addonOptions = { ...this._addonOptions, ...options };
  }

  setColumns(cols: Column[]): void {
    this._gridColumns = cols;
  }

  setDroppedGroups(groupingInfo: Array<string | GroupingGetterFunction> | string): void {
    this._dropzonePlaceholderElm.style.display = 'none';
    const groupingInfos = Array.isArray(groupingInfo) ? groupingInfo : [groupingInfo];
    for (const groupInfo of groupingInfos) {
      const columnElm = this.grid.getHeaderColumn(groupInfo as string);
      this.handleGroupByDrop(this._dropzoneElm, columnElm);
    }
  }

  /**
   * Setup the column reordering
   * NOTE: this function is a standalone function and is called externally and does not have access to `this` instance
   * @param grid - slick grid object
   * @param headers - slick grid column header elements
   * @param _headerColumnWidthDiff - header column width difference
   * @param setColumns - callback to reassign columns
   * @param setupColumnResize - callback to setup the column resize
   * @param columns - columns array
   * @param getColumnIndex - callback to find index of a column
   * @param uid - grid UID
   * @param trigger - callback to execute when triggering a column grouping
   */
  setupColumnReorder(
    grid: SlickGrid,
    headers: any,
    _headerColumnWidthDiff: any,
    setColumns: (columns: Column[]) => void,
    setupColumnResize: () => void,
    _columns: Column[],
    getColumnIndex: (columnId: string) => number,
    _uid: string,
    trigger: (slickEvent: SlickEvent, data?: any) => void
  ): {
    sortableLeftParent: HTMLElement;
    sortableRightParent: HTMLElement;
  } {
    this.destroySortableInstances();
    const dropzoneElm = grid.getTopHeaderPanel() || grid.getPreHeaderPanel();
    const draggablePlaceholderElm = dropzoneElm.querySelector<HTMLDivElement>('.slick-draggable-dropzone-placeholder');
    const groupTogglerElm = dropzoneElm.querySelector<HTMLDivElement>('.slick-group-toggle-all');

    const leftHeaderEl = this.gridContainer.querySelector(
      `.${grid.getUID()} .slick-header-columns.slick-header-columns-left`
    ) as HTMLDivElement;
    const rightHeaderEl = this.gridContainer.querySelector(
      `.${grid.getUID()} .slick-header-columns.slick-header-columns-right`
    ) as HTMLDivElement;

    const getColumnIds = (parent: HTMLElement): string[] =>
      Array.from(parent.children)
        .filter((el) => (el as HTMLElement).classList.contains('slick-header-column'))
        .map((el) => (el as HTMLElement).dataset.id ?? '')
        .filter(Boolean);

    const reorderHeaderChildren = (parent: HTMLElement, values: string[]) => {
      const allChildren = Array.from(parent.children) as HTMLElement[];
      const draggableChildren = allChildren.filter((elm) => elm.classList.contains('slick-header-column'));
      const draggableById = new Map(draggableChildren.map((elm) => [elm.dataset.id ?? '', elm]));

      let dragIdx = 0;
      const reorderedChildren = allChildren.map((elm) => {
        if (!elm.classList.contains('slick-header-column')) {
          return elm;
        }
        const nextId = values[dragIdx++];
        return draggableById.get(nextId) ?? elm;
      });

      for (const child of reorderedChildren) {
        parent.appendChild(child);
      }
    };

    let reorderedIdsLeft: string[] = getColumnIds(leftHeaderEl);
    let reorderedIdsRight: string[] = getColumnIds(rightHeaderEl);

    const dndConfig: Partial<ParentConfig<string>> = {
      group: `headers-${grid.getUID()}`,
      draggingClass: 'slick-header-column-active',
      dragPlaceholderClass: 'slick-sortable-placeholder',
      draggable: (el) => el.classList.contains('slick-header-column'),
      onDragstart: () => {
        if (draggablePlaceholderElm) {
          draggablePlaceholderElm.style.display = 'inline-block';
        }
        const droppedGroupingElms = dropzoneElm.querySelectorAll<HTMLDivElement>('.slick-dropped-grouping');
        droppedGroupingElms.forEach((droppedGroupingElm) => (droppedGroupingElm.style.display = 'none'));
        if (groupTogglerElm) {
          groupTogglerElm.style.display = 'none';
        }
      },
      onDragend: () => {
        dropzoneElm?.classList.remove('slick-dropzone-hover');
        draggablePlaceholderElm?.parentElement?.classList.remove('slick-dropzone-placeholder-hover');

        const droppedGroupingElms = dropzoneElm.querySelectorAll<HTMLDivElement>('.slick-dropped-grouping');
        droppedGroupingElms.forEach((droppedGroupingElm) => (droppedGroupingElm.style.display = 'flex'));

        if (droppedGroupingElms.length) {
          if (draggablePlaceholderElm) {
            draggablePlaceholderElm.style.display = 'none';
          }
          if (groupTogglerElm) {
            groupTogglerElm.style.display = 'inline-flex';
          }
        }

        if (!grid.getEditorLock().commitCurrentEdit()) {
          return;
        }

        // read final column order from reorderedIds (updated by setValues when formkit detects a sort/transfer)
        const reorderedIds = reorderedIdsLeft;

        // when frozen columns are used, headers has more than one entry and we need the ids from all of them.
        if (headers.length > 1) {
          for (const id of reorderedIdsRight) {
            reorderedIds.push(id);
          }
        }

        const finalReorderedColumns: Column[] = [];
        const reorderedColumns = grid.getColumns();
        for (const reorderedId of reorderedIds) {
          finalReorderedColumns.push(reorderedColumns[getColumnIndex.call(grid, reorderedId)]);
        }
        setColumns.call(grid, finalReorderedColumns);
        trigger.call(grid, grid.onColumnsReordered, { grid, impactedColumns: finalReorderedColumns });
        setupColumnResize.call(grid);
      },
    };

    this.ensureWindowAbortSignal(leftHeaderEl);
    dragAndDrop<string>({
      parent: leftHeaderEl,
      getValues: () => reorderedIdsLeft,
      setValues: (values) => {
        reorderedIdsLeft = values;
        reorderHeaderChildren(leftHeaderEl, values);
      },
      config: dndConfig,
    });
    this.ensureWindowAbortSignal(rightHeaderEl);
    dragAndDrop<string>({
      parent: rightHeaderEl,
      getValues: () => reorderedIdsRight,
      setValues: (values) => {
        reorderedIdsRight = values;
        reorderHeaderChildren(rightHeaderEl, values);
      },
      config: dndConfig,
    });
    this._sortableLeftParent = leftHeaderEl;
    this._sortableRightParent = rightHeaderEl;

    // Track the dragged column ID via native drag events so the dropzone can handle the drop.
    // @formkit/drag-and-drop doesn't support "clone on pull" cross-list behaviour, so the header →
    // dropzone interaction is handled by native drag events wired in setupColumnDropbox().
    // Use capture phase so we fire before formkit's node-level dragstart handler (which may stop propagation).
    const trackDragStart = (e: DragEvent) => {
      const target = (e.target as HTMLElement).closest('.slick-header-column') as HTMLElement | null;
      this._draggedColumnId = target?.dataset.id ?? null;
    };
    const clearDraggedColumn = () => {
      this._draggedColumnId = null;
    };
    this._bindingEventService.bind(leftHeaderEl, 'dragstart', trackDragStart as EventListener, { capture: true }, 'colreorder');
    this._bindingEventService.bind(leftHeaderEl, 'dragend', clearDraggedColumn as EventListener, { capture: true }, 'colreorder');
    this._bindingEventService.bind(rightHeaderEl, 'dragstart', trackDragStart as EventListener, { capture: true }, 'colreorder');
    this._bindingEventService.bind(rightHeaderEl, 'dragend', clearDraggedColumn as EventListener, { capture: true }, 'colreorder');

    // user can optionally provide initial groupBy columns
    const initialGroupIds = this._addonOptions.initialGroupBy ?? this.gridOptions.presets?.grouping;
    if (initialGroupIds && !this._isInitialized) {
      this.setDroppedGroups(initialGroupIds);
    }
    this._isInitialized = true;

    return {
      sortableLeftParent: this._sortableLeftParent,
      sortableRightParent: this._sortableRightParent,
    };
  }

  //
  // protected functions
  // ------------------

  protected addColumnGroupBy(column: Column): void {
    this.columnsGroupBy.push(column);
    this.updateGroupBy('add-group');
  }

  protected addGroupByRemoveClickHandler(
    id: string | number,
    groupRemoveIconElm: HTMLDivElement,
    headerColumnElm: HTMLDivElement,
    entry: any
  ): void {
    this._bindingEventService.bind(groupRemoveIconElm, 'click', () => {
      const boundedElms = this._bindingEventService.boundedEvents.filter(
        (boundedEvent: any) => boundedEvent.element === groupRemoveIconElm
      );
      for (const boundedEvent of boundedElms) {
        this._bindingEventService.unbind(boundedEvent.element, 'click', boundedEvent.listener);
      }
      this.removeGroupBy(id, headerColumnElm, entry);
    });
  }

  protected addGroupSortClickHandler(col: Column, groupSortContainerElm: HTMLDivElement): void {
    const { grouping, type } = col;
    this._bindingEventService.bind(groupSortContainerElm, 'click', () => {
      // group sorting requires all group to be opened, make sure that the Toggle All is also expanded
      this.toggleGroupAll(col, false);

      if (grouping) {
        const nextSortDirection = grouping.sortAsc ? SortDirectionNumber.desc : SortDirectionNumber.asc;
        grouping.comparer = (a, b) => sortByFieldType(type || 'text', a.value, b.value, nextSortDirection, col, this.gridOptions);
        this.getGroupBySortIcon(groupSortContainerElm, !grouping.sortAsc);
        this.updateGroupBy('sort-group');
        grouping.sortAsc = !grouping.sortAsc;
        this.grid.invalidate();
      }
    });
  }

  protected getGroupBySortIcon(groupSortContainerElm: HTMLDivElement, sortAsc = true): void {
    if (sortAsc) {
      // ascending icon
      if (this._addonOptions.sortAscIconCssClass) {
        groupSortContainerElm.classList.remove(...classNameToList(this._addonOptions.sortDescIconCssClass));
        groupSortContainerElm.classList.add(...classNameToList(this._addonOptions.sortAscIconCssClass));
      } else {
        groupSortContainerElm.classList.add('slick-groupby-sort-asc-icon');
        groupSortContainerElm.classList.remove('slick-groupby-sort-desc-icon');
      }
    } else {
      // descending icon
      if (this._addonOptions.sortDescIconCssClass) {
        groupSortContainerElm.classList.remove(...classNameToList(this._addonOptions.sortAscIconCssClass));
        groupSortContainerElm.classList.add(...classNameToList(this._addonOptions.sortDescIconCssClass));
      } else {
        if (!this._addonOptions.sortDescIconCssClass) {
          groupSortContainerElm.classList.add('slick-groupby-sort-desc-icon');
          groupSortContainerElm.classList.remove('slick-groupby-sort-asc-icon');
        }
      }
    }
  }

  protected handleGroupByDrop(containerElm: HTMLDivElement, headerColumnElm: HTMLDivElement): void {
    const columnId = headerColumnElm.getAttribute('data-id')?.replace(this._gridUid, '');
    let columnAllowed = true;
    for (const colGroupBy of this.columnsGroupBy) {
      if (colGroupBy.id === columnId) {
        columnAllowed = false;
      }
    }

    if (columnAllowed) {
      for (const col of this._gridColumns) {
        if (col.id === columnId && col.grouping && !isEmptyObject(col.grouping)) {
          const columnNameElm = headerColumnElm.querySelector('.slick-column-name');
          const entryElm = createDomElement('div', {
            id: `${this._gridUid}_${col.id}_entry`,
            className: 'slick-dropped-grouping',
            dataset: { id: `${col.id}` },
          });
          createDomElement(
            'div',
            {
              className: 'slick-dropped-grouping-title',
              style: { display: 'inline-flex' },
              textContent: columnNameElm ? columnNameElm.textContent : headerColumnElm.textContent,
            },
            entryElm
          );

          // delete icon
          const groupRemoveIconElm = createDomElement('div', { className: 'slick-groupby-remove' });
          if (this._addonOptions.deleteIconCssClass) {
            groupRemoveIconElm.classList.add(...classNameToList(this._addonOptions.deleteIconCssClass));
          }
          if (!this._addonOptions.deleteIconCssClass) {
            groupRemoveIconElm.classList.add('slick-groupby-remove-icon');
          }

          // sorting icons when enabled
          let groupSortContainerElm: HTMLDivElement | undefined;
          if (this._addonOptions?.hideGroupSortIcons !== true && col.sortable) {
            if (col.grouping?.sortAsc === undefined) {
              col.grouping.sortAsc = true;
            }
            groupSortContainerElm = createDomElement('div', { className: 'slick-groupby-sort' }, entryElm);
            this.getGroupBySortIcon(groupSortContainerElm, col.grouping.sortAsc);
          }

          entryElm.appendChild(groupRemoveIconElm);
          entryElm.appendChild(document.createElement('div'));
          containerElm.appendChild(entryElm);

          // if we're grouping by only 1 group, at the root, we'll analyze Toggle All and add collapsed/expanded class
          if (this._groupToggler && this.columnsGroupBy.length === 0) {
            this.toggleGroupAll(col);
          }

          this.addColumnGroupBy(col);
          this.addGroupByRemoveClickHandler(col.id, groupRemoveIconElm, headerColumnElm, entryElm);

          // when Sorting group is enabled, let's add all handlers
          if (groupSortContainerElm) {
            this.addGroupSortClickHandler(col, groupSortContainerElm);
          }
        }
      }

      // show the "Toggle All" when feature is enabled
      if (this._groupToggler && this.columnsGroupBy.length > 0) {
        this._groupToggler.style.display = 'inline-flex';
      }
    }
  }

  protected toggleGroupAll({ grouping }: Column, collapsed?: boolean): void {
    const togglerIcon = this._groupToggler?.querySelector<HTMLSpanElement>('.slick-group-toggle-all-icon');
    const isCollapsed = collapsed === true || grouping?.collapsed;
    togglerIcon?.classList.toggle('collapsed', isCollapsed);
    togglerIcon?.classList.toggle('expanded', !isCollapsed);
  }

  protected removeFromArray(arrayToModify: any[], itemToRemove: any): any[] {
    if (Array.isArray(arrayToModify)) {
      const itemIdx = arrayToModify.findIndex((a) => a.id === itemToRemove.id);
      if (itemIdx >= 0) {
        arrayToModify.splice(itemIdx, 1);
      }
    }
    return arrayToModify;
  }

  protected removeGroupBy(id: string | number, _hdrColumnElm: HTMLDivElement, entry: any): void {
    entry.remove();
    const groupByColumns: Column[] = [];
    this._gridColumns.forEach((col) => (groupByColumns[col.id as number] = col));
    this.removeFromArray(this.columnsGroupBy, groupByColumns[id as any]);
    if (this.columnsGroupBy.length === 0) {
      // show placeholder text & hide the "Toggle All" when that later feature is enabled
      this._dropzonePlaceholderElm.style.display = 'inline-block';
      if (this._groupToggler) {
        this._groupToggler.style.display = 'none';
      }
    }
    this.updateGroupBy('remove-group');
    // notify formkit that a chip was removed so its node tracking stays in sync
    if (this._droppableParent) {
      remapNodes(this._droppableParent);
    }
  }

  protected addDragOverDropzoneListeners(): void {
    const draggablePlaceholderElm = this._dropzoneElm.querySelector('.slick-draggable-dropzone-placeholder');

    if (draggablePlaceholderElm && this._dropzoneElm) {
      this._bindingEventService.bind(draggablePlaceholderElm, 'dragover', (e: Event) => e.preventDefault());
      this._bindingEventService.bind(draggablePlaceholderElm, 'dragenter', () => this._dropzoneElm.classList.add('slick-dropzone-hover'));
      this._bindingEventService.bind(draggablePlaceholderElm, 'dragleave', () =>
        this._dropzoneElm.classList.remove('slick-dropzone-hover')
      );
    }
  }

  protected setupColumnDropbox(): void {
    const dropzoneElm = this._dropzoneElm;

    // Use @formkit/drag-and-drop for within-dropzone sorting
    const getDroppedGroupIds = (): string[] => this.columnsGroupBy.map((c) => String(c.id));

    this.ensureWindowAbortSignal(dropzoneElm);

    dragAndDrop<string>({
      parent: dropzoneElm,
      getValues: getDroppedGroupIds,
      setValues: (values) => {
        // Keep chip DOM order in sync with state order in vanilla DOM mode.
        const droppedGroupElms = Array.from(dropzoneElm.querySelectorAll<HTMLDivElement>('.slick-dropped-grouping'));
        for (const id of values) {
          const targetElm = droppedGroupElms.find((elm) => elm.dataset.id === id);
          if (targetElm) {
            dropzoneElm.appendChild(targetElm);
          }
        }

        // reorder columnsGroupBy to match the new DOM order
        const newGroupingOrder: Column[] = [];
        for (const id of values) {
          const col = this.columnsGroupBy.find((c) => String(c.id) === id);
          if (col) newGroupingOrder.push(col);
        }
        this.columnsGroupBy = newGroupingOrder;
        this.updateGroupBy('sort-group');
      },
      config: {
        group: `dropzone-${this._gridUid}`,
        draggable: (el) => el.classList.contains('slick-dropped-grouping'),
        sortable: true,
        dropZoneClass: 'slick-droppable-sortitem-hover',
      },
    });
    this._droppableParent = dropzoneElm;

    // Handle header → dropzone drag via native drag events.
    // We track the dragged column ID on native dragstart and handle the drop ourselves,
    // since @formkit/drag-and-drop doesn't support "clone on pull" cross-list behaviour.
    this._bindingEventService.bind(
      dropzoneElm,
      'dragover',
      ((e: DragEvent) => {
        if (this._draggedColumnId) {
          e.preventDefault();
          e.stopPropagation();
          dropzoneElm.classList.add('slick-dropzone-hover');
        }
      }) as EventListener,
      { capture: true }
    );

    this._bindingEventService.bind(dropzoneElm, 'dragleave', (() => {
      dropzoneElm.classList.remove('slick-dropzone-hover');
    }) as EventListener);

    this._bindingEventService.bind(
      dropzoneElm,
      'drop',
      ((e: DragEvent) => {
        if (this._draggedColumnId) {
          e.preventDefault();
          e.stopImmediatePropagation();
          dropzoneElm.classList.remove('slick-dropzone-hover');
          const columnElm = this.grid.getHeaderColumn(this._draggedColumnId);
          if (columnElm) {
            this.handleGroupByDrop(dropzoneElm, columnElm);
            // notify formkit that new chips were added so they become draggable for within-dropzone sorting
            if (this._droppableParent) {
              remapNodes(this._droppableParent);
            }
          }
          this._draggedColumnId = null;
        }
      }) as EventListener,
      { capture: true }
    );

    this.addDragOverDropzoneListeners();

    if (this._groupToggler) {
      this._bindingEventService.bind(this._groupToggler, 'click', ((event: DOMMouseOrTouchEvent<HTMLDivElement>) => {
        // prettier-ignore
        const target = event.target.classList.contains('slick-group-toggle-all-icon') ? event.target : event.currentTarget.querySelector('.slick-group-toggle-all-icon');
        this.toggleGroupToggler(target, target?.classList.contains('expanded'));
      }) as EventListener);
    }
  }

  protected toggleGroupToggler(targetElm: Element | null, collapsing = true, shouldExecuteDataViewCommand = true): void {
    if (targetElm) {
      const isCollapsing = collapsing === true;
      targetElm.classList.toggle('collapsed', isCollapsing);
      targetElm.classList.toggle('expanded', !isCollapsing);
      if (shouldExecuteDataViewCommand) {
        isCollapsing ? this.dataView.collapseAllGroups() : this.dataView.expandAllGroups();
      }
    }
  }

  protected updateGroupBy(originator: string): void {
    if (this.columnsGroupBy.length === 0) {
      this.dataView.setGrouping([]);
      this._dropzonePlaceholderElm.style.display = 'inline-block';
      this.triggerOnGroupChangedEvent({ caller: originator, groupColumns: [] });
      return;
    }
    const groupingArray: Grouping<any>[] = [];
    this.columnsGroupBy.forEach((element) => groupingArray.push(element.grouping!));
    this.dataView.setGrouping(groupingArray);
    this._dropzonePlaceholderElm.style.display = 'none';
    this.triggerOnGroupChangedEvent({ caller: originator, groupColumns: groupingArray });
  }

  /** call notify on slickgrid event and execute onGroupChanged callback when defined as a function by the user */
  protected triggerOnGroupChangedEvent(args: { caller?: string; groupColumns: Grouping[] }): void {
    if (this._addonOptions && typeof this._addonOptions.onGroupChanged === 'function') {
      this._addonOptions.onGroupChanged(new SlickEventData(), args);
    }
    this.onGroupChanged.notify(args);
  }
}
