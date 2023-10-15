import type { Column, SlickGridModel } from './index';

export type GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGridModel) => string;
