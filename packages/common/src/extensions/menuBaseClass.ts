import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import {
  calculateAvailableSpace,
  classNameToList,
  createDomElement,
  emptyElement,
  getOffset,
  getOffsetRelativeToParent,
  isDefined,
  titleCase,
} from '@slickgrid-universal/utils';
import { SlickEventHandler, type SlickEventData, type SlickGrid } from '../core/index.js';
import { applyHtmlToElement } from '../core/utils.js';
import type {
  CellMenu,
  Column,
  ColumnPicker,
  ColumnPickerOption,
  ContextMenu,
  DOMEvent,
  DOMMouseOrTouchEvent,
  GridMenu,
  GridMenuItem,
  GridMenuOption,
  GridOption,
  HeaderButton,
  HeaderButtonItem,
  HeaderMenu,
  HeaderMenuOption,
  MenuCommandItem,
  MenuOptionItem,
} from '../interfaces/index.js';
import type { SharedService } from '../services/shared.service.js';
import type { ExtensionUtility } from './extensionUtility.js';
import { wireMenuKeyboardNavigation } from './keyboardNavigation.js';

export type ExtractMenuType<A, T> = T extends 'command' ? A : T extends 'option' ? A : A extends 'divider' ? A : never;
export type MenuType = 'command' | 'option';
export type MenuCommandOptionItem = MenuCommandItem | MenuOptionItem;
export type ExtendableItemTypes = HeaderButtonItem | MenuCommandItem | MenuOptionItem | 'divider';
export type MenuPlugin = CellMenu | ContextMenu | GridMenu | HeaderMenu;
export type itemEventCallback = (
  e: DOMMouseOrTouchEvent<HTMLDivElement>,
  type: MenuType,
  item: ExtractMenuType<ExtendableItemTypes, MenuType>,
  level: number,
  columnDef?: Column
) => void;
export interface KeyboardNavigationOption {
  onActivate?: (focusedItem: HTMLElement) => void;
  onEscape?: () => void;
  onTab?: (evt: KeyboardEvent, focusedItem: HTMLElement) => void;
  eventServiceKey?: string;
  allItemsSelector?: string;
  focusedItemSelector?: string;
}

export class MenuBaseClass<M extends MenuPlugin | HeaderButton | ColumnPicker | ColumnPickerOption> {
  onColumnsChanged!: any;

  protected _addonOptions: M = {} as unknown as M;
  protected _areVisibleColumnDifferent = false;
  protected _bindEventService: BindingEventService;
  protected _camelPluginName = '';
  protected _columnCheckboxes: HTMLInputElement[] = [];
  protected _columns: Column[] = [];
  protected _columnTitleElm!: HTMLDivElement;
  protected _commandTitleElm?: HTMLSpanElement;
  protected _eventHandler: SlickEventHandler;
  protected _gridUid = '';
  protected _listElm!: HTMLElement;
  protected _menuElm?: HTMLDivElement | null;
  protected _menuCssPrefix = '';
  protected _menuPluginCssPrefix = '';
  protected _optionTitleElm?: HTMLSpanElement;
  protected _menuTriggerElement?: HTMLElement; // Track the element that triggered the menu for focus restoration
  protected _timer?: any;
  pluginName = '';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService
  ) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new SlickEventHandler();
  }

  get addonOptions(): M {
    return this._addonOptions as M;
  }
  set addonOptions(newOptions: M) {
    this._addonOptions = newOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get grid(): SlickGrid {
    return this.sharedService.slickGrid;
  }

  get gridOptions(): GridOption {
    return this.sharedService.gridOptions ?? {};
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this._gridUid || (this.grid?.getUID() ?? '');
  }

  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  get menuCssClass(): string {
    return this._menuPluginCssPrefix || this._menuCssPrefix;
  }

  get menuElement(): HTMLDivElement | null {
    return this._menuElm || document.querySelector(`.${this.menuCssClass}${this.gridUidSelector}`);
  }

  /** Dispose (destroy) of the plugin */
  dispose(): void {
    clearTimeout(this._timer);
    this._eventHandler?.unsubscribeAll();
    this._bindEventService.unbindAll();
    this.pubSubService.unsubscribeAll();
    this._commandTitleElm?.remove();
    this._optionTitleElm?.remove();
    this.disposeAllMenus();
    emptyElement(this._menuElm);
    this.menuElement?.remove();
    this._menuElm?.remove();
  }

  /** Remove/dispose all parent menus and any sub-menu(s) */
  disposeAllMenus(): void {
    this.disposeSubMenus();

    // remove all parent menu listeners before removing them from the DOM
    this._bindEventService.unbindAll('parent-menu');
    this._bindEventService.unbindAll('keyboard-navigation'); // Clean up keyboard/mouse event bindings
    document.querySelectorAll(`.${this.menuCssClass}${this.gridUidSelector}`).forEach((subElm) => subElm.remove());

    // Restore focus to the trigger element if it exists
    this._menuTriggerElement?.focus();
  }

  /**
   * Remove/dispose all previously opened sub-menu(s),
   * it will first remove all sub-menu listeners then remove sub-menus from the DOM
   */
  disposeSubMenus(): void {
    this._bindEventService.unbindAll('sub-menu');
    document.querySelectorAll(`.${this.menuCssClass}.slick-submenu${this.gridUidSelector}`).forEach((subElm) => subElm.remove());
  }

  setOptions(newOptions: M): void {
    this._addonOptions = { ...this._addonOptions, ...newOptions };
  }

  protected get columnPickerMenuAddonOptions(): ColumnPicker | GridMenu {
    return this.addonOptions as ColumnPicker | GridMenu;
  }

  /** Create a Close button element and add it to the Menu element */
  protected addCloseButtomElement(menuElm: HTMLDivElement): void {
    const dismiss = this._camelPluginName === 'gridMenu' ? 'slick-grid-menu' : 'slick-column-picker';
    const closePickerButtonElm = createDomElement('button', {
      type: 'button',
      className: 'close',
      ariaLabel: 'Close',
      textContent: '×',
      dataset: { dismiss },
    });
    menuElm.appendChild(closePickerButtonElm);
  }

  /** When columnTitle is provided, create a title element for the columns list. */
  protected addColumnTitleElementWhenDefined(menuElm: HTMLDivElement): void {
    if (this.columnPickerMenuAddonOptions?.columnTitle) {
      this._columnTitleElm = createDomElement(
        'div',
        { className: 'slick-menu-title', textContent: this.columnPickerMenuAddonOptions.columnTitle },
        menuElm
      );
    }
  }

  /**
   * Handle column picker item click for both SlickColumnPicker and SlickGridMenu controls.
   * @param event - input checkbox event
   */
  protected handleColumnPickerItemClick(event: DOMEvent<HTMLInputElement>): void {
    const controlType = this._camelPluginName || 'columnPicker';
    const iconContainerElm = event.target?.closest('.icon-checkbox-container') as HTMLDivElement;
    const iconElm = iconContainerElm?.querySelector<HTMLDivElement>('.mdi');
    const isChecked = !!event.target.checked;
    event.target.ariaChecked = String(isChecked);
    this.togglePickerCheckbox(iconElm, isChecked);

    // when calling setOptions, it will resize with ALL Columns (even the hidden ones)
    // we can avoid this problem by keeping a reference to the visibleColumns before setOptions and then setColumns after
    if (event.target.dataset.option === 'autoresize') {
      this.grid.setOptions({ forceFitColumns: isChecked });
      this.grid.updateColumns();
      return;
    }

    if (event.target.dataset.option === 'syncresize') {
      this.grid.setOptions({ syncColumnCellResize: isChecked });
      return;
    }

    if (event.target.type === 'checkbox') {
      this._areVisibleColumnDifferent = true;
      const columnId = event.target.dataset.columnid || '';

      // validate that the checkbox changes is allowed before going any further
      const isFrozenAllowed = this.grid.validateColumnFreeze(columnId, true);
      let visibleColumns = this.grid.getVisibleColumns();

      if (!isFrozenAllowed || (visibleColumns.length - 1 < 1 && !isChecked)) {
        event.target.checked = true;
        this.togglePickerCheckbox(iconElm, true);
        return;
      }

      this.grid.updateColumnById(columnId, { hidden: !isChecked });
      if (!isChecked && this.gridOptions.enableCellRowSpan) {
        this.grid.remapAllColumnsRowSpan();
      }
      this.grid.updateColumns();
      visibleColumns = this.grid.getVisibleColumns();

      // when using row selection, SlickGrid will only apply the "selected" CSS class on the visible columns only
      // and if the row selection was done prior to the column being shown then that column that was previously hidden (at the time of the row selection)
      // will not have the "selected" CSS class because it wasn't visible at the time.
      // To bypass this problem we can simply recall the row selection with the same selection and that will trigger a re-apply of the CSS class
      // on all columns including the column we just made visible
      if (this.gridOptions.enableSelection && isChecked) {
        const rowSelection = this.grid.getSelectedRows();
        this.grid.setSelectedRows(rowSelection);
      }

      const callbackArgs = {
        columnId,
        showing: isChecked,
        allColumns: this.grid.getColumns(),
        visibleColumns,
        columns: visibleColumns,
        grid: this.grid,
      };

      // Restore focus to the triggering <li> if possible (for keyboard accessibility)
      // Only do this if the event was triggered by keyboard or programmatically (not mouse)
      // We check for type 'keydown' or if the activeElement is not the li
      this.pubSubService.publish(`on${titleCase(controlType)}ColumnsChanged`, callbackArgs);
      if (typeof this.columnPickerMenuAddonOptions.onColumnsChanged === 'function') {
        // Use a timeout to allow DOM updates before restoring focus
        this.columnPickerMenuAddonOptions.onColumnsChanged(event, callbackArgs as never);
      }
      this.onColumnsChanged.notify(callbackArgs, null, this);
    }

    const liElm = event.target?.closest('li');
    if (liElm && typeof liElm.focus === 'function') {
      setTimeout(() => liElm?.focus(), 0);
    }
  }

  /**
   * Because columns can be reordered, we have to update the `columns` to reflect the new order, however we can't just take `grid.getColumns()`,
   * as it does not include columns currently hidden by the picker. We create a new `columns` structure by leaving currently-hidden
   * columns in their original ordinal position and interleaving the results of the current column sort.
   */
  protected updateColumnPickerOrder(): void {
    const current = this.grid.getColumns().slice(0);
    const ordered = new Array(this._columns.length);

    for (let i = 0, ln = ordered.length; i < ln; i++) {
      const columnIdx = this.grid.getColumnIndex(this._columns[i].id);
      ordered[i] = columnIdx === undefined ? this._columns[i] : current.shift();
    }

    // the new set of ordered columns becomes the new set of column picker columns
    this._columns = ordered;
  }

  protected populateColumnPicker(
    addonOptions: ColumnPickerOption | GridMenuOption,
    defaultExtractor?: (column: Column, gridOptions?: GridOption) => string | HTMLElement | DocumentFragment
  ): void {
    const isGridMenu = this._camelPluginName === 'gridMenu';
    const menuPrefix = isGridMenu ? 'gridmenu-' : '';

    let processedColumns = this._columns;
    if (typeof addonOptions?.columnSort === 'function') {
      // create a sorted copy of the columns array based on the "name" property
      processedColumns = [...this._columns].sort(addonOptions.columnSort);
    }

    // execute column list builder to allow user to filter/sort columns
    if (typeof addonOptions.columnListBuilder === 'function') {
      processedColumns = addonOptions.columnListBuilder(processedColumns);
    }

    for (const column of processedColumns) {
      const columnId = column.id;
      const columnLiElm = createDomElement('li', { tabIndex: -1 });

      // deprecated, let's filter out the exclude columns before `columnListBuilder` above (let's do that in next major v11)
      if ((column.excludeFromColumnPicker && !isGridMenu) || (column.excludeFromGridMenu && isGridMenu)) {
        columnLiElm.className = 'hidden';
      }

      const inputId = `${this._gridUid}-${menuPrefix}colpicker-${columnId}`;
      const isChecked = this.grid.getVisibleColumns().some((col) => col.id === columnId && !col.hidden);
      const { inputElm, labelElm, labelSpanElm } = this.generatePickerCheckbox(
        columnLiElm,
        inputId,
        { columnid: `${columnId}` },
        isChecked
      );
      this._columnCheckboxes.push(inputElm);

      const headerColumnValueExtractorFn =
        typeof addonOptions?.headerColumnValueExtractor === 'function' ? addonOptions.headerColumnValueExtractor : defaultExtractor!;
      const columnLabel = headerColumnValueExtractorFn(column, this.gridOptions);

      applyHtmlToElement(labelSpanElm, columnLabel, this.gridOptions);
      columnLiElm.appendChild(labelElm);
      this._listElm.appendChild(columnLiElm);
    }

    if (!addonOptions.hideForceFitButton || !addonOptions.hideSyncResizeButton) {
      this._listElm.appendChild(document.createElement('hr'));
    }

    if (!addonOptions?.hideForceFitButton) {
      const fitLiElm = createDomElement('li', { tabIndex: -1 });
      const inputId = `${this._gridUid}-${menuPrefix}colpicker-forcefit`;
      const { labelSpanElm } = this.generatePickerCheckbox(fitLiElm, inputId, { option: 'autoresize' }, this.gridOptions.forceFitColumns);
      labelSpanElm.textContent = addonOptions?.forceFitTitle ?? '';
      this._listElm.appendChild(fitLiElm);
    }

    if (!addonOptions?.hideSyncResizeButton) {
      const syncLiElm = createDomElement('li', { tabIndex: -1 });
      const inputId = `${this._gridUid}-${menuPrefix}colpicker-syncresize`;
      const { labelSpanElm } = this.generatePickerCheckbox(syncLiElm, inputId, { option: 'syncresize' }, this.gridOptions.forceFitColumns);
      labelSpanElm.textContent = addonOptions?.syncResizeTitle ?? '';
      this._listElm.appendChild(syncLiElm);
    }
  }

  // --
  // protected functions
  // ------------------

  /**
   * add Menu Item Command when not found and also make sure that we have an `action` callback
   * (could be missing when provided by user) if not use built-in `action` callback when missing
   * @param originalMenuItems
   * @param builtInMenuItem
   * @param showCommand - is command hidden from menu option (deprecated)
   * @returns - returns true when added to the commands array
   */
  protected addMissingCommandOrAction<T extends MenuCommandItem | GridMenuItem>(
    builtInMenuItem: T | 'divider',
    hideCommands: string[] = [],
    targetMenuItems: Array<T | 'divider'>,
    originalMenuItems?: Array<T | 'divider'>
  ): void {
    // remove any commands that the user doesn't want
    let skip = false;
    if (hideCommands.length) {
      skip = builtInMenuItem !== 'divider' && new Set(hideCommands).has(builtInMenuItem.command);
    }

    if (builtInMenuItem !== 'divider' && !skip) {
      const cmdName = builtInMenuItem.command;
      const cmd = (originalMenuItems ?? targetMenuItems).find((item) => item !== 'divider' && item.command === cmdName);

      if (!cmd) {
        targetMenuItems.push(builtInMenuItem);
      } else if (!(cmd as T).action) {
        // action might be missing (custom menu items), if so copy over from built-in
        (cmd as T).action = builtInMenuItem.action;
      }
    }
  }

  /** Focus the first focusable menu item after menu is opened */
  protected focusFirstMenuItem(menuElm: HTMLElement): void {
    // Find the first menu list (direct child with role="menu")
    const menuList = menuElm.querySelector('[role="menu"]') as HTMLElement;
    if (menuList) {
      // Get all menu items and find the first one that's not disabled/divider/hidden
      const menuItems = Array.from(menuList.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      const firstMenuItem = menuItems.find((item) => {
        // Skip dividers, disabled, and hidden items
        return (
          !item.classList.contains('disabled') &&
          !item.classList.contains('slick-menu-item-disabled') &&
          !item.classList.contains('slick-menu-item-divider') &&
          !item.classList.contains('slick-menu-item-hidden') &&
          item.offsetParent !== null
        );
      });

      firstMenuItem?.focus();
    }
  }

  /** Set the menu trigger element for focus restoration when menu closes */
  protected setMenuTriggerElement(triggerElement: HTMLElement): void {
    this._menuTriggerElement = triggerElement;
  }

  protected togglePickerCheckbox(iconElm: HTMLDivElement | null, checked = false): void {
    if (iconElm) {
      iconElm.className = `mdi ${checked ? 'mdi-icon-picker-check' : 'mdi-icon-picker-uncheck'}`;
    }
  }

  protected generatePickerCheckbox(
    columnLiElm: HTMLLIElement,
    inputId: string,
    inputData: any,
    checked = false
  ): {
    inputElm: HTMLInputElement;
    labelElm: HTMLLabelElement;
    labelSpanElm: HTMLSpanElement;
  } {
    const labelElm = createDomElement('label', { className: 'checkbox-picker-label', htmlFor: inputId });
    const divElm = createDomElement('div', { className: 'icon-checkbox-container' });
    const inputElm = createDomElement('input', {
      id: inputId,
      type: 'checkbox',
      dataset: inputData,
      tabIndex: -1,
    });
    const colInputDivElm = createDomElement('div', { className: `mdi ${checked ? 'mdi-icon-picker-check' : 'mdi-icon-picker-uncheck'}` });
    const labelSpanElm = createDomElement('span', { className: 'checkbox-label' });
    divElm.appendChild(inputElm);
    divElm.appendChild(colInputDivElm);
    labelElm.appendChild(divElm);
    labelElm.appendChild(labelSpanElm);
    columnLiElm.appendChild(labelElm);

    if (checked) {
      inputElm.ariaChecked = 'true';
      inputElm.checked = true;
    }

    return { inputElm, labelElm, labelSpanElm };
  }

  /**
   * Render slot content using a renderer callback.
   * The renderer receives the menu item and args for full context access.
   * @param parentElm - The parent element (LI) to insert the slot content into
   * @param slotRenderer - A callback function that receives (item, args) and returns string or HTMLElement
   * @param item - The menu item object (passed to callback)
   * @param args - The callback args providing access to grid, column, dataContext, etc.
   */
  protected renderSlotRenderer(
    parentElm: HTMLElement,
    slotRenderer: (item: any, args: any) => string | HTMLElement,
    item: any,
    args: any
  ): void {
    const result = slotRenderer(item, args);
    if (typeof result === 'string') {
      parentElm.innerHTML = this.grid.sanitizeHtmlString(result);
    } else if (result instanceof HTMLElement) {
      parentElm.appendChild(result);
    }
  }

  protected addSubMenuTitleWhenExists(item: ExtractMenuType<ExtendableItemTypes, MenuType>, commandOrOptionMenu: HTMLDivElement): void {
    if (item !== 'divider' && (item as MenuCommandOptionItem | GridMenuItem)?.subMenuTitle) {
      const subMenuTitleElm = document.createElement('div');
      subMenuTitleElm.className = 'slick-menu-title';
      subMenuTitleElm.textContent = (item as MenuCommandOptionItem | GridMenuItem).subMenuTitle as string;
      const subMenuTitleClass = (item as MenuCommandOptionItem | GridMenuItem).subMenuTitleCssClass as string;
      if (subMenuTitleClass) {
        subMenuTitleElm.classList.add(...classNameToList(subMenuTitleClass));
      }
      commandOrOptionMenu.appendChild(subMenuTitleElm);
    }
  }

  /** Construct the Command/Options Items section. */
  protected populateCommandOrOptionItems(
    itemType: MenuType,
    menuOptions: M,
    commandOrOptionMenuElm: HTMLElement,
    commandOrOptionItems: Array<ExtractMenuType<ExtendableItemTypes, MenuType>>,
    args: unknown,
    triggeredByElm: HTMLElement,
    itemClickCallback: itemEventCallback,
    itemMouseoverCallback?: itemEventCallback,
    keyboardNavOptions?: KeyboardNavigationOption
  ): void {
    if (args && commandOrOptionItems && menuOptions) {
      for (const item of commandOrOptionItems) {
        const li = this.populateSingleCommandOrOptionItem(
          itemType,
          menuOptions,
          commandOrOptionMenuElm,
          item,
          args,
          triggeredByElm,
          itemClickCallback,
          itemMouseoverCallback
        );
        if (li && ((item as MenuCommandItem)?.commandItems || (item as MenuOptionItem)?.optionItems)) {
          // Use command for MenuCommandItem, option for MenuOptionItem
          const isCommand = typeof (item as MenuCommandItem).command === 'string';
          const key = isCommand ? (item as MenuCommandItem).command : (item as MenuOptionItem).option;
          const keyStr = typeof key === 'string' ? key.replace(/\s/g, '') : String(key);
          if (keyStr) {
            const selector = `.slick-submenu[data-sub-menu-parent="${keyStr}"]`;
            const subMenuElm = document.body.querySelector(selector) as HTMLElement;
            if (subMenuElm && !subMenuElm.dataset.keyboardNavBound) {
              this.wireMenuKeyboardNavigation(subMenuElm, keyboardNavOptions);
            }
          }
        }
      }
    }
  }

  /** Add the Command/Options Title when necessary. */
  protected populateCommandOrOptionTitle(itemType: MenuType, menuOptions: M, commandOrOptionMenuElm: HTMLElement, level: number): void {
    if (menuOptions) {
      const isSubMenu = level > 0;

      // return or create a title container
      const menuHeaderElm =
        this._menuElm?.querySelector(`.slick-${itemType}-header`) ?? createDomElement('div', { className: `slick-${itemType}-header` });

      // user could pass a title on top of the Commands/Options section
      const titleProp: 'commandTitle' | 'optionTitle' = `${itemType}Title`;

      if (!isSubMenu) {
        if ((menuOptions as CellMenu | ContextMenu)?.[titleProp]) {
          emptyElement(menuHeaderElm); // make sure title container is empty before adding anything inside it
          this[`_${itemType}TitleElm`] = createDomElement('span', {
            className: 'slick-menu-title',
            textContent: (menuOptions as never)[titleProp],
          });
          menuHeaderElm.appendChild(this[`_${itemType}TitleElm`]!);
          menuHeaderElm.classList.add('with-title');
        } else {
          menuHeaderElm.classList.add('no-title');
        }
        commandOrOptionMenuElm.appendChild(menuHeaderElm);
      }
    }
  }

  /** Construct the Command/Options Items section. */
  protected populateSingleCommandOrOptionItem(
    itemType: MenuType,
    menuOptions: M,
    commandOrOptionMenuElm: HTMLElement | null,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    args: any,
    triggeredByElm: HTMLElement,
    itemClickCallback: itemEventCallback,
    itemMouseoverCallback?: itemEventCallback
  ): HTMLLIElement | null {
    let commandLiElm: HTMLLIElement | null = null;
    const isHeaderButton = this._camelPluginName === 'headerButtons';

    if (args && item && menuOptions) {
      const level = args?.level || 0;
      const pluginMiddleName = isHeaderButton ? '' : '-item';
      const menuCssPrefix = `${this._menuCssPrefix}${pluginMiddleName}`;

      // run each override functions to know if the item is visible and usable
      let isItemVisible = true;
      let isItemUsable = true;
      if (typeof item === 'object') {
        isItemVisible = this.extensionUtility.runOverrideFunctionWhenExists<typeof args>(item.itemVisibilityOverride, args);
        isItemUsable = this.extensionUtility.runOverrideFunctionWhenExists<typeof args>(item.itemUsabilityOverride, args);
      }

      // if the result is not visible then there's no need to go further
      if (!isItemVisible) {
        return null;
      }

      // when the override is defined (and previously executed), we need to use its result to update the disabled property
      // so that "handleMenuItemCommandClick" has the correct flag and won't trigger a command/option clicked event
      if (typeof item === 'object' && item.itemUsabilityOverride) {
        item.disabled = isItemUsable ? false : true;
      }

      commandLiElm = createDomElement('li', { className: menuCssPrefix, role: 'menuitem' });
      if (item !== 'divider' && !(item as MenuCommandOptionItem).divider) {
        commandLiElm.tabIndex = -1;
      }
      if (typeof item === 'object' && isDefined((item as never)[itemType])) {
        commandLiElm.dataset[itemType] = (item as never)?.[itemType];
      }
      if (commandOrOptionMenuElm) {
        commandOrOptionMenuElm.appendChild(commandLiElm);
      }

      if ((typeof item === 'object' && (item as MenuCommandOptionItem).divider) || item === 'divider') {
        commandLiElm.classList.add(`${menuCssPrefix}-divider`);
        commandLiElm.setAttribute('role', 'separator');
        return commandLiElm;
      }

      if (item.disabled) {
        commandLiElm.classList.add(`${menuCssPrefix}-disabled`);
        commandLiElm.ariaDisabled = 'true';
      }

      if ((item as MenuCommandOptionItem).hidden || (item as HeaderButtonItem).showOnHover) {
        commandLiElm.classList.add(`${menuCssPrefix}-hidden`);
      }

      if (item.cssClass) {
        if (isHeaderButton) {
          commandLiElm.appendChild(createDomElement('span', { className: item.cssClass }));
        } else {
          commandLiElm.classList.add(...classNameToList(item.cssClass));
        }
      }

      if (item.tooltip) {
        commandLiElm.title = item.tooltip;
      }

      if (!isHeaderButton) {
        // Check if we have slot renderer on the menu item or a default item renderer
        const slotRenderer = (item as MenuCommandOptionItem).slotRenderer || (this._addonOptions as MenuPlugin).defaultMenuItemRenderer;
        if (slotRenderer) {
          this.renderSlotRenderer(commandLiElm, slotRenderer, item as MenuCommandOptionItem, args);
        }
        // Default rendering: icon + content
        else {
          const iconElm = createDomElement('div', { className: `${this._menuCssPrefix}-icon` });
          commandLiElm.appendChild(iconElm);

          if ((item as MenuCommandOptionItem).iconCssClass) {
            iconElm.classList.add(...classNameToList((item as MenuCommandOptionItem).iconCssClass));
          } else if (!(item as MenuCommandItem).commandItems && !(item as MenuOptionItem).optionItems) {
            iconElm.textContent = '◦';
          }

          const textElm = createDomElement(
            'span',
            {
              className: `${this._menuCssPrefix}-content`,
              textContent: (typeof item === 'object' && (item as MenuCommandOptionItem).title) || '',
            },
            commandLiElm
          );

          if ((item as MenuCommandOptionItem).textCssClass) {
            textElm.classList.add(...classNameToList((item as MenuCommandOptionItem).textCssClass));
          }
        }
      }

      // execute command callback on menu item clicked
      const eventGroupName = level > 0 ? 'sub-menu' : 'parent-menu';
      if (commandLiElm) {
        this._bindEventService.bind(
          commandLiElm,
          'click',
          ((e: DOMMouseOrTouchEvent<HTMLDivElement>) => {
            // if there's a slot renderer, call it with the event
            const slotRenderer = (item as MenuCommandOptionItem).slotRenderer || (this._addonOptions as MenuPlugin).defaultMenuItemRenderer;
            if (slotRenderer) {
              slotRenderer(item as MenuCommandOptionItem, args, e);
            }

            // if the click was stopped by an interactive element handler, don't trigger the menu action
            if (e.defaultPrevented) {
              return;
            }

            itemClickCallback.call(this, e, itemType, item, level, args?.column);
            triggeredByElm?.focus(); // Restore focus to the triggering element after click
          }) as EventListener,
          undefined,
          eventGroupName
        );
      }

      // optionally open sub-menu(s) by mouseover
      if ((this._addonOptions as MenuPlugin)?.subMenuOpenByEvent === 'mouseover' && typeof itemMouseoverCallback === 'function') {
        this._bindEventService.bind(
          commandLiElm,
          'mouseover',
          ((e: DOMMouseOrTouchEvent<HTMLDivElement>) =>
            itemMouseoverCallback.call(
              this,
              e,
              itemType,
              item as ExtractMenuType<ExtendableItemTypes, MenuType>,
              level,
              args?.column
            )) as EventListener,
          undefined,
          eventGroupName
        );
      }

      // the option/command item could be a sub-menu if it has another list of commands/options
      if ((item as MenuCommandItem).commandItems || (item as MenuOptionItem).optionItems) {
        const chevronElm = document.createElement('span');
        chevronElm.className = 'sub-item-chevron';
        if ((this._addonOptions as any).subItemChevronClass) {
          chevronElm.classList.add(...classNameToList((this._addonOptions as MenuPlugin).subItemChevronClass));
        } else {
          chevronElm.textContent = '⮞'; // ⮞ or ▸
        }

        commandLiElm.classList.add('slick-submenu-item');
        commandLiElm.ariaHasPopup = 'true';
        commandLiElm.ariaExpanded = 'false';
        commandLiElm.appendChild(chevronElm);
      }
    }
    return commandLiElm;
  }

  /**
   * Wire up keyboard navigation for the menu container using shared utility.
   * Should be called after menu DOM is created for all non-GridMenu plugins.
   * Handles sub-menu open/close and focus transfer for a11y.
   */
  protected wireMenuKeyboardNavigation(menuElm: HTMLElement, options?: KeyboardNavigationOption): void {
    wireMenuKeyboardNavigation(menuElm, this._bindEventService, {
      ...options,
      onActivate:
        options?.onActivate ??
        ((focusedItem) => {
          // Default: trigger click on menu item
          if (focusedItem) {
            focusedItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          }
        }),
      onEscape: options?.onEscape ?? (() => this.disposeAllMenus()),
      onTab:
        options?.onTab ??
        ((evt: KeyboardEvent) => {
          evt.preventDefault();
          evt.stopPropagation();
        }),
      allItemsSelector: options?.allItemsSelector,
      focusedItemSelector: options?.focusedItemSelector,
      onOpenSubMenu: (focusedItem: HTMLElement) => {
        // Try to open sub-menu (simulate mouseover/click if needed)
        const command = focusedItem.dataset.command;
        let subMenuSelector = '';
        if (command) {
          const cmdStr = typeof command === 'string' ? command.replace(/\s/g, '') : String(command);
          subMenuSelector = `.slick-submenu[data-sub-menu-parent="${cmdStr}"]`;
        }
        // Simulate mouseover/click to open sub-menu if not present
        let subMenuElm = subMenuSelector ? (document.body.querySelector(subMenuSelector) as HTMLElement) : null;
        if (!subMenuElm) {
          focusedItem.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
          // Try again after event
          if (subMenuSelector) {
            subMenuElm = document.body.querySelector(subMenuSelector) as HTMLElement;
          }
        }
        // If sub-menu is now present, wire keyboard navigation and focus first item
        if (subMenuElm) {
          if (!subMenuElm.dataset.keyboardNavBound) {
            this.wireMenuKeyboardNavigation(subMenuElm, options);
          }
          focusedItem.ariaExpanded = 'true';
          this.focusFirstMenuItem(subMenuElm!);
        }
      },
      onCloseSubMenu: (focusedItem: HTMLElement) => {
        // Close the current sub-menu, then focus the trigger in the previous menu
        const currentSubMenu = focusedItem.closest<HTMLDivElement>('.slick-submenu');
        if (currentSubMenu) {
          // Remove the current sub-menu from the DOM
          currentSubMenu.remove();
          // Find the parent menu (the previous menu level)
          const parentMenu = document.body.querySelector(
            `.slick-menu-level-${parseInt(currentSubMenu.className.match(/slick-menu-level-(\d+)/)?.[1] || '1', 10) - 1}`
          );
          // Find the submenu trigger in the parent menu that matches the data-sub-menu-parent
          let triggerSelector = '';
          const subMenuParentId = currentSubMenu.dataset.subMenuParent;
          if (subMenuParentId) {
            triggerSelector = `.slick-submenu-item[data-command="${subMenuParentId}"], .slick-submenu-item[data-option="${subMenuParentId}"]`;
          }
          let triggerItem = parentMenu && triggerSelector ? (parentMenu.querySelector(triggerSelector) as HTMLElement) : null;
          // Fallback: focus first menu item if trigger not found
          if (!triggerItem && parentMenu) {
            triggerItem = parentMenu.querySelector('.slick-submenu-item, [role="menuitem"]') as HTMLElement;
          }
          if (triggerItem) {
            triggerItem.ariaExpanded = 'false';
            triggerItem.focus();
          }
        }
      },
    });
  }

  /**
   * Reposition any of the menu plugins (CellMenu, ContextMenu, GridMenu, HeaderMenu) to where the user clicked,
   * it will calculate the best position depending on available space in the viewport and the menu type.
   */
  repositionMenu(
    e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData,
    menuElm: HTMLElement,
    buttonElm?: HTMLButtonElement,
    addonOptions?: GridMenu | CellMenu | ContextMenu | HeaderMenu
  ): void {
    const targetElm = e.target as HTMLDivElement; // get header button createElement
    const targetEvent: MouseEvent | Touch = (e as TouchEvent)?.touches?.[0] ?? e;
    const isSubMenu = menuElm.classList.contains('slick-submenu');
    const rowHeight = this.gridOptions.rowHeight || 0;
    const parentElm = isSubMenu
      ? ((e.target as HTMLElement)!.closest('.slick-menu-item') as HTMLDivElement)
      : this.pluginName === 'CellMenu' || this.pluginName === 'ContextMenu'
        ? (e.target!.closest('.slick-cell') as HTMLDivElement)
        : (targetEvent.target as HTMLElement);

    if (menuElm && parentElm) {
      // for Cell/Context Menus we should move to (0,0) coordinates before calculating height/width
      // since it could end up being cropped width values when element is outside browser viewport.
      if (this.pluginName === 'CellMenu' || this.pluginName === 'ContextMenu') {
        menuElm.style.top = `0px`;
        menuElm.style.left = `0px`;
      }

      const containerElm: HTMLElement = this.sharedService.gridContainerElement.classList.contains('slickgrid-container')
        ? this.sharedService.gridContainerElement
        : (this.sharedService.gridContainerElement.querySelector('.slickgrid-container') ?? this.sharedService.gridContainerElement);
      const relativePos = getOffsetRelativeToParent(containerElm, targetElm);
      const menuWidth = menuElm.offsetWidth;
      const parentOffset = getOffset(parentElm);
      let menuOffsetLeft = 0;
      let menuOffsetTop = 0;
      let dropOffset = 0;
      let sideOffset = 0;
      let availableSpaceBottom = 0;
      let availableSpaceTop = 0;
      const { bottom: parentSpaceBottom, top: parentSpaceTop } = calculateAvailableSpace(parentElm);

      if (this.pluginName === 'GridMenu' && buttonElm) {
        if (!isSubMenu) {
          const buttonComptStyle = getComputedStyle(buttonElm);
          const buttonWidth = parseInt(buttonComptStyle?.width ?? (addonOptions as GridMenuOption)?.menuWidth, 10);
          const contentMinWidth = (addonOptions as GridMenuOption)?.contentMinWidth ?? 0;
          const currentMenuWidth = (contentMinWidth > menuWidth ? contentMinWidth : menuWidth) || 0;
          if (contentMinWidth > 0) {
            menuElm.style.minWidth = `${contentMinWidth}px`;
          }
          const menuIconOffset = getOffset(buttonElm); // get button offset position
          const nextPositionLeft = menuIconOffset.right;
          menuOffsetTop = menuIconOffset.top + buttonElm!.offsetHeight; // top position has to include button height so the menu is placed just below it
          menuOffsetLeft =
            (addonOptions as GridMenuOption)?.dropSide === 'right' ? nextPositionLeft - buttonWidth : nextPositionLeft - currentMenuWidth;
        }
      } else if (this.pluginName === 'CellMenu' || this.pluginName === 'ContextMenu') {
        menuOffsetLeft = parentElm && this.pluginName === 'CellMenu' ? parentOffset.left : targetEvent.pageX;
        menuOffsetTop = parentElm && this.pluginName === 'CellMenu' ? parentOffset.top : targetEvent.pageY;
        dropOffset = Number((addonOptions as CellMenu | ContextMenu)?.autoAdjustDropOffset || 0);
        sideOffset = Number((addonOptions as CellMenu | ContextMenu)?.autoAlignSideOffset || 0);
      } else {
        menuOffsetLeft = isSubMenu ? parentOffset.left : (relativePos?.left ?? 0);
        menuOffsetTop = isSubMenu
          ? parentOffset.top
          : (relativePos?.top ?? 0) + ((addonOptions as HeaderMenuOption)?.menuOffsetTop ?? 0) + targetElm.clientHeight;
      }

      if ((this.pluginName === 'ContextMenu' || this.pluginName === 'GridMenu') && isSubMenu) {
        menuOffsetLeft = parentOffset.left;
        menuOffsetTop = parentOffset.top;
      }

      // for sub-menus only, auto-adjust drop position (up/down)
      // we first need to see what position the drop will be located (defaults to bottom)
      // since we reposition menu below slick cell, we need to take it in consideration and do our calculation from that element
      const menuHeight = menuElm?.offsetHeight || 0;
      if ((this.pluginName === 'GridMenu' || this.pluginName === 'HeaderMenu') && isSubMenu) {
        availableSpaceBottom = parentSpaceBottom;
        availableSpaceTop = parentSpaceTop;
      } else if (
        this.pluginName === 'CellMenu' ||
        this.pluginName === 'ContextMenu' ||
        (addonOptions as CellMenu | ContextMenu)?.autoAdjustDrop ||
        (addonOptions as CellMenu | ContextMenu)?.dropDirection
      ) {
        availableSpaceBottom = parentSpaceBottom + dropOffset - rowHeight;
        availableSpaceTop = parentSpaceTop - dropOffset + rowHeight;
      }
      const dropPosition = availableSpaceBottom < menuHeight && availableSpaceTop > availableSpaceBottom ? 'top' : 'bottom';
      if (dropPosition === 'top' || (addonOptions as CellMenu | ContextMenu)?.dropDirection === 'top') {
        menuElm.classList.remove('dropdown');
        menuElm.classList.add('dropup');
        if (isSubMenu) {
          menuOffsetTop -= menuHeight - dropOffset - parentElm.clientHeight;
        } else {
          menuOffsetTop -= menuHeight - dropOffset;
        }
      } else {
        menuElm.classList.remove('dropup');
        menuElm.classList.add('dropdown');
        if (this.pluginName === 'CellMenu' || this.pluginName === 'ContextMenu') {
          menuOffsetTop = menuOffsetTop + dropOffset;
          if (this.pluginName === 'CellMenu') {
            if (isSubMenu) {
              menuOffsetTop += dropOffset;
            } else {
              menuOffsetTop += rowHeight + dropOffset;
            }
          }
        }
      }

      // when auto-align is set, it will calculate whether it has enough space in the viewport to show the drop menu on the right (default)
      // if there isn't enough space on the right, it will automatically align the drop menu to the left
      // to simulate an align left, we actually need to know the width of the drop menu
      if (
        (addonOptions as HeaderMenu)?.autoAlign ||
        (addonOptions as CellMenu | ContextMenu)?.autoAlignSide ||
        (addonOptions as CellMenu | ContextMenu)?.dropSide === 'left'
      ) {
        let subMenuPosCalc = menuOffsetLeft + Number(menuWidth); // calculate coordinate at caller element far right
        if (isSubMenu) {
          subMenuPosCalc += parentElm.clientWidth;
        }
        const gridPos = this.grid.getGridPosition();
        const browserWidth = document.documentElement.clientWidth;
        const dropSide = subMenuPosCalc >= gridPos.width || subMenuPosCalc >= browserWidth ? 'left' : 'right';

        let needHeaderMenuOffsetLeftRecalc = false;
        if (dropSide === 'left' || (!isSubMenu && (addonOptions as CellMenu | ContextMenu)?.dropSide === 'left')) {
          menuElm.classList.remove('dropright');
          menuElm.classList.add('dropleft');
          if (this.pluginName === 'HeaderMenu') {
            if (isSubMenu) {
              menuOffsetLeft -= menuWidth;
            } else {
              needHeaderMenuOffsetLeftRecalc = true;
            }
          } else if (this.pluginName === 'CellMenu' && !isSubMenu) {
            const parentCellWidth = parentElm.offsetWidth || 0;
            menuOffsetLeft -= Number(menuWidth) - parentCellWidth - sideOffset;
          } else if (this.pluginName !== 'GridMenu' || (this.pluginName === 'GridMenu' && isSubMenu)) {
            menuOffsetLeft -= Number(menuWidth) - sideOffset;
          }
        } else {
          menuElm.classList.remove('dropleft');
          menuElm.classList.add('dropright');
          if (isSubMenu) {
            menuOffsetLeft += sideOffset + parentElm.offsetWidth;
          } else {
            if (this.pluginName === 'HeaderMenu') {
              needHeaderMenuOffsetLeftRecalc = true;
            } else {
              menuOffsetLeft += sideOffset;
            }
          }
        }

        if (needHeaderMenuOffsetLeftRecalc) {
          menuOffsetLeft = relativePos?.left ?? 0;
          if ((addonOptions as HeaderMenu)?.autoAlign && gridPos?.width && menuOffsetLeft + (menuElm.clientWidth ?? 0) >= gridPos.width) {
            menuOffsetLeft =
              menuOffsetLeft + targetElm.clientWidth - menuElm.clientWidth + ((addonOptions as HeaderMenuOption)?.autoAlignOffset || 0);
          }
        }
      }

      // ready to reposition the menu
      menuElm.style.top = `${menuOffsetTop}px`;
      menuElm.style.left = `${menuOffsetLeft}px`;

      if (this.pluginName === 'GridMenu') {
        menuElm.style.opacity = '1';
        menuElm.style.display = 'block';
      }
    }
  }
}
