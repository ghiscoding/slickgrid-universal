import type { Column } from './column.interface.js';
import type { OnEventArgs } from './onEventArgs.interface.js';
import type { SlickRowBasedEdit } from '../extensions/slickRowBasedEdit.js';

export interface RowBasedEditOptions {
  /** the display name of the added actions column */
  actionsColumnLabel?: string;

  /** whether multiple rows can be toggled into edit mode at the same itme (default: false) */
  allowMultipleRows?: boolean;

  /**
   * additional column configurations for the action column. You can override the defaults by passing your own Column definition.
   */
  actionColumnConfig?: Partial<Column<any>>;

  /** Allows to override the styling and titles of the actions buttons */
  actionButtons?: {
    editButtonClassName?: string;
    iconEditButtonClassName?: string;
    /** The tooltip to show on the edit button */
    editButtonTitle?: string;
    /** Same as "editButtonTitle", except that it's a translation key which can be used on page load and/or when switching locale */
    editButtonTitleKey?: string;

    deleteButtonClassName?: string;
    iconDeleteButtonClassName?: string;
    /** The tooltip to show on the delete button */
    deleteButtonTitle?: string;
    /** Same as "deleteButtonTitle", except that it's a translation key which can be used on page load and/or when switching locale */
    deleteButtonTitleKey?: string;
    /** if defined, a confirm prompt will be shown before deleting a row */
    deleteButtonPrompt?: string;

    cancelButtonClassName?: string;
    iconCancelButtonClassName?: string;
    /** The tooltip to show on the cancel button */
    cancelButtonTitle?: string;
    /** Same as "cancelButtonTitle", except that it's a translation key which can be used on page load and/or when switching locale */
    cancelButtonTitleKey?: string;
    /** if defined, a confirm prompt will be shown before canceling the changes of a row */
    cancelButtonPrompt?: string;

    updateButtonClassName?: string;
    iconUpdateButtonClassName?: string;
    /** The tooltip to show on the update button */
    updateButtonTitle?: string;
    /** Same as "updateButtonTitle", except that it's a translation key which can be used on page load and/or when switching locale */
    updateButtonTitleKey?: string;
    /** if defined, a confirm prompt will be shown before saving the changes of a row */
    updateButtonPrompt?: string;
  };

  /** Defaults to "_slick_rowbasededit_action", Row Detail column Id */
  columnId?: string;

  /**
   * Defaults to -1, the column index position in the grid by default it will show as the last column.
   * Also note that the index position might vary if you use other extensions, after each extension is created,
   * it will add an offset to take into consideration (1.CheckboxSelector, 2.RowDetail, 3.RowMove)
   */
  columnIndexPosition?: number;

  /** Defaults to false, makes the column reorderable to another position in the grid. */
  reorderable?: boolean;

  // --
  // Available Callbacks

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickRowBasedEdit) => void;

  /** method called before row gets updated. Needs to return a promised boolean. True will continue; False will halt the update */
  onBeforeRowUpdated?: (args: OnEventArgs) => Promise<boolean>;

  /** method called before a row enters edit mode. */
  onBeforeEditMode?: (args: OnEventArgs) => void;
}
