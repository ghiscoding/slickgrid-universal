export interface ContainerInstance {
  key: any;
  instance: any;
}

export class ContainerService {
  get<T = any>(_key: any): T | null {
    throw new Error('ContainerService "get" method must be implemented');
  }

  registerInstance(_key: any, _instance: any) {
    throw new Error('ContainerService "registerInstance" method must be implemented');
  }
}
