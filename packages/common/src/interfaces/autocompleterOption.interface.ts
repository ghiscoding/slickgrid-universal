import type { AutocompleteItem, AutocompleteSettings } from 'autocompleter';
import type { Column } from './column.interface.js';

export interface AutoCompleterRenderItemDefinition {
  /** which custom Layout to use? We created 2 custom styled layouts "twoRows" and "fourCorners", both layouts also support an optional icon on the left. */
  layout: 'twoRows' | 'fourCorners';

  /** templateCallback must be a callback function returning the renderItem template string that is used to dislay each row of the AutoComplete result */
  templateCallback: (item: any) => string;
}

export type AutocompleteSearchItem =
  | {
      [labelName: string]: string;
    }
  | string;

export interface AutocompleterOption<T extends AutocompleteItem = any> extends Partial<AutocompleteSettings<T>> {
  /** defaults to false, force the user to start typing a value in the search input */
  forceUserInput?: boolean;

  /** defaults to false, do we want to hide the clear date button? */
  hideClearButton?: boolean;

  /**
   * renderItem option is to simply provide a Template and decide which custom Layout to use
   *
   * Note that this "renderItem" is just a shortcut and can be done with the following code:
   * editor: { options: { className: { 'autocomplete': 'autocomplete-custom-2rows', render: (item: any) => this.renderItemCallbackWith2Rows(ul, item) }}
   */
  renderItem?: AutoCompleterRenderItemDefinition;

  /**
   * defaults to false, do we want to trigger editor/filter callback on every stroke?
   * Typically the answer is No, but it can be useful in unit tests
   */
  triggerOnEveryKeyStroke?: boolean;

  // --
  // Events / Methods
  // -----------------

  /**
   * Triggered when a value is selected from the autocomplete list.
   * This is the same as the "select" callback and was created so that user don't overwrite exclusive usage of the "select" callback.
   * Also compare to the "select", it has some extra arguments which are: row, cell, column, dataContext
   */
  onSelectItem?: (item: any, row: number | undefined, cell: number | undefined, columnDef: Column, dataContext: any) => void;
}
