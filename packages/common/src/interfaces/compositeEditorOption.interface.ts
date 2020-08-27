import { CompositeEditorModalType } from '../enums/compositeEditorModalType.type';

export interface CompositeEditorOption {
  /** Defaults to "edit", what is the type of Composite Editor Modal is used? */
  modalType: CompositeEditorModalType;

  /** Failed Message text to display as a global validation error when there's any invalid field(s) */
  validationFailedMsg: string;

  /** Show method that could be overridden */
  show?: () => void;

  /** Hide method that could be overridden */
  hide?: () => void;

  /** Position method that could be overridden */
  position?: (newPosition: any) => void;

  /** Destroy method that could be overridden */
  destroy?: () => void;

  /**
   * Object containing all the modal form values that got changed.
   * The object is formed by the column id being the object key,
   * for example if user changed Title and Completed fields then the object will be:: { title: "Task 123", completed: true }
   */
  formValues: any;
}
