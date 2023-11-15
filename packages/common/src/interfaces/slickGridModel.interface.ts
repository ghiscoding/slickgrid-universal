
import type { SlickGrid } from '../core/slick.grid';
import type { Column, GridOption } from './index'; // test

export type SlickGridModel<T = any, C extends Column<T> = Column<T>, O extends GridOption<C> = GridOption<C>> = SlickGrid<T, C, O>;
