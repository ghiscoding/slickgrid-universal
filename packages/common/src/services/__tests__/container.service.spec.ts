import { describe, expect, it, vi } from 'vitest';
import { ContainerService as AngularContainer } from '../../../../../frameworks/angular-slickgrid/src/library/services/container.service.js';
import { ContainerService as ReactContainer } from '../../../../../frameworks/slickgrid-react/src/services/container.service.js';
import { ContainerService as VueContainer } from '../../../../../frameworks/slickgrid-vue/src/services/container.service.js';
// Exercise the public adapters against the shared implementation.
import { UniversalContainerService } from '../../../../vanilla-bundle/src/services/universalContainer.service.js';
import { ContainerService, MapContainerService } from '../container.service.js';

describe('Container Service', () => {
  it('should display a not implemented when calling "get" method', () => {
    expect(() => ContainerService.prototype.get!('MyService')).toThrow('ContainerService "get" method must be implemented');
  });

  it('should display a not implemented when calling "registerInstance" method', () => {
    expect(() => ContainerService.prototype.registerInstance('MyService', {})).toThrow('ContainerService "registerInstance" method must be implemented');
  });
});

vi.mock('@slickgrid-universal/common', () => import('../container.service.js'));

vi.mock('@angular/core', () => ({ Service: () => (target: unknown) => target }));

for (const [name, Container, replaces] of [
  ['common', MapContainerService, true],
  ['vanilla', UniversalContainerService, false],
  ['angular', AngularContainer, false],
  ['react', ReactContainer, true],
  ['vue', VueContainer, true],
] as const) {
  describe(`${name} container`, () => {
    it('retrieves instances and preserves duplicate registration behavior', () => {
      const container = new Container();
      const first = {};
      const second = {};
      container.registerInstance('service', first);
      expect(container.get('service')).toBe(first);
      container.registerInstance('service', second);
      expect(container.get('service')).toBe(replaces ? second : first);
      expect(container.get('missing')).toBeNull();
    });

    it('preserves falsy values and safely accepts object property names', () => {
      const container = new Container();
      for (const value of [false, 0, '', null, undefined]) {
        const key = String(value);
        container.registerInstance(key, value);
        expect(container.get(key)).toBe(value ?? null);
      }
      container.registerInstance('__proto__', 42);
      expect(container.get('__proto__')).toBe(42);
    });

    it('clears references without disposing services and can be reused independently', () => {
      const container = new Container();
      const other = new Container();
      const service = { dispose: vi.fn() };
      container.registerInstance('service', service);
      other.registerInstance('service', service);
      container.dispose();
      container.dispose();
      expect(container.get('service')).toBeNull();
      expect(other.get('service')).toBe(service);
      expect(service.dispose).not.toHaveBeenCalled();
      container.registerInstance('service', 1);
      expect(container.get('service')).toBe(1);
    });
  });
}
