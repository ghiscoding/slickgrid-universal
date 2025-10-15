import type { SlickGrid } from '../core/index.js';
import type { Column, CompositeEditorOption } from './index.js';

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
