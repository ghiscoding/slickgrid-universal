
import type { SlickGrid } from '../core/slickGrid';
import type { Column, GridOption } from './index';

export type SlickGridModel<T = any, C extends Column<T> = Column<T>, O extends GridOption<C> = GridOption<C>> = SlickGrid<T, C, O>;
