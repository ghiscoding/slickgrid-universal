import type { Column } from './column.interface';
import type { HeaderButtonItem } from './headerButtonItem.interface';
import type { SlickGrid } from './slickGrid.interface';

export interface HeaderButtonOnCommandArgs {
  grid: SlickGrid;
  column: Column;
  command: string;
  button: HeaderButtonItem;
}
