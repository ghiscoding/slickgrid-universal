import type { SlickGrid } from '../core/slickGrid.js';
import type { Column, HeaderButtonItem } from './index.js';

export interface HeaderButtonOnCommandArgs {
  grid: SlickGrid;
  column: Column;
  command: string;
  button: HeaderButtonItem;
}
