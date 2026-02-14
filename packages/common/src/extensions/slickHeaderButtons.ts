import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickEventHandler, type SlickEventData, type SlickGrid } from '../core/index.js';
import type { ExtensionUtility } from '../extensions/extensionUtility.js';
import type {
  Column,
  DOMEvent,
  DOMMouseOrTouchEvent,
  HeaderButton,
  HeaderButtonItem,
  HeaderButtonOnCommandArgs,
  HeaderButtonOption,
  OnHeaderCellRenderedEventArgs,
} from '../interfaces/index.js';
import type { SharedService } from '../services/shared.service.js';
import { MenuBaseClass, type ExtendableItemTypes, type ExtractMenuType, type MenuType } from './menuBaseClass.js';

/**
 * A plugin to add custom buttons to column headers.
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.columnDefinitions = [{
 *     id: 'myColumn', name: 'My column',
 *     header: {
 *       buttons: [{ ...button options... }, { ...button options... }]
 *     }
 *   }];
 */
export class SlickHeaderButtons extends MenuBaseClass<HeaderButton> {
  protected _buttonElms: HTMLLIElement[] = [];
  protected _defaults = {
    buttonCssClass: 'slick-header-button',
  } as HeaderButtonOption;
  readonly pluginName = 'HeaderButtons';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService
  ) {
    super(extensionUtility, pubSubService, sharedService);
    this._menuCssPrefix = 'slick-header-button';
    this._camelPluginName = 'headerButtons';
    this._bindEventService = new BindingEventService();
    this._eventHandler = new SlickEventHandler();
    this.init(sharedService.gridOptions.headerButton);
  }

  get addonOptions(): HeaderButton {
    return this._addonOptions as HeaderButton;
  }
  set addonOptions(newOptions: HeaderButton) {
    this._addonOptions = newOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get grid(): SlickGrid {
    return this.sharedService.slickGrid;
  }

  /** Initialize plugin. */
  init(headerButtonOptions?: HeaderButton): void {
    this._addonOptions = { ...this._defaults, ...headerButtonOptions };

    this._eventHandler.subscribe(this.grid.onHeaderCellRendered, this.handleHeaderCellRendered.bind(this));
    this._eventHandler.subscribe(this.grid.onBeforeHeaderCellDestroy, this.handleBeforeHeaderCellDestroy.bind(this));

    // force the grid to re-render the header after the events are hooked up.
    this.grid.updateColumns();
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose(): void {
    super.dispose();
    this._buttonElms.forEach((elm) => elm.remove());
  }

  // --
  // event handlers
  // ------------------

  /**
   * Event handler when column title header are being rendered
   * @param {Object} event - The event
   * @param {Object} args - object arguments
   */
  protected handleHeaderCellRendered(_e: SlickEventData, args: OnHeaderCellRenderedEventArgs): void {
    const column = args.column;

    if (column.header?.buttons && Array.isArray(column.header.buttons)) {
      let i = column.header.buttons.length;
      while (i--) {
        const buttonItem = column.header.buttons[i];
        const itemElm = this.populateSingleCommandOrOptionItem(
          'command',
          this.addonOptions,
          null,
          buttonItem,
          args,
          this.handleButtonClick.bind(this)
        );

        // Header Button can have an optional handler
        if (itemElm && buttonItem.handler && !buttonItem.disabled) {
          this._bindEventService.bind(itemElm, 'click', ((e: DOMMouseOrTouchEvent<HTMLDivElement>) =>
            buttonItem.handler!.call(this, e)) as EventListener);
        }

        if (itemElm) {
          this._buttonElms.push(itemElm);
          args.node.appendChild(itemElm);
        }
      }
    }
  }

  /**
   * Event handler before the header cell is being destroyed
   * @param {Object} event - The event
   * @param {Object} args.column - The column definition
   */
  protected handleBeforeHeaderCellDestroy(_e: SlickEventData, args: { column: Column; node: HTMLElement }): void {
    const column = args.column;

    if (column.header?.buttons && this._addonOptions?.buttonCssClass) {
      // Removing buttons will also clean up any event handlers and data.
      // NOTE: If you attach event handlers directly or using a different framework,
      //       you must also clean them up here to avoid memory leaks.
      const buttonCssClass = (this._addonOptions?.buttonCssClass || '').replace(/(\s+)/g, '.');
      if (buttonCssClass) {
        args.node.querySelectorAll(`.${buttonCssClass}`).forEach((elm) => elm.remove());
      }
    }
  }

  protected handleButtonClick(
    event: DOMEvent<HTMLDivElement>,
    _type: MenuType,
    button: ExtractMenuType<ExtendableItemTypes, MenuType>,
    level: number,
    columnDef?: Column
  ): void {
    if ((button as HeaderButtonItem).command && !(button as HeaderButtonItem).disabled) {
      const command = (button as HeaderButtonItem).command || '';

      const callbackArgs = {
        grid: this.grid,
        column: columnDef,
        button,
      } as HeaderButtonOnCommandArgs;

      if (command) {
        callbackArgs.command = command;
      }

      // execute action callback when defined
      if (typeof (button as HeaderButtonItem).action === 'function' && !(button as HeaderButtonItem).disabled) {
        (button as HeaderButtonItem).action!.call(this, event, callbackArgs);
      }

      if (command !== null && !(button as HeaderButtonItem).disabled && this._addonOptions?.onCommand) {
        this.pubSubService.publish('onHeaderButtonCommand', callbackArgs);
        this._addonOptions.onCommand(event as any, callbackArgs);

        // Update the header in case the user updated the button definition in the handler.
        if (columnDef?.id) {
          this.grid.updateColumnHeader(columnDef.id);
        }
      }
    }

    // Stop propagation so that it doesn't register as a header click event.
    event.preventDefault();
    event.stopPropagation();
  }
}
