import type { ContainerInstance, ContainerService } from '@slickgrid-universal/common';

export class ContainerServiceStub implements ContainerService {
  dependencies: ContainerInstance[] = [];

  get<T = any>(key: string): T | null {
    const dependency = this.dependencies.find((dep) => dep.key === key);
    if (dependency?.instance) {
      return dependency.instance;
    }
    return null;
  }

  getAll(): ContainerInstance[] {
    return this.dependencies;
  }

  registerInstance(key: string, instance: any) {
    const dependency = this.dependencies.find((dep) => dep.key === key);
    if (!dependency) {
      this.dependencies.push({ key, instance });
    }
  }
}
