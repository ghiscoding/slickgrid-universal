import type { Column, HeaderButtonItem, SlickGridModel } from './index';

export interface HeaderButtonOnCommandArgs {
  grid: SlickGridModel;
  column: Column;
  command: string;
  button: HeaderButtonItem;
}
