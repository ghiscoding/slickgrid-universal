import type { Column, CompositeEditorOption, ElementPosition } from './index';
import type { PositionMethod } from '../enums/positionMethod.type';
import type { SlickDataView, SlickEventData, SlickGrid } from '../core/index';

export interface EditorArguments {
  /** Column Definition */
  column: Column;

  /** Column MetaData */
  columnMetaData?: any;

  /** Editor HTML DOM element container */
  container: HTMLElement;

  /** Slick DataView */
  dataView?: SlickDataView;

  /** Event that was triggered */
  event: Event | SlickEventData;

  /** Slick Grid object */
  grid: SlickGrid;

  /** Grid Position */
  gridPosition: ElementPosition;

  /** Item DataContext */
  item?: any;

  /** Editor Position  */
  position: PositionMethod | ElementPosition;

  /** When it's a Composite Editor (that is when it's an Editor created by the Composite Editor Modal window) */
  compositeEditorOptions?: CompositeEditorOption;

  // ---
  // Available Methods
  // ------------------

  /** Cancel changes callback method that will execute after user cancels an edit */
  cancelChanges: () => void;

  /** Commit changes callback method that will execute after user commits the changes */
  commitChanges: () => void;
}
