export interface ContainerInstance {
  key: any;
  instance: any;
}

export class ContainerService {
  get<T = any>(_key: any): T | null {
    throw new Error('ContainerService "get" method must be implemented');
  }

  registerInstance(_key: any, _instance: any): void {
    throw new Error('ContainerService "registerInstance" method must be implemented');
  }
}

/** A registry of existing instances. Clearing it does not dispose the instances. */
export class MapContainerService implements ContainerService {
  protected readonly _dependencies: Map<string, any> = new Map();

  constructor(protected readonly _replaceExisting = true) {}

  get<T = any>(key: string): T | null {
    return this._dependencies.get(key) ?? null;
  }

  registerInstance(key: string, instance: any): void {
    if (this._replaceExisting || !this._dependencies.has(key)) {
      this._dependencies.set(key, instance);
    }
  }

  dispose(): void {
    this._dependencies.clear();
  }
}
