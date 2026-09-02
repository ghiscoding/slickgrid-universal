import type { SlickGrid } from '../core/slickGrid.js';

export type UsabilityOverrideFn = (row: number, dataContext: any, grid: SlickGrid) => boolean;
