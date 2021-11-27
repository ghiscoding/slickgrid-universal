import { ExtensionUtility } from '../extensions/extensionUtility';
import {
  Column,
  DOMMouseEvent,
  DraggableGrouping,
  DraggableGroupingOption,
  EventSubscription,
  GridOption,
  Grouping,
  GroupingGetterFunction,
  HtmlElementPosition,
  SlickDataView,
  SlickEvent,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { BindingEventService } from '../services/bindingEvent.service';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { createDomElement, emptyElement } from '../services/domUtilities';
import { isEmptyObject } from '../services/utilities';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export interface JQueryUiDraggableOption {
  draggable: any;
  helper: any;
  originalPosition: { left: number; top: number; };
  placeholder?: string;
  position?: HtmlElementPosition;
  sender?: any;
  offset?: HtmlElementPosition;
}

export interface JQueryUiSortableOptions {
  distance?: number;
  cursor?: string;
  tolerance?: string;
  helper?: string;
  placeholder?: string;
  forcePlaceholderSize?: boolean;
  appendTo?: string;
  start?: (e: Event, ui: JQueryUiDraggableOption) => void;
  beforeStop?: (e: Event, ui: JQueryUiDraggableOption) => void;
  stop?: (e: any) => void;
}

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
  protected _addonOptions!: DraggableGroupingOption;
  protected _bindEventService: BindingEventService;
  protected _droppableInstance: any;
  protected _dropboxElm!: HTMLDivElement;
  protected _dropboxPlaceholderElm!: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _grid?: SlickGrid;
  protected _gridColumns: Column[] = [];
  protected _gridUid = '';
  protected _groupToggler!: HTMLDivElement;
  protected _sortableInstance: any;
  protected _subscriptions: EventSubscription[] = [];
  protected _defaults = {
    dropPlaceHolderText: 'Drop a column header here to group by the column',
    hideToggleAllButton: false,
    toggleAllButtonText: '',
    toggleAllPlaceholderText: 'Toggle all Groups',
  } as DraggableGroupingOption;
  columnsGroupBy: Column[] = [];
  onGroupChanged: SlickEvent;
  pluginName: 'DraggableGrouping' = 'DraggableGrouping';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: PubSubService,
    protected readonly sharedService: SharedService,
  ) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
    this.onGroupChanged = new Slick.Event();
  }

  get addonOptions(): DraggableGroupingOption {
    return this._addonOptions;
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView {
    return this.grid?.getData?.() ?? {} as SlickDataView;
  }

  get dropboxElement() {
    return this._dropboxElm;
  }

  get droppableInstance() {
    return this._droppableInstance;
  }

  get sortableInstance() {
    return this._sortableInstance;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get grid(): SlickGrid {
    return this._grid ?? this.sharedService.slickGrid ?? {} as SlickGrid;
  }

  get gridOptions(): GridOption {
    return this.sharedService.gridOptions ?? {};
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this._gridUid || (this.grid?.getUID() ?? '');
  }
  get gridUidSelector(): string {
    return this.gridUid ? `#${this.gridUid}` : '';
  }

  /** Initialize plugin. */
  init(grid: SlickGrid, groupingOptions?: DraggableGrouping) {
    this._addonOptions = { ...this._defaults, ...groupingOptions };
    this._grid = grid;
    if (grid) {
      this._gridUid = grid.getUID();
      this._gridColumns = grid.getColumns();
      this._dropboxElm = grid.getPreHeaderPanel();

      // add optional group "Toggle All" with its button & text when provided
      if (!this._addonOptions.hideToggleAllButton) {
        this._groupToggler = createDomElement('div', {
          className: 'slick-group-toggle-all',
          title: this._addonOptions.toggleAllPlaceholderText ?? '',
          style: { display: 'none' },
        });
        const groupTogglerIconElm = createDomElement('span', { className: 'slick-group-toggle-all-icon expanded mdi mdi-close' });
        this._groupToggler.appendChild(groupTogglerIconElm);

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
        this._dropboxElm.appendChild(this._groupToggler);

        // when calling Expand/Collapse All Groups from Context Menu, we also need to inform this plugin as well of the action
        this._subscriptions.push(
          this.pubSubService.subscribe('onContextMenuCollapseAllGroups', () => this.toggleGroupToggler(groupTogglerIconElm, true, false)),
          this.pubSubService.subscribe('onContextMenuExpandAllGroups', () => this.toggleGroupToggler(groupTogglerIconElm, false, false)),
        );
      }

      this._dropboxPlaceholderElm = createDomElement('div', { className: 'slick-draggable-dropbox-toggle-placeholder' });
      if (this.gridOptions.enableTranslate && this._addonOptions?.dropPlaceHolderTextKey) {
        this._addonOptions.dropPlaceHolderText = this.extensionUtility.translateWhenEnabledAndServiceExist(this._addonOptions.dropPlaceHolderTextKey, 'TEXT_TOGGLE_ALL_GROUPS');
      }
      this._dropboxPlaceholderElm.textContent = this._addonOptions?.dropPlaceHolderText ?? this._defaults.dropPlaceHolderText ?? '';
      this._dropboxElm.appendChild(this._dropboxPlaceholderElm);

      this.setupColumnDropbox();

      this._eventHandler.subscribe(grid.onHeaderCellRendered, (_e, args) => {
        const node = args.node;

        if (!isEmptyObject(args.column?.grouping) && node) {
          node.style.cursor = 'pointer'; // add the pointer cursor on each column title

          // also optionally add an icon beside each column title that can be dragged
          if (this._addonOptions.groupIconCssClass) {
            const groupableIconElm = createDomElement('span', { className: 'slick-column-groupable' });
            if (this._addonOptions.groupIconCssClass) {
              groupableIconElm.classList.add(...this._addonOptions.groupIconCssClass.split(' '));
            }
            node.appendChild(groupableIconElm);
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
    this.onGroupChanged.unsubscribe();
    this._eventHandler.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);
    emptyElement(document.querySelector('.slick-preheader-panel'));
  }

  clearDroppedGroups() {
    this.columnsGroupBy = [];
    this.updateGroupBy('clear-all');
    const allDroppedGroupingElms = this._dropboxElm.querySelectorAll('.slick-dropped-grouping');
    for (const groupElm of Array.from(allDroppedGroupingElms)) {
      const groupRemoveBtnElm = document.querySelector('.slick-groupby-remove');
      groupRemoveBtnElm?.remove();
      groupElm?.remove();
    }

    // show placeholder text & hide the "Toggle All" when that later feature is enabled
    this._dropboxPlaceholderElm.style.display = 'inline-block';
    if (this._groupToggler) {
      this._groupToggler.style.display = 'none';
    }
  }

  setColumns(cols: Column[]) {
    this._gridColumns = cols;
  }

  setDroppedGroups(groupingInfo: Array<string | GroupingGetterFunction> | string) {
    const groupingInfos = Array.isArray(groupingInfo) ? groupingInfo : [groupingInfo];
    this._dropboxPlaceholderElm.style.display = 'none';
    for (const groupInfo of groupingInfos) {
      const column = $(this.grid.getHeaderColumn(groupInfo as string));
      this.handleGroupByDrop(this._dropboxElm, column);
    }
  }

  setupColumnReorder(grid: SlickGrid, $headers: any, _headerColumnWidthDiff: any, setColumns: (columns: Column[]) => void, setupColumnResize: () => void, columns: Column[], getColumnIndex: (column: Column) => number, uid: string, trigger: (slickEvent: SlickEvent, data?: any) => void) {
    $headers.filter(':ui-sortable').sortable('destroy');
    const headerDraggableGroupByElm = grid.getPreHeaderPanel();

    return $headers.sortable({
      distance: 3,
      cursor: 'default',
      tolerance: 'intersection',
      helper: 'clone',
      placeholder: 'slick-sortable-placeholder ui-state-default slick-header-column',
      forcePlaceholderSize: true,
      appendTo: 'body',
      start: (_e: Event, ui: JQueryUiDraggableOption) => {
        $(ui.helper).addClass('slick-header-column-active');
        const placeholderElm = headerDraggableGroupByElm.querySelector<HTMLDivElement>('.slick-draggable-dropbox-toggle-placeholder');
        if (placeholderElm) {
          placeholderElm.style.display = 'inline-block';
        }
        const droppedGroupingElm = headerDraggableGroupByElm.querySelector<HTMLDivElement>('.slick-dropped-grouping');
        if (droppedGroupingElm) {
          droppedGroupingElm.style.display = 'none';
        }
      },
      beforeStop: (_e: Event, ui: JQueryUiDraggableOption) => {
        $(ui.helper).removeClass('slick-header-column-active');
        const hasDroppedColumn = headerDraggableGroupByElm.querySelectorAll('.slick-dropped-grouping').length;
        if (hasDroppedColumn > 0) {
          const placeholderElm = headerDraggableGroupByElm.querySelector<HTMLDivElement>('.slick-draggable-dropbox-toggle-placeholder');
          if (placeholderElm) {
            placeholderElm.style.display = 'none';
          }
          const droppedGroupingElm = headerDraggableGroupByElm.querySelector<HTMLDivElement>('.slick-dropped-grouping');
          if (droppedGroupingElm) {
            droppedGroupingElm.style.display = 'inline-block';
          }
        }
      },
      stop: (e: DOMMouseEvent<HTMLDivElement>) => {
        if (!grid.getEditorLock().commitCurrentEdit()) {
          ($(e.target) as any).sortable('cancel');
          return;
        }
        const reorderedIds = $headers.sortable('toArray');
        // If frozen columns are used, headers has more than one entry and we need the ids from all of them.
        // though there is only really a left and right header, this will work even if that should change.
        if ($headers.length > 1) {
          for (let headerIdx = 1, ln = $headers.length; headerIdx < ln; headerIdx += 1) {
            const $header = $($headers[headerIdx]);
            const ids = ($header as any).sortable('toArray');
            // Note: the loop below could be simplified with:
            // reorderedIds.push.apply(reorderedIds,ids);
            // However, the loop is more in keeping with way-backward compatibility
            for (const id of ids) {
              reorderedIds.push(id);
            }
          }
        }
        const reorderedColumns = [];
        for (const reorderedId of reorderedIds) {
          reorderedColumns.push(columns[getColumnIndex(reorderedId.replace(uid, ''))]);
        }
        setColumns(reorderedColumns);
        trigger(grid.onColumnsReordered, { grid: this.grid });
        e.stopPropagation();
        setupColumnResize();
      }
    } as JQueryUiSortableOptions);
  }

  //
  // protected functions
  // ------------------

  protected addColumnGroupBy(column: Column) {
    this.columnsGroupBy.push(column);
    this.updateGroupBy('add-group');
  }

  protected addGroupByRemoveClickHandler(id: string | number, _container: HTMLDivElement, column: Column, entry: any) {
    const groupRemoveElm = document.querySelector(`${this.gridUidSelector}_${id}_entry > .slick-groupby-remove`);
    if (groupRemoveElm) {
      this._bindEventService.bind(groupRemoveElm, 'click', () => {
        const boundedElms = this._bindEventService.boundedEvents.filter(boundedEvent => boundedEvent.element === groupRemoveElm);
        for (const boundedEvent of boundedElms) {
          this._bindEventService.unbind(boundedEvent.element, 'click', boundedEvent.listener);
        }
        this.removeGroupBy(id, column, entry);
      });
    }
  }

  protected handleGroupByDrop(container: any, column: any) {
    const columnid = column.attr('id').replace(this._gridUid, '');
    let columnAllowed = true;
    this.columnsGroupBy.forEach(col => {
      if (col.id === columnid) {
        columnAllowed = false;
      }
    });

    if (columnAllowed) {
      this._gridColumns.forEach(col => {
        if (col.id === columnid) {
          if (col.grouping !== null && !isEmptyObject(col.grouping)) {
            const columnName = column.children('.slick-column-name').first();
            const entryElm = createDomElement('div', { id: `${this._gridUid}_${col.id}_entry`, className: 'slick-dropped-grouping', dataset: { id: `${col.id}` } });
            const groupTextElm = createDomElement('div', {
              textContent: columnName.length ? columnName.text() : column.text(),
              style: { display: 'inline-flex' },
            });
            entryElm.appendChild(groupTextElm);

            const groupRemoveIconElm = createDomElement('div', { className: 'slick-groupby-remove' });
            if (this._addonOptions.deleteIconCssClass) {
              groupRemoveIconElm.classList.add(...this._addonOptions.deleteIconCssClass.split(' '));
            }
            if (!this._addonOptions.deleteIconCssClass) {
              groupRemoveIconElm.classList.add('slick-groupby-remove-image');
            }

            entryElm.appendChild(groupRemoveIconElm);
            entryElm.appendChild(document.createElement('div'));
            container.appendChild(entryElm);
            this.addColumnGroupBy(col);
            this.addGroupByRemoveClickHandler(col.id, container, column, entryElm);
          }
        }
      });

      // show the "Toggle All" when feature is enabled
      if (this._groupToggler) {
        this._groupToggler.style.display = 'inline-block';
      }
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

  protected removeGroupBy(id: string | number, _column: Column, entry: any) {
    entry.remove();
    const groupByColumns: Column[] = [];
    this._gridColumns.forEach((col: any) => groupByColumns[col.id] = col);
    this.removeFromArray(this.columnsGroupBy, groupByColumns[id as any]);
    if (this.columnsGroupBy.length === 0) {
      // show placeholder text & hide the "Toggle All" when that later feature is enabled
      this._dropboxPlaceholderElm.style.display = 'inline-block';
      if (this._groupToggler) {
        this._groupToggler.style.display = 'none';
      }
    }
    this.updateGroupBy('remove-group');
  }

  protected setupColumnDropbox() {
    this._droppableInstance = ($(this._dropboxElm) as any).droppable({
      activeClass: 'ui-state-default',
      hoverClass: 'ui-state-hover',
      accept: ':not(.ui-sortable-helper)',
      deactivate: () => {
        this._dropboxElm.classList.remove('slick-header-column-denied');
      },
      drop: (e: DOMMouseEvent<HTMLDivElement>, ui: JQueryUiDraggableOption) => {
        this.handleGroupByDrop(e.target, ui.draggable);
      },
      over: (_e: Event, ui: JQueryUiDraggableOption) => {
        const id = (ui.draggable).attr('id').replace(this._gridUid, '');
        for (const col of this._gridColumns) {
          if (col.id === id && !col.grouping) {
            this._dropboxElm.classList.add('slick-header-column-denied');
          }
        }
      }
    });

    this._sortableInstance = ($(this._dropboxElm) as any).sortable({
      items: 'div.slick-dropped-grouping',
      cursor: 'default',
      tolerance: 'pointer',
      helper: 'clone',
      update: (event: DOMMouseEvent<HTMLDivElement>) => {
        const sortArray: string[] = ($(event.target) as any).sortable('toArray', { attribute: 'data-id' });
        const newGroupingOrder = [];
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
      }
    });

    if (this._groupToggler) {
      this._bindEventService.bind(this._groupToggler, 'click', ((event: DOMMouseEvent<HTMLDivElement>) => {
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
      this._dropboxPlaceholderElm.style.display = 'inline-block';
      this.onGroupChanged.notify({ caller: originator, groupColumns: [] });
      return;
    }
    const groupingArray: Grouping<any>[] = [];
    this.columnsGroupBy.forEach(element => groupingArray.push(element.grouping!));
    this.dataView.setGrouping(groupingArray);
    this._dropboxPlaceholderElm.style.display = 'none';
    this.onGroupChanged.notify({ caller: originator, groupColumns: groupingArray });
  }
}