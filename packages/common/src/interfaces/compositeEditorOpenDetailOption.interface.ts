import type { CompositeEditorModalType } from '../enums/compositeEditorModalType.type';
import type { CompositeEditorLabel } from './compositeEditorLabel.interface';
import type { GridServiceInsertOption } from './gridServiceInsertOption.interface';

export type OnErrorOption = {
  /** Error code (typically an uppercase error code key like: "NO_RECORD_FOUND") */
  code?: string;

  /** Error Message */
  message: string;

  /** Error Type (info, error, warning) */
  type: 'error' | 'info' | 'warning';
};

export interface CompositeEditorSelection {
  gridRowIndexes: number[];
  dataContextIds: Array<number | string>;
}

export interface CompositeEditorOpenDetailOption {
  /**
   * Composite Editor modal header title with support to optional parsing and HTML rendering of any item property pulled from the dataContext, via template {{ }}
   * for example:
   * - {{title}} => would display the item title, or you could even parse complex object like {{product.name}} => displays the item product name
   * - Editing (id: <i>{{id}}</i>) => would display the "Editing (id: 123)" where the Id has italic font style
   */
  headerTitle?: string;

  /** Override the header title of the "mass-update" modal type, mostly used in combo when passing modal type as "modal" (auto-detect type), it will automatically detect the modal type ("mass-update" or "mass-selection")  */
  headerTitleMassUpdate?: string;

  /** Override the header title of the "mass-selection" modal type, mostly used in combo when passing modal type as "modal" (auto-detect type), it will automatically detect the modal type ("mass-selection" or "mass-selection")  */
  headerTitleMassSelection?: string;

  /** Defaults to "static", when backdrop is set to "static", the modal will not close when clicking outside of it. */
  backdrop?: 'static' | null;

  /** Optional insert options, for example what position in the grid do we want to insert (top/bottom), do we want to highlight, etc... */
  insertOptions?: GridServiceInsertOption;

  /** Defaults to (dataset length + 1), what is the default insert Id to use when creating a new item? */
  insertNewId?: number;

  /** All the text labels that can be customized */
  labels?: CompositeEditorLabel;

  /**
   * Defaults to "edit", Composite Editor modal type (create, edit, mass, mass-update, mass-selection).
   *
   * NOTE that the type "mass" is an auto-detect type, it will automatically detect if it should use "mass-update" or "mass-selection",
   * it does this by detecting if there's any row selected in the grid (if so the type will be "mass-selection" or "mass-update")
   */
  modalType?: CompositeEditorModalType;

  /**
   * Defaults is false, when set to true it would remove disabled blank field from the form values
   * For example if we disable a "DateCreated" field, it will blank the value and by default add it to the FormValues object as `formValues = { dateCreated: '' }`
   */
  excludeDisabledFieldFormValues?: boolean;

  /** Optional provide a CSS class by the reset button shown beside each editor */
  resetEditorButtonCssClass?: string;

  /** Optionally provide a CSS class by the form reset button */
  resetFormButtonIconCssClass?: string;

  /**
   * Defaults to false, do we want to provide a preview of what the dataset with the applied Mass changes (works for both Mass Update and/or Mass Selection)?
   * If set to true, then it would provide a 3rd argument to the `onSave` callback even before sending the data to the server.
   * This could be useful to actually use this dataset preview to send directly to the backend server.
   */
  shouldPreviewMassChangeDataset?: boolean;

  /** Defaults to true, do we want the close button outside the modal (true) or inside the header modal (false)?  */
  showCloseButtonOutside?: boolean;

  /** Defaults to false, show a reset button beside each editor input */
  showResetButtonOnEachEditor?: boolean;

  /** Defaults to false, show a single form reset button at bottom of the form (or inside the form footer) */
  showFormResetButton?: boolean;

  /** Defaults to true, do we want to clear the row selections (after save) when executed by any of the mass change actions (Mass-Update or Update-Selected) */
  shouldClearRowSelectionAfterMassAction?: boolean;

  /**
   * Defaults to 1, how many columns do we want to show in the view layout?
   * For example if you wish to see your form split in a 2 columns layout (split view).
   * The 'auto' mode will display a 1 column layout for 8 or less Editors, 2 columns layout for less than 15 Editors or 3 columns when more than 15 Editors
   */
  viewColumnLayout?: 1 | 2 | 3 | 'auto';

  // ---------
  // Methods
  // ---------

  /** onBeforeOpen callback allows the user to optionally execute something before opening the modal (for example cancel any batch edits, or change/reset some validations in column definitions) */
  onBeforeOpen?: () => void;

  /**
   * onClose callback allows user to add a confirm dialog or any other code before closing the modal window, returning false will cancel the modal closing.
   * NOTE: this won't be called when there's no changes done in the form.
   */
  onClose?: () => Promise<boolean>;

  /** onError callback allows user to override what the system does when an error (error message & type) is thrown, defaults to console.log */
  onError?: (error: OnErrorOption) => void;

  /** onRendered callback allows the user to optionally execute something after the modal is created and rendered in the DOM (for example add Bootstrap `bs-data-theme="dark"` attribute to the modal element) */
  onRendered?: (modalElm: HTMLDivElement) => void;

  /**
   * onSave callback will be triggered (when defined) after user clicked the save/apply button,
   * this callback is used when connecting a backend server with custom code to execute after clicking the save/apply button
   */
  onSave?: (
    /** object containing all composite editor form values, each value is defined by its column id */
    formValues: any,

    /** current selection of row indexes & data context Ids */
    selection: CompositeEditorSelection,

    /**
     * optional item data context when the modal type is (clone, create or edit)
     * OR a preview of the updated dataset when modal type is (mass-update or mass-selection).
     * NOTE: the later requires `shouldPreviewMassChangeDataset` to be enabled since it could be resource heavy with large dataset.
     */
    dataContextOrUpdatedDatasetPreview?: any | any[],
  ) => Promise<boolean> | boolean;

  /**
   * Optional callback that the user can add before applying the change to all item rows,
   * if this callback returns False then the change will NOT be applied to the given field,
   * or if on the other end it returns True or `undefined` then it assumes that it is valid and it should apply the change to the item dataContext.
   * This callback works for both Mass Selection & Mass Update.
   * @param {String} fieldName - field property name being validated
   * @param {*} dataContext - item object data context
   * @param {*} formValues - all form input and values that were changed
   * @returns {Boolean} - returning False means we can't apply the change, else we go ahead and apply the change
   */
  validateMassUpdateChange?: (fieldName: string, dataContext: any, formValues: any) => boolean;
}
