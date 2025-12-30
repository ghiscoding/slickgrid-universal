export * from '@slickgrid-universal/common';

// Public classes.
export type { AngularComponentOutput, AngularGridInstance, GridOption, RowDetailView } from './models/index';
export { AngularUtilService, unsubscribeAllObservables } from './services/index';

// components & module
export { SlickgridConfig } from './slickgrid-config';
export type { AngularSlickgridOutputs } from './components/angular-slickgrid-outputs.interface';
export { AngularSlickgridComponent } from './components/angular-slickgrid.component';
export { AngularSlickgridModule } from './modules/angular-slickgrid.module';
