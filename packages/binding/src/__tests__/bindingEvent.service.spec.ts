import { BindingEventService } from '../bindingEvent.service';

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
    jest.clearAllMocks();
  });

  it('should be able to bind an event with listener to an element', () => {
    const mockElm = { addEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback = jest.fn();
    const addEventSpy = jest.spyOn(mockElm, 'addEventListener');
    const elm = document.createElement('input');
    div.appendChild(elm);

    service.bind(mockElm, 'click', mockCallback);

    expect(service.boundedEvents.length).toBe(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, undefined);
  });

  it('should be able to bind and unbindByEventName an event', () => {
    const mockElm = { addEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback = jest.fn();
    const unbindSpy = jest.spyOn(service, 'unbind');
    const addEventSpy = jest.spyOn(mockElm, 'addEventListener');
    const elm = document.createElement('input');
    div.appendChild(elm);

    service.bind(mockElm, 'click', mockCallback);
    service.unbindByEventName(mockElm, 'click');

    expect(service.boundedEvents.length).toBe(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, undefined);
    expect(unbindSpy).toHaveBeenCalledWith(mockElm, 'click', expect.anything());
  });

  it('should be able to bind an event with listener and options to an element', () => {
    const mockElm = { addEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback = jest.fn();
    const addEventSpy = jest.spyOn(mockElm, 'addEventListener');
    const elm = document.createElement('input');
    div.appendChild(elm);

    service.bind(mockElm, 'click', mockCallback, { capture: true, passive: true });

    expect(service.boundedEvents.length).toBe(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
  });

  it('should be able to bind an event with single listener and options to multiple elements', () => {
    const mockCallback = jest.fn();
    const elm1 = document.createElement('input');
    const elm2 = document.createElement('input');
    elm1.className = 'custom-class';
    elm2.className = 'custom-class';
    div.appendChild(elm1);
    div.appendChild(elm2);

    const btns = div.querySelectorAll('.custom-class');
    const addEventSpy1 = jest.spyOn(btns[0], 'addEventListener');
    const addEventSpy2 = jest.spyOn(btns[1], 'addEventListener');
    service.bind(btns, 'click', mockCallback, { capture: true, passive: true });

    expect(service.boundedEvents.length).toBe(2);
    expect(addEventSpy1).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
    expect(addEventSpy2).toHaveBeenCalledWith('click', mockCallback, { capture: true, passive: true });
  });

  it('should call unbindAll and expect as many removeEventListener be called', () => {
    const mockElm = { addEventListener: jest.fn(), removeEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    service = new BindingEventService();
    service.bind(mockElm, 'keyup', mockCallback1);
    service.bind(mockElm, 'click', mockCallback2, { capture: true, passive: true });
    expect(service.boundedEvents.length).toBe(2);

    service.unbindAll();

    expect(service.boundedEvents.length).toBe(0);
    expect(mockElm.addEventListener).toHaveBeenCalledWith('keyup', mockCallback1, undefined);
    expect(mockElm.addEventListener).toHaveBeenCalledWith('click', mockCallback2, { capture: true, passive: true });
    expect(mockElm.removeEventListener).toHaveBeenCalledWith('keyup', mockCallback1);
    expect(mockElm.removeEventListener).toHaveBeenCalledWith('click', mockCallback2);
  });

  it('should call unbindAll with a single group name and expect that group listeners to be removed but others kept', () => {
    const mockElm1 = { addEventListener: jest.fn(), removeEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const mockCallback3 = jest.fn();
    const mockCallback4 = jest.fn();
    const mockCallback5 = jest.fn();

    service = new BindingEventService();
    service.bind(mockElm1, 'keyup', mockCallback1, false, 'wonderful');
    service.bind(mockElm1, 'keydown', mockCallback2, { capture: true, passive: true }, 'magic');
    service.bind(mockElm1, 'click', mockCallback3, { capture: true, passive: true }); // no group
    service.bind(mockElm1, 'mouseover', mockCallback4, { capture: false, passive: true }, 'mouse-group');
    service.bind(mockElm1, 'mouseout', mockCallback5, { capture: false, passive: false }, 'mouse-group');

    expect(service.boundedEvents.length).toBe(5);
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('keyup', mockCallback1, false);
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('keydown', mockCallback2, { capture: true, passive: true });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('click', mockCallback3, { capture: true, passive: true });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('mouseover', mockCallback4, { capture: false, passive: true }); // mouse-group
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('mouseout', mockCallback5, { capture: false, passive: false }); // mouse-group

    service.unbindAll('mouse-group');

    expect(service.boundedEvents.length).toBe(3);
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('keyup', mockCallback1);
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('keydown', mockCallback2);
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('click', mockCallback3);
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('mouseover', mockCallback4); // mouse-group
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('mouseout', mockCallback5); // mouse-group
  });

  it('should call unbindAll with a multiple group names and expect those group listeners to be removed but others kept', () => {
    const mockElm1 = { addEventListener: jest.fn(), removeEventListener: jest.fn() } as unknown as HTMLElement;
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const mockCallback3 = jest.fn();
    const mockCallback4 = jest.fn();

    service = new BindingEventService();
    service.bind(mockElm1, 'keyup', mockCallback1, false, 'wonderful');
    service.bind(mockElm1, 'keydown', mockCallback2, { capture: true, passive: true }, 'magic');
    service.bind(mockElm1, 'click', mockCallback3, { capture: true, passive: true }); // no group
    service.bind(mockElm1, ['mouseover', 'mouseout'], mockCallback4, { capture: false, passive: true }, 'mouse-group');

    expect(service.boundedEvents.length).toBe(5);
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('keyup', mockCallback1, false);
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('keydown', mockCallback2, { capture: true, passive: true });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('click', mockCallback3, { capture: true, passive: true });
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('mouseover', mockCallback4, { capture: false, passive: true }); // mouse-group
    expect(mockElm1.addEventListener).toHaveBeenCalledWith('mouseout', mockCallback4, { capture: false, passive: true }); // mouse-group

    service.unbindAll(['magic', 'mouse-group']);

    expect(service.boundedEvents.length).toBe(2);
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('keyup', mockCallback1);
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('keydown', mockCallback2); // magic
    expect(mockElm1.removeEventListener).not.toHaveBeenCalledWith('click', mockCallback3);
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('mouseover', mockCallback4); // mouse-group
    expect(mockElm1.removeEventListener).toHaveBeenCalledWith('mouseout', mockCallback4); // mouse-group
  });
});
