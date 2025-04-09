import type { ContainerService as UniversalContainerService } from '@slickgrid-universal/common';

export class ContainerService implements UniversalContainerService {
  private readonly container: { [key: string]: any } = {};

  get<T = any>(key: string): T | null {
    return this.container[key];
  }

  registerInstance(key: string, instance: any) {
    this.container[key] = instance;
  }
}
