import type { SlickGrid } from 'slickgrid';

import type { Column, GridOption } from './index';

export type SlickGridUniversal<T = any, C extends Column<T> = Column<T>, O extends GridOption<C> = GridOption<C>> = SlickGrid<T, C, O>;
