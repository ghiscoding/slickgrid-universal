import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService, EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { isEmptyObject } from '@slickgrid-universal/utils';
import Sortable, { type Options as SortableOptions, type SortableEvent } from 'sortablejs';

import type { ExtensionUtility } from '../extensions/extensionUtility';
import { SortDirectionNumber } from '../enums/index';
import type {
  Column,
  DOMMouseOrTouchEvent,
  DraggableGrouping,
  DraggableGroupingOption,
  GridOption,
  Grouping,
  GroupingGetterFunction,
} from '../interfaces/index';
import type { SharedService } from '../services/shared.service';
import { createDomElement, emptyElement } from '../services/domUtilities';
import { sortByFieldType } from '../sortComparers';
import { type SlickDataView, SlickEvent, SlickEventData, SlickEventHandler, type SlickGrid } from '../core/index';

/**
 *
 * Draggable Grouping contributed by:  Muthukumar Selconstasu
 *  muthukumar{dot}se{at}gmail{dot}com
 *  github.com/muthukumarse/Slickgrid
 *
 * NOTES:
 *     This plugin provides the Draggable Grouping feature
 *
 * A plugin to add drop-down menus to column headers.
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.columnDefinitions = [{
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
  pluginName: 'DraggableGrouping' = 'DraggableGrouping' as const;

  protected _addonOptions!: DraggableGrouping;
  protected _bindingEventService: BindingEventService;
  protected _droppableInstance?: Sortable;
  protected _dropzoneElm!: HTMLDivElement;
  protected _dropzonePlaceholderElm!: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _grid?: SlickGrid;
  protected _gridColumns: Column[] = [];
  protected _gridUid = '';
  protected _groupToggler?: HTMLDivElement;
  protected _reorderedColumns: Column[] = [];
  protected _sortableLeftInstance?: Sortable;
  protected _sortableRightInstance?: Sortable;
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
    protected readonly sharedService: SharedService,
  ) {
    this._bindingEventService = new BindingEventService();
    this._eventHandler = new SlickEventHandler();
    this.onGroupChanged = new SlickEvent<{ caller?: string; groupColumns: Grouping[]; }>();
  }

  get addonOptions(): DraggableGroupingOption {
    return this._addonOptions;
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView {
    return this.grid?.getData<SlickDataView>() ?? {};
  }

  get dropboxElement() {
    return this._dropzoneElm;
  }

  get droppableInstance() {
    return this._droppableInstance;
  }

  get sortableLeftInstance() {
    return this._sortableLeftInstance;
  }

  get sortableRightInstance() {
    return this._sortableRightInstance;
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

  get gridContainer() {
    return this.grid.getContainerNode();
  }

  /** Initialize plugin. */
  init(grid: SlickGrid, groupingOptions?: DraggableGrouping) {
    this._addonOptions = { ...this._defaults, ...groupingOptions };
    this._grid = grid;
    if (grid) {
      this._gridUid = grid.getUID();
      this._gridColumns = grid.getColumns();
      this._dropzoneElm = grid.getPreHeaderPanel();
      this._dropzoneElm.classList.add('slick-dropzone');

      // add optional group "Toggle All" with its button & text when provided
      if (!this._addonOptions.hideToggleAllButton) {
        this._groupToggler = createDomElement('div', {
          className: 'slick-group-toggle-all',
          title: this._addonOptions.toggleAllPlaceholderText ?? '',
          style: { display: 'none' },
        });
        const groupTogglerIconElm = createDomElement('span', { className: 'slick-group-toggle-all-icon' }, this._groupToggler);

        if (this.gridOptions.enableTranslate && this._addonOptions.toggleAllButtonTextKey) {
          this._addonOptions.toggleAllButtonText = this.extensionUtility.translateWhenEnabledAndServiceExist(this._addonOptions.toggleAllButtonTextKey, 'TEXT_TOGGLE_ALL_GROUPS');
        }
        if (this.gridOptions.enableTranslate && this._addonOptions.toggleAllPlaceholderTextKey) {
          this._addonOptions.toggleAllPlaceholderText = this.extensionUtility.translateWhenEnabledAndServiceExist(this._addonOptions.toggleAllPlaceholderTextKey, 'TEXT_TOGGLE_ALL_GROUPS');
        }
        this._groupToggler.title = this._addonOptions.toggleAllPlaceholderText ?? '';

        if (this._addonOptions.toggleAllButtonText) {
          this._groupToggler.appendChild(
            createDomElement('span', {
              className: 'slick-group-toggle-all-text',
              textContent: this._addonOptions.toggleAllButtonText || ''
            })
          );
        }
        this._dropzoneElm.appendChild(this._groupToggler);

        // when calling Expand/Collapse All Groups from Context Menu, we also need to inform this plugin as well of the action
        this._subscriptions.push(
          this.pubSubService.subscribe('onContextMenuCollapseAllGroups', () => this.toggleGroupToggler(groupTogglerIconElm, true, false)),
          this.pubSubService.subscribe('onContextMenuExpandAllGroups', () => this.toggleGroupToggler(groupTogglerIconElm, false, false)),
        );
      }

      this._dropzonePlaceholderElm = createDomElement('div', { className: 'slick-draggable-dropzone-placeholder' }, this._dropzoneElm);
      if (this.gridOptions.enableTranslate && this._addonOptions?.dropPlaceHolderTextKey) {
        this._addonOptions.dropPlaceHolderText = this.extensionUtility.translateWhenEnabledAndServiceExist(this._addonOptions.dropPlaceHolderTextKey, 'TEXT_TOGGLE_ALL_GROUPS');
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
              groupableIconElm.classList.add(...this._addonOptions.groupIconCssClass.split(' '));
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
  dispose() {
    this.destroySortableInstances();
    if (this._droppableInstance?.el) {
      this._droppableInstance?.destroy();
    }
    this.onGroupChanged.unsubscribe();
    this._eventHandler.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);
    this._bindingEventService.unbindAll();
    emptyElement(this.gridContainer.querySelector(`.${this.gridUid} .slick-preheader-panel`));
  }

  clearDroppedGroups() {
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

  destroySortableInstances() {
    if (this._sortableLeftInstance?.el) {
      this._sortableLeftInstance?.destroy();
    }
    if (this._sortableRightInstance?.el) {
      this._sortableRightInstance?.destroy();
    }
  }

  setAddonOptions(options: Partial<DraggableGroupingOption>) {
    this._addonOptions = { ...this._addonOptions, ...options };
  }

  setColumns(cols: Column[]) {
    this._gridColumns = cols;
  }

  setDroppedGroups(groupingInfo: Array<string | GroupingGetterFunction> | string) {
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
  setupColumnReorder(grid: SlickGrid, headers: any, _headerColumnWidthDiff: any, setColumns: (columns: Column[]) => void, setupColumnResize: () => void, _columns: Column[], getColumnIndex: (columnId: string) => number, _uid: string, trigger: (slickEvent: SlickEvent, data?: any) => void) {
    this.destroySortableInstances();
    const dropzoneElm = grid.getPreHeaderPanel();
    const draggablePlaceholderElm = dropzoneElm.querySelector<HTMLDivElement>('.slick-draggable-dropzone-placeholder');
    const groupTogglerElm = dropzoneElm.querySelector<HTMLDivElement>('.slick-group-toggle-all');

    const sortableOptions = {
      animation: 50,
      chosenClass: 'slick-header-column-active',
      ghostClass: 'slick-sortable-placeholder',
      draggable: '.slick-header-column',
      dataIdAttr: 'data-id',
      group: {
        name: 'shared',
        pull: 'clone',
        put: false,
      },
      revertClone: true,
      // filter: function (_e, target) {
      //   // block column from being able to be dragged if it's already a grouped column
      //   // NOTE: need to disable for now since it also blocks the column reordering
      //   return columnsGroupBy.some(c => c.id === target.getAttribute('data-id'));
      // },
      onStart: () => {
        if (draggablePlaceholderElm) {
          draggablePlaceholderElm.style.display = 'inline-block';
        }
        const droppedGroupingElms = dropzoneElm.querySelectorAll<HTMLDivElement>('.slick-dropped-grouping');
        droppedGroupingElms.forEach(droppedGroupingElm => droppedGroupingElm.style.display = 'none');
        if (groupTogglerElm) {
          groupTogglerElm.style.display = 'none';
        }
      },
      onEnd: (e: Event & { item: any; clone: HTMLElement; }) => {
        dropzoneElm?.classList.remove('slick-dropzone-hover');
        draggablePlaceholderElm?.parentElement?.classList.remove('slick-dropzone-placeholder-hover');

        const droppedGroupingElms = dropzoneElm.querySelectorAll<HTMLDivElement>('.slick-dropped-grouping');
        droppedGroupingElms.forEach(droppedGroupingElm => droppedGroupingElm.style.display = 'flex');

        if (droppedGroupingElms.length) {
          if (draggablePlaceholderElm) {
            draggablePlaceholderElm.style.display = 'none';
          }
          if (groupTogglerElm) {
            groupTogglerElm.style.display = 'inline-block';
          }
        }

        if (!grid.getEditorLock().commitCurrentEdit()) {
          return;
        }

        const reorderedIds = this.sortableLeftInstance?.toArray() ?? [];

        // when frozen columns are used, headers has more than one entry and we need the ids from all of them.
        // though there is only really a left and right header, this will work even if that should change.
        if (headers.length > 1) {
          const ids = this._sortableRightInstance?.toArray() ?? [];

          // Note: the loop below could be simplified with:
          // reorderedIds.push.apply(reorderedIds,ids);
          // However, the loop is more in keeping with way-backward compatibility
          for (const id of ids) {
            reorderedIds.push(id);
          }
        }

        const finalReorderedColumns: Column[] = [];
        const reorderedColumns = grid.getColumns();
        for (const reorderedId of reorderedIds) {
          finalReorderedColumns.push(reorderedColumns[getColumnIndex.call(grid, reorderedId)]);
        }
        setColumns.call(grid, finalReorderedColumns);
        trigger.call(grid, grid.onColumnsReordered, { grid });
        e.stopPropagation();
        setupColumnResize.call(grid);
      }
    } as SortableOptions;

    this._sortableLeftInstance = Sortable.create(this.gridContainer.querySelector(`.${grid.getUID()} .slick-header-columns.slick-header-columns-left`) as HTMLDivElement, sortableOptions) as Sortable;
    this._sortableRightInstance = Sortable.create(this.gridContainer.querySelector(`.${grid.getUID()} .slick-header-columns.slick-header-columns-right`) as HTMLDivElement, sortableOptions) as Sortable;

    return {
      sortableLeftInstance: this._sortableLeftInstance,
      sortableRightInstance: this._sortableRightInstance
    };
  }

  //
  // protected functions
  // ------------------

  protected addColumnGroupBy(column: Column) {
    this.columnsGroupBy.push(column);
    this.updateGroupBy('add-group');
  }

  protected addGroupByRemoveClickHandler(id: string | number, groupRemoveIconElm: HTMLDivElement, headerColumnElm: HTMLDivElement, entry: any) {
    this._bindingEventService.bind(groupRemoveIconElm, 'click', () => {
      const boundedElms = this._bindingEventService.boundedEvents.filter(boundedEvent => boundedEvent.element === groupRemoveIconElm);
      for (const boundedEvent of boundedElms) {
        this._bindingEventService.unbind(boundedEvent.element, 'click', boundedEvent.listener);
      }
      this.removeGroupBy(id, headerColumnElm, entry);
    });
  }

  protected addGroupSortClickHandler(col: Column, groupSortContainerElm: HTMLDivElement) {
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

  protected getGroupBySortIcon(groupSortContainerElm: HTMLDivElement, sortAsc = true) {
    if (sortAsc) {
      // ascending icon
      if (this._addonOptions.sortAscIconCssClass) {
        groupSortContainerElm.classList.remove(...this._addonOptions.sortDescIconCssClass?.split(' ') ?? '');
        groupSortContainerElm.classList.add(...this._addonOptions.sortAscIconCssClass.split(' '));
      } else {
        groupSortContainerElm.classList.add('slick-groupby-sort-asc-icon');
        groupSortContainerElm.classList.remove('slick-groupby-sort-desc-icon');
      }
    } else {
      // descending icon
      if (this._addonOptions.sortDescIconCssClass) {
        groupSortContainerElm.classList.remove(...this._addonOptions.sortAscIconCssClass?.split(' ') ?? '');
        groupSortContainerElm.classList.add(...this._addonOptions.sortDescIconCssClass.split(' '));
      } else {
        if (!this._addonOptions.sortDescIconCssClass) {
          groupSortContainerElm.classList.add('slick-groupby-sort-desc-icon');
          groupSortContainerElm.classList.remove('slick-groupby-sort-asc-icon');
        }
      }
    }
  }

  protected handleGroupByDrop(containerElm: HTMLDivElement, headerColumnElm: HTMLDivElement) {
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
            dataset: { id: `${col.id}` }
          });
          createDomElement('div', {
            className: 'slick-dropped-grouping-title',
            style: { display: 'inline-flex' },
            textContent: columnNameElm ? columnNameElm.textContent : headerColumnElm.textContent,
          }, entryElm);

          // delete icon
          const groupRemoveIconElm = createDomElement('div', { className: 'slick-groupby-remove' });
          if (this._addonOptions.deleteIconCssClass) {
            groupRemoveIconElm.classList.add(...this._addonOptions.deleteIconCssClass.split(' '));
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
        this._groupToggler.style.display = 'inline-block';
      }
    }
  }

  protected toggleGroupAll({ grouping }: Column, collapsed?: boolean) {
    const togglerIcon = this._groupToggler?.querySelector<HTMLSpanElement>('.slick-group-toggle-all-icon');
    if (collapsed === true || grouping?.collapsed) {
      togglerIcon?.classList.add('collapsed');
      togglerIcon?.classList.remove('expanded');
    } else {
      togglerIcon?.classList.add('expanded');
      togglerIcon?.classList.remove('collapsed');
    }
  }

  protected removeFromArray(arrayToModify: any[], itemToRemove: any) {
    if (Array.isArray(arrayToModify)) {
      const itemIdx = arrayToModify.findIndex(a => a.id === itemToRemove.id);
      if (itemIdx >= 0) {
        arrayToModify.splice(itemIdx, 1);
      }
    }
    return arrayToModify;
  }

  protected removeGroupBy(id: string | number, _hdrColumnElm: HTMLDivElement, entry: any) {
    entry.remove();
    const groupByColumns: Column[] = [];
    this._gridColumns.forEach(col => groupByColumns[col.id as number] = col);
    this.removeFromArray(this.columnsGroupBy, groupByColumns[id as any]);
    if (this.columnsGroupBy.length === 0) {
      // show placeholder text & hide the "Toggle All" when that later feature is enabled
      this._dropzonePlaceholderElm.style.display = 'inline-block';
      if (this._groupToggler) {
        this._groupToggler.style.display = 'none';
      }
    }
    this.updateGroupBy('remove-group');
  }

  protected addDragOverDropzoneListeners() {
    const draggablePlaceholderElm = this._dropzoneElm.querySelector('.slick-draggable-dropzone-placeholder');

    if (draggablePlaceholderElm && this._dropzoneElm) {
      this._bindingEventService.bind(draggablePlaceholderElm, 'dragover', (e) => e.preventDefault());
      this._bindingEventService.bind(draggablePlaceholderElm, 'dragenter', () => this._dropzoneElm.classList.add('slick-dropzone-hover'));
      this._bindingEventService.bind(draggablePlaceholderElm, 'dragleave', () => this._dropzoneElm.classList.remove('slick-dropzone-hover'));
    }
  }

  protected setupColumnDropbox() {
    const dropzoneElm = this._dropzoneElm;

    this._droppableInstance = Sortable.create(dropzoneElm, {
      group: 'shared',
      ghostClass: 'slick-droppable-sortitem-hover',
      draggable: '.slick-dropped-grouping',
      dragoverBubble: true,
      onAdd: (evt: SortableEvent) => {
        const el = evt.item;
        if (el.getAttribute('id')?.replace(this._gridUid, '')) {
          this.handleGroupByDrop(dropzoneElm, (Sortable.utils as any).clone(evt.item));
        }
        el.parentNode?.removeChild(el);
      },
      onUpdate: () => {
        const sortArray = this._droppableInstance?.toArray() ?? [];
        const newGroupingOrder: Column[] = [];
        for (const sortGroupId of sortArray) {
          for (const groupByColumn of this.columnsGroupBy) {
            if (groupByColumn.id === sortGroupId) {
              newGroupingOrder.push(groupByColumn);
              break;
            }
          }
        }
        this.columnsGroupBy = newGroupingOrder;
        this.updateGroupBy('sort-group');
      },
    });

    // Sortable doesn't have onOver, we need to implement it ourselves
    this.addDragOverDropzoneListeners();

    if (this._groupToggler) {
      this._bindingEventService.bind(this._groupToggler, 'click', ((event: DOMMouseOrTouchEvent<HTMLDivElement>) => {
        const target = event.target.classList.contains('slick-group-toggle-all-icon') ? event.target : event.currentTarget.querySelector('.slick-group-toggle-all-icon');
        this.toggleGroupToggler(target, target?.classList.contains('expanded'));
      }) as EventListener);
    }
  }

  protected toggleGroupToggler(targetElm: Element | null, collapsing = true, shouldExecuteDataViewCommand = true) {
    if (targetElm) {
      if (collapsing === true) {
        targetElm.classList.add('collapsed');
        targetElm.classList.remove('expanded');
        if (shouldExecuteDataViewCommand) {
          this.dataView.collapseAllGroups();
        }
      } else {
        targetElm.classList.remove('collapsed');
        targetElm.classList.add('expanded');
        if (shouldExecuteDataViewCommand) {
          this.dataView.expandAllGroups();
        }
      }
    }
  }

  protected updateGroupBy(originator: string) {
    if (this.columnsGroupBy.length === 0) {
      this.dataView.setGrouping([]);
      this._dropzonePlaceholderElm.style.display = 'inline-block';
      this.triggerOnGroupChangedEvent({ caller: originator, groupColumns: [] });
      return;
    }
    const groupingArray: Grouping<any>[] = [];
    this.columnsGroupBy.forEach(element => groupingArray.push(element.grouping!));
    this.dataView.setGrouping(groupingArray);
    this._dropzonePlaceholderElm.style.display = 'none';
    this.triggerOnGroupChangedEvent({ caller: originator, groupColumns: groupingArray });
  }

  /** call notify on slickgrid event and execute onGroupChanged callback when defined as a function by the user */
  protected triggerOnGroupChangedEvent(args: { caller?: string; groupColumns: Grouping[]; }) {
    if (this._addonOptions && typeof this._addonOptions.onGroupChanged === 'function') {
      this._addonOptions.onGroupChanged(new SlickEventData(), args);
    }
    this.onGroupChanged.notify(args);
  }
}
