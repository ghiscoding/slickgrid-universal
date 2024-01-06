import { OnEventArgs } from './onEventArgs.interface';

export interface RowBasedEditOptions {
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

  /** Allows to override the styling and titles of the actions buttons */
  actionButtons?: {
    editButtonClassName?: string;
    iconEditButtonClassName?: string;
    editButtonTitle?: string;

    deleteButtonClassName?: string;
    iconDeleteButtonClassName?: string;
    deleteButtonTitle?: string;
    deleteButtonPrompt?: string;

    cancelButtonClassName?: string;
    iconCancelButtonClassName?: string;
    cancelButtonTitle?: string;
    cancelButtonPrompt?: string;

    updateButtonClassName?: string;
    iconUpdateButtonClassName?: string;
    updateButtonTitle?: string;
    updateButtonPrompt?: string;
  }
}