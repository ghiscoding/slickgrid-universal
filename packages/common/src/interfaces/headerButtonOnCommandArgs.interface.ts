import type { Column, HeaderButtonItem } from './index.js';
import type { SlickGrid } from '../core/index.js';

export interface HeaderButtonOnCommandArgs {
  grid: SlickGrid;
  column: Column;
  command: string;
  button: HeaderButtonItem;
}
