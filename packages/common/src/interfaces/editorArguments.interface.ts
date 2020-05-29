import { Column, DataView, ElementPosition } from './index';

export interface EditorArguments {
  column: Column;
  columnMetaData: any;
  container: HTMLDivElement;
  dataView: DataView;
  event: Event;
  grid: any;
  gridPosition: ElementPosition;
  item: any;
  position: ElementPosition;

  // methods
  cancelChanges: () => void;
  commitChanges: () => void;
}
