export interface ContainerInstance {
  key: string;
  instance: any;
}

export class ContainerService {
  get<T = any>(_key: string): T | null {
    throw new Error('ContainerService "get" method must be implemented');
  }

  getAll(): ContainerInstance[] {
    throw new Error('ContainerService "getAll" method must be implemented');
  }

  registerInstance(_key: string, _instance: any) {
    throw new Error('ContainerService "registerInstance" method must be implemented');
  }
}
