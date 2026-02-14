import type { IContainer } from 'aurelia';
import { AureliaSlickgridCustomElement } from './custom-elements/aurelia-slickgrid.js';
import type {
  AureliaGridInstance,
  AureliaViewOutput,
  CreatedView,
  GridOption,
  ViewModelBindableData,
  ViewModelBindableInputData,
} from './models/index.js';
import { SlickgridConfig } from './slickgrid-config.js';

export * from '@slickgrid-universal/common';

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
  },
};

export { AureliaSlickgridCustomElement } from './custom-elements/aurelia-slickgrid.js';

// re-export only the Aurelia interfaces (models), some of which were overriden from Slickgrid-Universal
export {
  type AureliaGridInstance,
  type AureliaViewOutput,
  type CreatedView,
  type GridOption,
  type ViewModelBindableData,
  type ViewModelBindableInputData,
  SlickgridConfig,
};

// expose all public classes
export { AureliaUtilService, TranslaterService, disposeAllSubscriptions } from './services/index.js';
