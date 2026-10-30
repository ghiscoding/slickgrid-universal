import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BindingEventService } from '../bindingEvent.service.js';

describe('BindingEvent Service', () => {
  let div: HTMLDivElement;
  let service: BindingEventService;

  beforeEach(() => {
    service = new BindingEventService();
    div = document.createElement('div');
    document.body.appendChild(div);
  });

  afterEach(() => {
    div.remove();
    service.unbindAll();
    service?.dispose();
    vi.clearAllMocks();
  });

  it('should be able to bind an event with listener to an element', () => {
    const mockElm = { addEventListener: vi.fn() } as unknown as HTMLElement;
    const mockCallback = vi.fn();
    const addEventSpy = vi.spyOn(mockElm, 'addEventListener');
    const elm = document.createElement('input');
    div.appendChild(elm);

    service.bind(mockElm, 'click', mockCallback);

    expect(service.boundedEvents.length).toBe(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, undefined);
  });

  it('should not use forEach if the element is a single HTMLElement but with a monkey patched forEach', () => {
    const elm = document.createElement('input');
    div.appendChild(elm);
    const forEachSpy = vi.fn();
    (elm as any).forEach = forEachSpy;
    const mockCallback = vi.fn();
    const addEventSpy = vi.spyOn(elm, 'addEventListener');

    service.bind(elm, 'click', mockCallback);

    expect(service.boundedEvents.length).toBe(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, undefined);
    expect(forEachSpy).not.toHaveBeenCalled();
  });

  it('should be able to bind and unbindByEventName an event', () => {
    const mockElm = { addEventListener: vi.fn() } as unknown as HTMLElement;
    const mockCallback = vi.fn();
    const unbindSpy = vi.spyOn(service, 'unbind');
    const addEventSpy = vi.spyOn(mockElm, 'addEventListener');
    const elm = document.createElement('input');
    div.appendChild(elm);

    service.bind(mockElm, 'click', mockCallback);
    service.unbindByEventName(mockElm, 'click');

    expect(service.boundedEvents.length).toBe(0);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, undefined);
    expect(unbindSpy).toHaveBeenCalledWith(mockElm, 'click', expect.anything(), undefined);
  });

  it('should be able to bind an event with listener and options to an element', () => {
    const mockElm = { addEventListener: vi.fn() } as unknown as HTMLElement;
    const mockCallback = vi.fn();
    const addEventSpy = vi.spyOn(mockElm, 'addEventListener');
    const elm = document.createElement('input');
    div.appendChild(elm);

    service.bind(mockElm, 'click', mockCallback, { capture: true, passive: true });

    expect(service.boundedEvents.length).toBe(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
  });

  it('should be able to bind an event with single listener and options to multiple elements', () => {
    const mockCallback = vi.fn();
    const elm1 = document.createElement('input');
    const elm2 = document.createElement('input');
    elm1.className = 'custom-class';
    elm2.className = 'custom-class';
    div.appendChild(elm1);
    div.appendChild(elm2);

    const btns = div.querySelectorAll('.custom-class');
    const addEventSpy1 = vi.spyOn(btns[0], 'addEventListener');
    const addEventSpy2 = vi.spyOn(btns[1], 'addEventListener');
    service.bind(btns, 'click', mockCallback, { capture: true, passive: true });

    expect(service.boundedEvents.length).toBe(2);
    expect(addEventSpy1).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
    expect(addEventSpy2).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
  });

  it('should normalize boolean listener options and remove capture listeners', () => {
    const mockCallback = vi.fn();

    service.bind(document, 'scroll', mockCallback, true);

    expect(service.boundedEvents[0].options).toEqual({ capture: true });

    document.dispatchEvent(new Event('scroll'));
    expect(mockCallback).toHaveBeenCalledTimes(1);

    service.unbindAll();
    document.dispatchEvent(new Event('scroll'));
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should call unbindAll and expect as many removeEventListener be called', () => {
    const mockElm = { addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as HTMLElement;
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();

    service = new BindingEventService();
    service.bind(mockElm, 'keyup', mockCallback1);
    service.bind(mockElm, 'click', mockCallback2, { capture: true, passive: true });
    expect(service.boundedEvents.length).toBe(2);

    service.unbindAll();

    expect(service.boundedEvents.length).toBe(0);
    expect(mockElm.addEventListener).toHaveBeenCalledWith('keyup', mockCallback1, undefined);
    expect(mockElm.addEventListener).toHaveBeenCalledWith('click', mockCallback2, { capture: true, passive: true });
    expect(mockElm.removeEventListener).toHaveBeenCalledWith('keyup', mockCallback1, undefined);
    expect(mockElm.removeEventListener).toHaveBeenCalledWith('click', mockCallback2, { capture: true, passive: true });
  });

  it('should call unbindAll with a single group name and expect that group listeners to be removed but others kept', () => {
    const mockElm1 = { addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as HTMLElement;
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    const mockCallback3 = vi.fn();
    const mockCallback4 = vi.fn();
    const mockCallback5 = vi.fn();

    service = new BindingEventService();
    service.bind(mockElm1, 'keyup', mockCallback1, false, 'wonderful');
    service.bind(mockElm1, 'keydown', mockCallback2, { capture: true, passive: true }, 'magic');
    service.bind(mockElm1, 'click', mockCallback3, { capture: true, passive: true }); // no group
    service.bind(mockElm1, 'mouseover', mockCallback4, { capture: false, passive: true }, 'mouse-group');
    service.bind(mockElm1, 'mouseout', mockCallback5, { capture: false, passive: false }, 'mouse-group');

    expect(service.boundedEvents.length).toBe(5);
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('keyup', mockCallback1, { capture: false });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('keydown', mockCallback2, { capture: true, passive: true });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('click', mockCallback3, { capture: true, passive: true });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('mouseover', mockCallback4, { capture: false, passive: true }); // mouse-group
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('mouseout', mockCallback5, { capture: false, passive: false }); // mouse-group

    service.unbindAll('mouse-group');

    expect(service.boundedEvents.length).toBe(3);
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('keyup', mockCallback1);
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('keydown', mockCallback2);
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('click', mockCallback3);
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('mouseover', mockCallback4, { capture: false, passive: true }); // mouse-group
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('mouseout', mockCallback5, { capture: false, passive: false }); // mouse-group
  });

  it('should call unbindAll with a multiple group names and expect those group listeners to be removed but others kept', () => {
    const mockElm1 = { addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as HTMLElement;
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    const mockCallback3 = vi.fn();
    const mockCallback4 = vi.fn();

    service = new BindingEventService();
    service.bind(mockElm1, 'keyup', mockCallback1, false, 'wonderful');
    service.bind(mockElm1, 'keydown', mockCallback2, { capture: true, passive: true }, 'magic');
    service.bind(mockElm1, 'click', mockCallback3, { capture: true, passive: true }); // no group
    service.bind(mockElm1, ['mouseover', 'mouseout'], mockCallback4, { capture: false, passive: true }, 'mouse-group');

    expect(service.boundedEvents.length).toBe(5);
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('keyup', mockCallback1, { capture: false });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('keydown', mockCallback2, { capture: true, passive: true });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('click', mockCallback3, { capture: true, passive: true });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('mouseover', mockCallback4, { capture: false, passive: true }); // mouse-group
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('mouseout', mockCallback4, { capture: false, passive: true }); // mouse-group

    service.unbindAll(['magic', 'mouse-group']);

    expect(service.boundedEvents.length).toBe(2);
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('keyup', mockCallback1);
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('keydown', mockCallback2, { capture: true, passive: true }); // magic
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('click', mockCallback3);
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('mouseover', mockCallback4, { capture: false, passive: true }); // mouse-group
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('mouseout', mockCallback4, { capture: false, passive: true }); // mouse-group
  });
  it('unbinds NodeLists across multiple events without retaining records', () => {
    div.innerHTML = '<button></button><button></button>';
    const elements = div.querySelectorAll('button');
    const callback = vi.fn();
    service.bind(elements, ['click', 'blur'], callback);
    service.unbind(elements, ['click', 'blur'], callback);
    elements.forEach((element) => element.dispatchEvent(new Event('click')));
    expect(callback).not.toHaveBeenCalled();
    expect(service.boundedEvents).toHaveLength(0);
  });

  it('advances repeated event-name removal and preserves other callbacks and capture modes', () => {
    const first = vi.fn();
    const second = vi.fn();
    service.bind(div, 'click', first);
    service.bind(div, 'click', second, true);
    service.bind(div, 'blur', second);
    service.unbind(div, 'click', second, false);
    expect(service.boundedEvents).toHaveLength(3);
    service.unbindByEventName(div, 'click');
    div.dispatchEvent(new Event('click'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    service.unbindByEventName(div, 'click');
    service.unbindByEventName(div, 'missing');
    expect(service.boundedEvents).toHaveLength(1);
  });

  it('snapshots capture options for disposal', () => {
    const callback = vi.fn();
    const options = { capture: true };
    service.bind(div, 'click', callback, options);
    options.capture = false;
    service.dispose();
    div.dispatchEvent(new Event('click'));
    expect(callback).not.toHaveBeenCalled();
  });

  it('compacts alternating groups in place and removes listeners in reverse order', () => {
    const callback = vi.fn();
    const unbind = vi.spyOn(service, 'unbind');
    for (let i = 0; i < 6; i++) {
      service.bind(div, String(i), callback, undefined, i % 2 ? 'keep' : 'remove');
    }
    const records = service.boundedEvents;
    const splice = vi.spyOn(records, 'splice');
    service.unbindAll(['remove']);
    expect(service.boundedEvents).toBe(records);
    expect(records.map((event) => event.eventName)).toEqual(['1', '3', '5']);
    expect(unbind.mock.calls.map((args) => args[1])).toEqual(['4', '2', '0']);
    expect(splice).not.toHaveBeenCalled();
    service.unbindAll([]);
    expect(records).toHaveLength(3);
  });

  it('handles missing elements and keeps bookkeeping enabled after an overridden unbind throws', () => {
    service.bind(null as any, 'click', vi.fn());
    service.unbind(null as any, 'click', vi.fn());
    const callback = vi.fn();
    service.bind(div, 'click', callback, undefined, 'remove');
    service.bind(div, 'blur', callback, undefined, 'keep');
    const unbind = vi.spyOn(service, 'unbind').mockImplementationOnce(() => {
      throw new Error('failure');
    });
    expect(() => service.unbindAll('remove')).toThrow('failure');
    unbind.mockRestore();
    service.unbind(div, 'blur', callback);
    expect(service.boundedEvents).toHaveLength(0);
    div.removeEventListener('click', callback);
  });
});
