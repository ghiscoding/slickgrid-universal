import type { CompositeEditorOption } from './index';
import type { Column } from './index';
import type { SlickGrid } from '../core/index';

export interface CollectionOverrideArgs {
  /** Column Definition */
  column: Column;

  /** item data context object */
  dataContext: any;

  /** Slick Grid object */
  grid: SlickGrid;

  /** Potential Composite Editor option when triggered by the Composite Editor modal window */
  compositeEditorOptions?: Pick<CompositeEditorOption, 'formValues' | 'modalType'>;

  /** Original collection provided to the editor (without being filtered/sorted or overridden) */
  originalCollections: any[];
}