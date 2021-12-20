import { SlickCellRangeSelector } from '../extensions/slickCellRangeSelector';

export type RowSelectionModelOption = {
  /** cell range selector */
  cellRangeSelector?: SlickCellRangeSelector;

  /** defaults to True, do we want to select the active row? */
  selectActiveRow?: boolean;
};
