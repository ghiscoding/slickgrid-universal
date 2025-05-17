import type { IAppRoot, ICustomElementController } from '@aurelia/runtime-html';

export interface AureliaViewOutput {
  controller?: ICustomElementController<any>;
  root?: IAppRoot<object>;
}
