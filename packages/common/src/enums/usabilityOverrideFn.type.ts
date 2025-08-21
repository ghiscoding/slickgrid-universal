import type { GridOption } from '../interfaces/gridOption.interface.js';

export type UsabilityOverrideFn = (row: number, dataContext: any, gridOptions: GridOption) => boolean;
