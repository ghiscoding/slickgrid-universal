import type { ContainerService as UniversalContainerService } from '@slickgrid-universal/common';
import { IContainer, Registration, resolve, transient } from 'aurelia';

@transient()
export class ContainerService implements UniversalContainerService {
  constructor(private readonly container: IContainer = resolve(IContainer)) { }

  get<T = any>(key: string): T | null {
    try {
      return this.container.get(key) as T;
    } catch (_) {
      return null;
    }
  }

  registerInstance(key: string, instance: any) {
    this.container.register(Registration.instance(key, instance));
  }
}
