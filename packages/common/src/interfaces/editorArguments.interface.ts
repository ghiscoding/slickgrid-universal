import type { Column, CompositeEditorOption, ElementPosition, GridOption } from './index';
import type { PositionMethod } from '../enums/positionMethod.type';
import type { SlickDataView, SlickGrid } from '../core/index';

export interface EditorArguments<TData = any, C extends Column<TData> = Column<TData>, O extends GridOption<C> = GridOption<C>> {
  /** Column Definition */
  column: Column;

  /** Column MetaData */
  columnMetaData: any;

  /** Editor HTML DOM element container */
  container: HTMLDivElement;

  /** Slick DataView */
  dataView?: SlickDataView;

  /** Event that was triggered */
  event: Event;

  /** Slick Grid object */
  grid: SlickGrid<TData, C, O>;

  /** Grid Position */
  gridPosition: ElementPosition;

  /** Item DataContext */
  item: any;

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
