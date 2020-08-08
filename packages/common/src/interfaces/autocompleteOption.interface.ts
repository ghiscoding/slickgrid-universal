export type JQueryAjaxFn = (request: any, response: any) => void;

export interface AutocompleteOption {
  /**
   * The classes option is used to map structural class names to theme-related class names that you define
   * For example: classes: { "ui-autocomplete": "custom-red" }
   * This means that wherever jQuery UI applies the ui-autocomplete class it should also apply "custom-red" class
   */
  classes?: { [className: string]: string };

  /** Delay to wait before showing the autocomplete list */
  delay?: number;

  /**
   * Minimum length to type in the input search value before the autocomplete starts showing and querying,
   * to avoid queries that would return too many results
   */
  minLength?: number;

  /** Source for the autocomplete list */
  source: string | any[] | JQueryAjaxFn;

  // --
  // Extra Option (outside of jQuery UI)
  // -----------------------------------

  /** defaults to false, force the user to start typing a value in the search input */
  forceUserInput?: boolean;

  /** defaults to false, will open the search list (should really only be used with a defined collection list) */
  openSearchListOnFocus?: boolean;

  // --
  // Events / Methods
  // -----------------

  /** Triggered when the input value becomes in focus */
  focus?: (e: Event, ui: any) => boolean;

  /** Triggered when user enters a search value */
  search?: (e: Event, ui: any) => boolean;

  /** Triggered when a value is selected from the autocomplete list */
  select?: (e: Event, ui: any) => boolean;
}
