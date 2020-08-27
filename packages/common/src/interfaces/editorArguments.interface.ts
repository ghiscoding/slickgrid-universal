import { Column, CompositeEditorOption, ElementPosition, SlickDataView, SlickGrid } from './index';

export interface EditorArguments {
  /** Column Definition */
  column: Column;

  /** Column MetaData */
  columnMetaData: any;

  /** Cell Container DOM Element of where the Editor will be created */
  container: HTMLDivElement;

  /** Slick DataView */
  dataView: SlickDataView;

  /** Event that was triggered */
  event: Event;

  /** Slick Grid object */
  grid: SlickGrid;

  /** Grid Position */
  gridPosition: ElementPosition;

  /** Item DataContext */
  item: any;

  /** Editor Position  */
  position: ElementPosition;

  /** When it's a Composite Editor (that is when it's an Editor created by the Composite Editor Modal window) */
  compositeEditorOptions?: CompositeEditorOption;

  // methods

  /** Cancel the Editor Changes */
  cancelChanges: () => void;

  /** Commit the Editor Changes */
  commitChanges: () => void;
}
