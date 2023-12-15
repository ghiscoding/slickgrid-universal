import type { Column, HeaderButtonItem } from './index';
import type { SlickGrid } from '../core/index';

export interface HeaderButtonOnCommandArgs {
  grid: SlickGrid;
  column: Column;
  command: string;
  button: HeaderButtonItem;
}
