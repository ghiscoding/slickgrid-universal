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
});
