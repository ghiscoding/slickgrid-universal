import { Column } from './column.interface';

export type JQueryAjaxFn = (request: any, response: any) => void;

export interface AutoCompleteRenderItemDefinition {
  /** which custom Layout to use? We created 2 custom styled layouts "twoRows" and "fourCorners", both layouts also support an optional icon on the left. */
  layout: 'twoRows' | 'fourCorners';

  /** templateCallback must be a callback function returning the renderItem template string that is used to dislay each row of the AutoComplete result */
  templateCallback: (item: any) => string;
}

export interface AutocompleteOption {
  /** If set to true the first item will automatically be focused when the menu is shown. */
  autoFocus?: boolean;

  /**
   * The classes option is used to map structural class names to theme-related class names that you define
   * For example: classes: { "ui-autocomplete": "custom-red" }
   * This means that wherever jQuery UI applies the ui-autocomplete class it should also apply "custom-red" class
   */
  classes?: { [className: string]: string };

  /** Delay to wait before showing the autocomplete list */
  delay?: number;

  /** Disables the autocomplete if set to `true`. */
  disabled?: boolean;

  /**
   * Minimum length to type in the input search value before the autocomplete starts showing and querying,
   * to avoid queries that would return too many results
   */
  minLength?: number;

  /** Position an element relative to another. */
  position?: {
    /** Defines which position on the element being positioned to align with the target element: "horizontal vertical" alignment. */
    my?: string;

    /** Defines which position on the target element to align the positioned element against: "horizontal vertical" alignment. */
    at?: string;

    /** Which element to position against. If you provide a selector or jQuery object, the first matching element will be used. If you provide an event object, the pageX and pageY properties will be used. */
    of?: any;

    /** When the positioned element overflows the window in some direction, move it to an alternative position. Similar to `my` and `at`, this accepts a single value or a pair for horizontal/vertical, e.g., "flip", "fit", "fit flip", "fit none". */
    collision?: string;
  };

  /** Source for the autocomplete list */
  source: string | any[] | JQueryAjaxFn;

  // --
  // Extra Option (outside of jQuery UI)
  // -----------------------------------

  /** defaults to false, force the user to start typing a value in the search input */
  forceUserInput?: boolean;

  /**
   * Defaults to false, will open the search list (should really only be used with a defined collection list).
   * Also note that if you wish to display even when the autoComplete is an empty string, you will need to adjust the "minLength" to 0.
   */
  openSearchListOnFocus?: boolean;

  /**
   * renderItem option is to simply provide a Template and decide which custom Layout to use
   *
   * Note that this "renderItem" is just a shortcut and can be done with the following code:
   * editor: { editorOptions: { classes: { 'ui-autocomplete': 'autocomplete-custom-2rows',  }, callbacks: { _renderItem: (ul: HTMLElement, item: any) => this.renderItemCallbackWith2Rows(ul, item) }}
   */
  renderItem?: AutoCompleteRenderItemDefinition;

  // --
  // Events / Methods
  // -----------------

  /** Method that controls the creation of each option in the widget's menu. The method must create a new <li> element, append it to the menu, and return it. */
  _renderItem?: (ul: any, item: any) => any;

  /** Method that controls building the widget's menu. The method is passed an empty <ul> and an array of items that match the user typed term. */
  _renderMenu?: (ul: any, items: any[]) => any;

  /** Method responsible for sizing the menu before it is displayed. */
  _resizeMenu?: () => any;

  /**
   * Which element the menu should be appended to. When the value is null, the parents of the input field will be checked for a class of ui-front.
   * If an element with the ui-front class is found, the menu will be appended to that element.
   * Regardless of the value, if no element is found, the menu will be appended to the body.
   */
  appendTo?: (selector: any) => any;

  /** Triggered when the autocomplete is created. */
  create?: (e: Event, ui: { item: any; }) => boolean;

  /** Triggered when the input value becomes in focus */
  focus?: (e: Event, ui: { item: any; }) => boolean;

  /**
   * Triggered when a value is selected from the autocomplete list.
   * This is the same as the "select" callback and was created so that user don't overwrite exclusive usage of the "select" callback.
   * Also compare to the "select", it has some extra arguments which are: row, cell, column, dataContext
   */
  onSelect?: (e: Event, ui: { item: any; }, row: number, cell: number, columnDef: Column, dataContext: any) => boolean;

  /** Triggered when the suggestion menu is opened or updated. */
  open?: (e: Event, ui: { item: any; }) => boolean;

  /**
   * Triggered after a search completes, before the menu is shown. Useful for local manipulation of suggestion data,
   * where a custom source option callback is not required. This event is always triggered when a search completes,
   * even if the menu will not be shown because there are no results or the Autocomplete is disabled.
   */
  response?: (e: Event, ui: { item: any; }) => boolean;

  /** Triggered when user enters a search value */
  search?: (e: Event, ui: { item: any; }) => boolean;

  /**
   *Triggered when focus is moved to an item (not selecting). The default action is to replace the text field's value with the value of the focused item, though only if the event was triggered by a keyboard interaction.
   * Canceling this event prevents the value from being updated, but does not prevent the menu item from being focused.
   * NOTE: this method should NOT be used since Slickgrid-Universal will use it exclusively
   * and if you do try to use it, what will happen is that it will override and break Slickgrid-Universal internal code.
   * Please use the "onSelect" which was added specifically to avoid this problem but still provide exact same result
   */
  select?: (e: Event, ui: { item: any; }) => boolean;
}
