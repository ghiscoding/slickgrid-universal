export interface CompositeEditorLabel {
  /** Defaults to "Cancel", override the Cancel button label */
  cancelButton?: string;

  /** Defaults to "CANCEL", translation key used for the Cancel button label. */
  cancelButtonKey?: string;

  /** Defaults to "Clone", override the Clone button label used by a modal type of "clone" */
  cloneButton?: string;

  /** Defaults to "CLONE", translation key used for the Clone button label used by a modal type of "clone" */
  cloneButtonKey?: string;

  /** Defaults to "Update Selection", override the Mass Selection button label */
  massSelectionButton?: string;

  /** Defaults to "APPLY_TO_SELECTION", translation key used for the Mass Selection button label. */
  massSelectionButtonKey?: string;

  /** Defaults to "{{selectedRowCount}} of {{totalItems}} selected", override the Mass Selection status text on the footer left side */
  massSelectionStatus?: string;

  /** Defaults to "X_OF_Y_MASS_SELECTED", translation key used for the Mass Selection status text on the footer left side */
  massSelectionStatusKey?: string;

  /** Defaults to "Mass Update", override the Mass Update button label */
  massUpdateButton?: string;

  /** Defaults to "APPLY_MASS_UPDATE", translation key used for the Mass Update button label. */
  massUpdateButtonKey?: string;

  /** Defaults to "all {{totalItems}} items", override the Mass Update status text on the footer left side */
  massUpdateStatus?: string;

  /** Defaults to "ALL_X_RECORDS_SELECTED", translation key used for the Mass Update status text on the footer left side */
  massUpdateStatusKey?: string;

  /** Defaults to "Reset Input Value", override the Reset button tooltip (title) text */
  resetEditorButtonTooltip?: string;

  /** Defaults to "RESET_INPUT_VALUE", override the Reset button tooltip (title) text */
  resetEditorButtonTooltipKey?: string;

  /** Defaults to "Reset Form", override the Reset Form button label */
  resetFormButton?: string;

  /** Defaults to "RESET_FORM", translation key used for the Reset Form button label. */
  resetFormButtonKey?: string;

  /** Defaults to "Save", override the Save button label used by a modal type of "create" or "edit" */
  saveButton?: string;

  /** Defaults to "SAVE", translation key used for the Save button label used by a modal type of "create" or "edit" */
  saveButtonKey?: string;
}
