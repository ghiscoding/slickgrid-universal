import type { SlickEvent, SlickRange } from '../core/slickCore.js';
import type { SlickPlugin } from '../interfaces/index.js';

export type SelectionModel<T = any> = SlickPlugin & {
  refreshSelections: () => void;
  onSelectedRangesChanged: SlickEvent<SlickRange[]>;
  getOptions: () => T;
  getSelectedRanges: () => SlickRange[];
  setSelectedRanges: (ranges: SlickRange[], caller?: string, selectionMode?: string) => void;
};
