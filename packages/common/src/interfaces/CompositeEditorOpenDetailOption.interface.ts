import { CompositeEditorModalType } from '../enums/compositeEditorModalType.type';
import { GridServiceInsertOption } from './gridServiceInsertOption.interface';

export interface CompositeEditorOpenDetailOption {
  /**
   * Composite Editor modal header title with support to optional parsing and HTML rendering of any item property pulled from the dataContext, via template #{}
   * for example:
   * - #{title} => would display the item title, or you could even parse complex object like #{product.name} => displays the item product name
   * - Editing (id: <i>#{id}</i>) => would display the "Editing (id: 123)" where the Id has italic font style
   */
  headerTitle: string;

  /** When backdrop is set to "static", the modal will not close when clicking outside it. Default is undefined, which mean clicking outside the modal will close it */
  backdrop?: 'static' | null;

  /** Do we have the close button outside or inside the modal? Defaults to false (inside) */
  closeOutside?: boolean;

  /** Defaults to "bottom", which position in the grid do we want to insert and show the new row (on top or bottom of the grid) */
  insertOptions?: GridServiceInsertOption;

  /** what is the default insert Id to use when creating a new item? Defaults to dataset length + 1. */
  insertNewId?: number;

  /** Composite Editor modal type (create, edit, mass-update, mass-selection) */
  modalType?: CompositeEditorModalType;

  /**
   * Defaults to 1, how many columns do we want to show in the view layout?
   * For example if you wish to see your form split in a 2 columns layout (split view)
   */
  viewColumnLayout?: 1 | 2 | 3;

  /** onError callback allows user to override what the system does when an error (error message & type) is thrown, defaults to console.log */
  onError?: (errorMsg: string, errorType: 'error' | 'info' | 'warning') => void;
}
