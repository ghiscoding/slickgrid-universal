import type { Column, GridOption } from './index.js';

export type GroupTotalsFormatter = (totals: any, columnDef: Column, gridOptions: GridOption) => string | HTMLElement;
