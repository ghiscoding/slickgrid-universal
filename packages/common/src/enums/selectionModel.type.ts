import type { SlickEvent, SlickRange } from '../core/index';
import type { SlickPlugin } from '../interfaces/index';

export type SelectionModel = SlickPlugin & {
  refreshSelections: () => void;
  onSelectedRangesChanged: SlickEvent<SlickRange[]>;
  getSelectedRanges: () => SlickRange[];
  setSelectedRanges: (ranges: SlickRange[], caller?: string) => void;
};
