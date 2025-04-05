import type { SlickDataView, SlickGrid } from '@slickgrid-universal/common';

export interface ViewModelBindableInputData {
  model: any;
  addon: any;
  grid: SlickGrid;
  dataView: SlickDataView;
  parent?: any;
}
