import { SlickRowBasedEdit } from '../extensions';
import { Column } from './column.interface';
import { OnEventArgs } from './onEventArgs.interface';

export interface RowBasedEditOptions {
  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickRowBasedEdit) => void;

  /** the display name of the added actions column */
  actionsColumnLabel?: string;
  /** method called before row gets updated. Needs to return a promised boolean. True will continue; False will halt the update */
  onBeforeRowUpdated?: (args: OnEventArgs) => Promise<boolean>;
  /** whether multiple rows can be toggled into edit mode at the same itme (default: false) */
  allowMultipleRows?: boolean;

  /** Defaults to "_slick_rowbasededit_action", Row Detail column Id */
  columnId?: string;

  /**
   * Defaults to -1, the column index position in the grid by default it will show as the last column.
   * Also note that the index position might vary if you use other extensions, after each extension is created,
   * it will add an offset to take into consideration (1.CheckboxSelector, 2.RowDetail, 3.RowMove)
   */
  columnIndexPosition?: number;

  /**
   * additional column configurations for the action column. You can override the defaults by passing your own Column definition.
   */
  actionColumnConfig?: Partial<Column<any>>;

  /** Allows to override the styling and titles of the actions buttons */
  actionButtons?: {
    editButtonClassName?: string;
    iconEditButtonClassName?: string;
    editButtonTitle?: string;

    deleteButtonClassName?: string;
    iconDeleteButtonClassName?: string;
    deleteButtonTitle?: string;
    /** if defined, a confirm prompt will be shown before deleting a row */
    deleteButtonPrompt?: string;

    cancelButtonClassName?: string;
    iconCancelButtonClassName?: string;
    cancelButtonTitle?: string;
    /** if defined, a confirm prompt will be shown before canceling the changes of a row */
    cancelButtonPrompt?: string;

    updateButtonClassName?: string;
    iconUpdateButtonClassName?: string;
    updateButtonTitle?: string;
    /** if defined, a confirm prompt will be shown before saving the changes of a row */
    updateButtonPrompt?: string;
  }
}