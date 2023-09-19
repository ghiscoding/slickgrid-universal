import type { Column, SlickGridUniversal } from './index';

export type GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGridUniversal) => string;
