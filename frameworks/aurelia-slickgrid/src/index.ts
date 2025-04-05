export * from '@slickgrid-universal/common';
import type { IContainer } from 'aurelia';
import { AureliaSlickgridCustomElement } from './custom-elements/aurelia-slickgrid';
import { SlickgridConfig } from './slickgrid-config';

export const AureliaSlickGridConfiguration = {
  register(container: IContainer): IContainer {
    return container.register(AureliaSlickgridCustomElement);
  },

  customize(optionsProvider: (config: SlickgridConfig) => void) {
    return {
      register(container: IContainer): IContainer {
        const options = container.get(SlickgridConfig);
        optionsProvider(options);
        return AureliaSlickGridConfiguration.register(container);
      },
    };
  }
};

export { AureliaSlickgridCustomElement } from './custom-elements/aurelia-slickgrid';
import type {
  AureliaGridInstance,
  AureliaViewOutput,
  GridOption,
  RowDetailView,
  ViewModelBindableData,
  ViewModelBindableInputData
} from './models/index';

// re-export only the Aurelia interfaces (models), some of which were overriden from Slickgrid-Universal
export {
  type AureliaGridInstance,
  type AureliaViewOutput,
  type GridOption,
  type RowDetailView,
  type ViewModelBindableData,
  type ViewModelBindableInputData,
  SlickgridConfig
};

// expose all public classes
export {
  AureliaUtilService,
  TranslaterService,
  disposeAllSubscriptions
} from './services/index';
export { SlickRowDetailView } from './extensions/slickRowDetailView'
