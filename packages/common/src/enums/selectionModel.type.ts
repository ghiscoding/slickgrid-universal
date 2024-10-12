import type { SlickEvent, SlickRange } from '../core/index.js';
import type { SlickPlugin } from '../interfaces/index.js';

export type SelectionModel = SlickPlugin & {
  refreshSelections: () => void;
  onSelectedRangesChanged: SlickEvent<SlickRange[]>;
  getSelectedRanges: () => SlickRange[];
  setSelectedRanges: (ranges: SlickRange[], caller?: string) => void;
};
