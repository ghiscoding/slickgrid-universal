import type { SlickDataView, SlickGrid } from '@slickgrid-universal/common';

export interface ViewModelBindableData {
  template: string;
  model: any;
  addon: any;
  grid: SlickGrid;
  dataView: SlickDataView;
  parentRef?: any;
}
