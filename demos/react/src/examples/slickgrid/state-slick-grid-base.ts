import type { Column, GridOption } from '@slickgrid-universal/common';

export default class BaseSlickGridState {
  dataset?: any[];
  gridOptions?: GridOption;
  columnDefinitions: Column[] = [];
}
