import { ContainerService } from '../container.service';

describe('Container Service', () => {
  it('should display a not implemented when calling "get" method', () => {
    expect(() => ContainerService.prototype.get!('MyService')).toThrow('ContainerService "get" method must be implemented');
  });

  it('should display a not implemented when calling "getAll" method', () => {
    expect(() => ContainerService.prototype.getAll()).toThrow('ContainerService "getAll" method must be implemented');
  });

  it('should display a not implemented when calling "registerInstance" method', () => {
    expect(() => ContainerService.prototype.registerInstance('MyService', {})).toThrow('ContainerService "registerInstance" method must be implemented');
  });
});
