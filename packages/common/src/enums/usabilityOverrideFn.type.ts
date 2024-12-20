import type { SlickGrid } from '../core/index.js';

export type UsabilityOverrideFn = (row: number, dataContext: any, grid: SlickGrid) => boolean;
