import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BindingService } from '../binding.service.js';

describe('Binding Service', () => {
  let div: HTMLDivElement;
  let service: BindingService;

  beforeEach(() => {
    div = document.createElement('div');
    document.body.appendChild(div);
  });

  afterEach(() => {
    div.remove();
    vi.clearAllMocks();
  });

  it('should add a binding for an input and call a value change and expect a mocked object to have the reflected value', () => {
    const mockCallback = vi.fn();
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    elm.className = 'custom-class';
    div.appendChild(elm);

    service = new BindingService({ variable: mockObj, property: 'name' });
    service.bind(elm, 'value', 'change', mockCallback);
    elm.value = 'Jane';
    const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: 'Jane' } } });
    elm.dispatchEvent(mockEvent);

    expect(service.property).toBe('name');
    expect(mockObj.name).toBe('Jane');
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should add a binding for an input type number and call a value change and expect a mocked object to have the reflected value AND parsed as a number', () => {
    const mockCallback = vi.fn();
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    elm.type = 'number';
    elm.className = 'custom-class';
    div.appendChild(elm);

    service = new BindingService({ variable: mockObj, property: 'age' });
    service.bind(elm, 'value', 'change', mockCallback);
    elm.value = '30';
    const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: '30' } } });
    elm.dispatchEvent(mockEvent);

    expect(service.property).toBe('age');
    expect(mockObj.age).toBe(30);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should return same input value when object property is not found', () => {
    const mockCallback = vi.fn();
    const mockObj = { name: 'John', age: 20 };
    const elm1 = document.createElement('input');
    const elm2 = document.createElement('span');
    elm1.className = 'custom-class';
    elm2.className = 'custom-class';
    div.appendChild(elm1);
    div.appendChild(elm2);

    service = new BindingService({ variable: mockObj, property: 'invalidProperty' });
    service.bind(div.querySelectorAll('.custom-class'), 'value', 'change', mockCallback);
    elm1.value = 'Jane';
    const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: 'Jane' } } });
    elm1.dispatchEvent(mockEvent);

    expect(service.property).toBe('invalidProperty');
    expect(mockObj.name).toBe('John');
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should add a binding for a mocked object and expect the value to be reflected in the element input value', () => {
    const mockCallback = vi.fn();
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    elm.className = 'custom-class';
    div.appendChild(elm);

    service = new BindingService({ variable: mockObj, property: 'name' });
    service.bind(elm, 'value', 'change', mockCallback);
    mockObj.name = 'Jane';

    expect(service.property).toBe('name');
    expect(elm.value).toBe('Jane');
  });

  it('should unbind an event from an element', () => {
    const mockElm = { addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as HTMLElement;
    const mockCallback = vi.fn();
    const removeEventSpy = vi.spyOn(mockElm, 'removeEventListener');
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    div.appendChild(elm);

    service = new BindingService({ variable: mockObj, property: 'name' });
    service.bind(mockElm, 'value', 'keyup');
    service.unbind(mockElm, 'click', mockCallback, false, service.boundedEventWithListeners[0].uid);

    expect(service.property).toBe('name');
    expect(removeEventSpy).toHaveBeenCalledWith('click', mockCallback, false);
  });

  it('should call unbindAll and expect a single unbind element being called', () => {
    const mockElm = { addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as HTMLElement;
    const removeEventSpy = vi.spyOn(mockElm, 'removeEventListener');
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    div.appendChild(elm);

    service = new BindingService({ variable: mockObj, property: 'name' });
    service.bind(mockElm, 'value', 'keyup');
    service.unbindAll();

    expect(service.property).toBe('name');
    expect(removeEventSpy).toHaveBeenCalledWith('keyup', expect.any(Function), undefined);
  });
  it('writes each binding once per event and invokes the callback afterward', () => {
    const model = { name: 'John' };
    service = new BindingService({ variable: model, property: 'name' });
    const input = document.createElement('input');
    const target = document.createElement('span');
    service.bind(input, 'value', 'change');
    service.bind(target, 'textContent');
    const setter = vi.spyOn(target, 'textContent', 'set');
    input.value = 'Jane';
    input.dispatchEvent(new Event('change'));
    expect(setter).toHaveBeenCalledExactlyOnceWith('Jane');
    expect(model.name).toBe('Jane');
  });

  it('removes many listeners without scanning and keeps model bindings until disposal', () => {
    service = new BindingService({ variable: { name: 'John' }, property: 'name' });
    const callback = vi.fn();
    const input = document.createElement('input');
    for (let i = 0; i < 10; i++) {
      service.bind(input, 'value', 'change', callback);
    }
    const search = vi.spyOn(service.boundedEventWithListeners, 'findIndex');
    service.unbindAll();
    expect(search).not.toHaveBeenCalled();
    input.dispatchEvent(new Event('change'));
    expect(callback).not.toHaveBeenCalled();
    service.dispose();
    expect(service.elementBindings).toHaveLength(0);
  });
  it('preserves propagation when a later service replaces the model accessor', () => {
    const model = { name: 'John' };
    service = new BindingService({ variable: model, property: 'name' });
    const input = document.createElement('input');
    service.bind(input, 'value', 'change');
    const second = new BindingService({ variable: model, property: 'name' });
    const span = document.createElement('span');
    second.bind(span, 'textContent');
    input.value = 'Jane';
    input.dispatchEvent(new Event('change'));
    expect(span.textContent).toBe('Jane');
    service.dispose();
    second.dispose();
  });

  it('handles absent elements, missing listener IDs and non-tail removal', () => {
    service = new BindingService({ variable: { value: 1 }, property: 'value' });
    expect(service.bind(null, 'value')).toBe(service);
    service.unbind(null, 'change', vi.fn<EventListener>());
    const input = document.createElement('input');
    service.bind(input, 'value', 'change').bind(input, 'value', 'blur');
    const first = service.boundedEventWithListeners[0];
    service.unbind(input, first.eventName, first.listener, undefined, first.uid);
    expect(service.boundedEventWithListeners).toHaveLength(1);
    service.unbind(input, 'unknown', vi.fn<EventListener>(), undefined, 'missing');
    service.dispose();
    service.unbind(input, 'unknown', vi.fn<EventListener>());
  });

  it('allows subclass unbind overrides without leaving teardown stuck', () => {
    class CustomBinding extends BindingService {
      override unbind = vi.fn();
    }
    const custom = new CustomBinding({ variable: { value: 1 }, property: 'value' });
    custom.bind(document.createElement('input'), 'value', 'change');
    custom.dispose();
    expect(custom.unbind).toHaveBeenCalledOnce();
    expect(custom.boundedEventWithListeners).toHaveLength(0);
  });

  it('handles empty numeric input, inherited properties and removed model properties', () => {
    const inherited = new BindingService({ variable: Object.create({ value: 1 }), property: 'value' });
    expect(inherited.valueGetter()).toBe(1);
    inherited.dispose();
    const model: { value?: number | string } = { value: 1 };
    service = new BindingService({ variable: model, property: 'value' });
    const input = document.createElement('input');
    input.type = 'number';
    service.bind(input, 'value', 'change');
    input.value = '';
    input.dispatchEvent(new Event('change'));
    expect(model.value).toBe('');
    Object.defineProperty(model, 'value', { value: 3, configurable: true, writable: true });
    input.value = '4';
    input.dispatchEvent(new Event('change'));
    expect(model.value).toBe(4);
    delete model.value;

    input.dispatchEvent(new Event('change'));
    expect(model).not.toHaveProperty('value');
    service.dispose();
  });

  it('retains defensive handling of malformed bindings and primitive values', () => {
    class InspectableBinding extends BindingService {
      exercise(): void {
        this.bindSingleElement(null, 'value');
        this._elementBindings = [null as any, { element: null, attribute: 'value' }, { element: document.createElement('input'), attribute: '' }];
        this.valueSetter(1);
        this._elementBindings = null as any;
        this.valueSetter(2);
      }
      checkData(value: any): boolean {
        return this.hasData(value);
      }
    }
    const custom = new InspectableBinding({ variable: '', property: '' });
    expect(custom.valueGetter()).toBe('');
    custom.exercise();
    expect(custom.checkData(undefined)).toBe(false);
    expect(custom.checkData(null)).toBe(false);
    expect(custom.checkData('')).toBe(false);
    expect(custom.checkData(0)).toBe(true);
    custom.dispose();
  });
});
