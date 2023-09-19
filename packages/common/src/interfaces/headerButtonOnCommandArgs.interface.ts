import type { Column, HeaderButtonItem, SlickGridUniversal } from './index';

export interface HeaderButtonOnCommandArgs {
  grid: SlickGridUniversal;
  column: Column;
  command: string;
  button: HeaderButtonItem;
}
