import { AppTask, type Constructable, CustomElement, IAurelia, resolve, singleton } from 'aurelia';

import type { AureliaViewOutput, ViewModelBindableInputData } from '../models/index.js';

@singleton()
export class AureliaUtilService {
  constructor(private readonly au: IAurelia = resolve(IAurelia)) {}

  async createAureliaViewModelAddToSlot(
    viewModel: Constructable,
    bindableData?: ViewModelBindableInputData,
    targetElement?: HTMLElement
  ): Promise<AureliaViewOutput | null> {
    if (targetElement) {
      const def = CustomElement.getDefinition(viewModel);
      const addonBindable = bindableData?.addon ? 'addon.bind="bindableData.addon"' : '';
      const gridBindable = bindableData?.grid ? 'grid.bind="bindableData.grid"' : '';
      const dataViewBindable = bindableData?.dataView ? 'data-view.bind="bindableData.dataView"' : '';
      const parentBindable = bindableData?.parentRef ? 'parent-ref.bind="bindableData.parentRef"' : '';

      targetElement.innerHTML =
        `<${def.name} model.bind="bindableData.model" ${addonBindable} ${gridBindable} ${dataViewBindable} ${parentBindable}></${def.name}>`.trim();

      return await this.au.enhance({
        host: targetElement,
        component: { bindableData },
        container: this.au.container.createChild().register(AppTask.creating(() => {})),
      });
    }
    return null;
  }
}
