import {
  Column,
  DOMEvent,
  GetSlickEventType,
  HeaderButton,
  HeaderButtonItem,
  HeaderButtonOnCommandArgs,
  HeaderButtonOption,
  OnHeaderCellRenderedEventArgs,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { BindingEventService } from '../services/bindingEvent.service';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

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
export class HeaderButtonPlugin {
  protected _addonOptions?: HeaderButton;
  protected _bindEventService: BindingEventService;
  protected _eventHandler!: SlickEventHandler;
  protected _buttonElms: HTMLDivElement[] = [];
  protected _defaults = {
    buttonCssClass: 'slick-header-button',
  } as HeaderButtonOption;
  pluginName: 'HeaderButtons' = 'HeaderButtons';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(protected readonly extensionUtility: ExtensionUtility, protected readonly pubSubService: PubSubService, protected readonly sharedService: SharedService) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
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
  init(headerButtonOptions?: HeaderButton) {
    this._addonOptions = { ...this._defaults, ...headerButtonOptions };

    const onHeaderCellRenderedHandler = this.grid.onHeaderCellRendered;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onHeaderCellRenderedHandler>>).subscribe(onHeaderCellRenderedHandler, this.handleHeaderCellRendered.bind(this));

    const onBeforeHeaderCellDestroyHandler = this.grid.onBeforeHeaderCellDestroy;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeHeaderCellDestroyHandler>>).subscribe(onBeforeHeaderCellDestroyHandler, this.handleBeforeHeaderCellDestroy.bind(this));

    // force the grid to re-render the header after the events are hooked up.
    this.grid.setColumns(this.grid.getColumns());
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose() {
    this._eventHandler?.unsubscribeAll();
    this._bindEventService.unbindAll();
    this._buttonElms.forEach(elm => elm.remove());
  }

  // --
  // event handlers
  // ------------------

  /**
   * Event handler when column title header are being rendered
   * @param {Object} event - The event
   * @param {Object} args - object arguments
   */
  protected handleHeaderCellRendered(_e: Event, args: OnHeaderCellRenderedEventArgs) {
    const column = args.column;

    if (column.header?.buttons && Array.isArray(column.header.buttons)) {
      // Append buttons in reverse order since they are floated to the right.
      let i = column.header.buttons.length;
      while (i--) {
        const button = column.header.buttons[i];
        // run each override functions to know if the item is visible and usable
        const isItemVisible = this.extensionUtility.runOverrideFunctionWhenExists<typeof args>(button.itemVisibilityOverride, args);
        const isItemUsable = this.extensionUtility.runOverrideFunctionWhenExists<typeof args>(button.itemUsabilityOverride, args);

        // if the result is not visible then there's no need to go further
        if (!isItemVisible) {
          continue;
        }

        // when the override is defined, we need to use its result to update the disabled property
        // so that 'handleMenuItemCommandClick' has the correct flag and won't trigger a command clicked event
        if (typeof button === 'object' && button.itemUsabilityOverride) {
          button.disabled = isItemUsable ? false : true;
        }

        const buttonDivElm = document.createElement('div');
        buttonDivElm.className = this._addonOptions?.buttonCssClass ?? '';

        if (button.disabled) {
          buttonDivElm.classList.add('slick-header-button-disabled');
        }

        if (button.showOnHover) {
          buttonDivElm.classList.add('slick-header-button-hidden');
        }

        if (button.image) {
          console.warn('[Slickgrid-Universal] The "image" property of a Header Button is now deprecated and will be removed in future version, consider using "cssClass" instead.');
          buttonDivElm.style.backgroundImage = `url(${button.image})`;
        }

        if (button.cssClass) {
          buttonDivElm.classList.add(...button.cssClass.split(' '));
        }

        if (button.tooltip) {
          buttonDivElm.title = button.tooltip;
        }

        // add click event handler for user's optional command on button item clicked
        if (button.handler && !button.disabled) {
          this._bindEventService.bind(buttonDivElm, 'click', button.handler);
        }

        // add click event handler for internal command on button item clicked
        if (!button.disabled) {
          this._bindEventService.bind(buttonDivElm, 'click', (e: Event) => this.handleButtonClick(e as DOMEvent<HTMLDivElement>, button, column));
        }

        this._buttonElms.push(buttonDivElm);
        args.node.appendChild(buttonDivElm);
      }
    }
  }

  /**
   * Event handler before the header cell is being destroyed
   * @param {Object} event - The event
   * @param {Object} args.column - The column definition
   */
  protected handleBeforeHeaderCellDestroy(_e: Event, args: { column: Column; node: HTMLElement; }) {
    const column = args.column;

    if (column.header?.buttons && this._addonOptions?.buttonCssClass) {
      // Removing buttons will also clean up any event handlers and data.
      // NOTE: If you attach event handlers directly or using a different framework,
      //       you must also clean them up here to avoid memory leaks.
      const buttonCssClass = (this._addonOptions?.buttonCssClass || '').replace(/(\s+)/g, '.');
      if (buttonCssClass) {
        args.node.querySelectorAll(`.${buttonCssClass}`).forEach(elm => elm.remove());
      }
    }
  }

  protected handleButtonClick(event: DOMEvent<HTMLDivElement>, button: HeaderButtonItem, columnDef: Column) {
    if (button && !button.disabled) {
      const command = button.command || '';

      const callbackArgs = {
        grid: this.grid,
        column: columnDef,
        button,
      } as HeaderButtonOnCommandArgs;

      if (command) {
        callbackArgs.command = command;
      }

      // execute action callback when defined
      if (typeof button.action === 'function' && !button.disabled) {
        button.action.call(this, event, callbackArgs);
      }

      if (command !== null && !button.disabled && this._addonOptions?.onCommand) {
        this.pubSubService.publish('headerButton:onCommand', callbackArgs);
        this._addonOptions.onCommand(event as any, callbackArgs);

        // Update the header in case the user updated the button definition in the handler.
        this.grid.updateColumnHeader(columnDef.id);
      }
    }

    // Stop propagation so that it doesn't register as a header click event.
    event.preventDefault();
    event.stopPropagation();
  }
}