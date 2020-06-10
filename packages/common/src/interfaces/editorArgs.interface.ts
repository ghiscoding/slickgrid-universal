import { Column, ElementPosition } from './index';
import { SlickGrid } from './slickGrid.interface';

export interface EditorArgs {
  /** Column Definition */
  column: Column;

  /** Editor HTML DOM element container */
  container: HTMLDivElement;

  /** SlickGrid Grid Object */
  grid: SlickGrid;

  /** Grid Position (x, y) coordinates */
  gridPosition: ElementPosition;

  /** Item object */
  item: any;

  /** Position (x, y) coordinates of the Editor position */
  position: ElementPosition;

  // ---
  // Available Methods
  // ------------------

  /** Cancel changes callback method that will execute after user cancels an edit */
  cancelChanges?: () => void;

  /** Commit changes callback method that will execute after user commits the changes */
  commitChanges?: () => void;
}
