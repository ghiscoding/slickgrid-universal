import { Draggable, MouseWheel, Resizable } from '../slickInteractions';

describe('Draggable class', () => {
  let containerElement: HTMLDivElement;
  let dg: any;

  beforeEach(() => {
    containerElement = document.createElement('div');
  });

  afterEach(() => {
    containerElement?.remove();
    dg?.destroy();
  });

  it('should be able to instantiate the class', () => {
    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell' });

    expect(dg).toBeTruthy();
  });

  it('should be able to instantiate the class even without a valid containerElement', () => {
    dg = Draggable({ allowDragFrom: 'div.slick-cell' });

    expect(dg).toBeTruthy();
  });

  it('should trigger mousedown but NOT expect a dragInit to happen since it was not triggered by an allowed element', () => {
    const dragInitSpy = jest.fn();

    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell', onDrag: dragInitSpy });

    containerElement.dispatchEvent(new MouseEvent('mousedown'));

    expect(dg).toBeTruthy();
    expect(dragInitSpy).not.toHaveBeenCalled();
  });

  it('should trigger mousedown and expect a dragInit to happen since it was triggered by an allowed element but NOT expect a drag to actually happen since we did not move afterward', () => {
    const dragInitSpy = jest.fn();
    const dragSpy = jest.fn();
    containerElement.className = 'slick-cell';

    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell', onDrag: dragSpy, onDragInit: dragInitSpy });

    containerElement.dispatchEvent(new MouseEvent('mousedown'));

    expect(dg).toBeTruthy();
    expect(dragInitSpy).toHaveBeenCalled();
    expect(dragSpy).not.toHaveBeenCalled();

    dg.destroy();
  });

  it('should NOT trigger dragInit event when user is pressing mousedown and mousemove + Ctrl key combo that we considered as forbidden via "preventDragFromKeys"', () => {
    const dragInitSpy = jest.fn();
    const dragSpy = jest.fn();
    containerElement.className = 'slick-cell';

    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell', preventDragFromKeys: ['ctrlKey'], onDrag: dragSpy, onDragInit: dragInitSpy });

    containerElement.dispatchEvent(new MouseEvent('mousedown', { ctrlKey: true }));

    expect(dg).toBeTruthy();
    expect(dragInitSpy).not.toHaveBeenCalled();
    expect(dragSpy).not.toHaveBeenCalled();

    dg.destroy();
  });

  it('should trigger mousedown and expect a dragInit and a dragStart and drag to all happen since it was triggered by an allowed element and we did move afterward', () => {
    const removeListenerSpy = jest.spyOn(document.body, 'removeEventListener');
    const dragInitSpy = jest.fn();
    const dragSpy = jest.fn();
    const dragStartSpy = jest.fn();
    const dragEndSpy = jest.fn();
    containerElement.className = 'slick-cell';

    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell', onDrag: dragSpy, onDragInit: dragInitSpy, onDragStart: dragStartSpy, onDragEnd: dragEndSpy });

    const mdEvt = new MouseEvent('mousedown');
    Object.defineProperty(mdEvt, 'clientX', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(mdEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    containerElement.dispatchEvent(mdEvt);

    const mmEvt = new MouseEvent('mousemove');
    const muEvt = new MouseEvent('mouseup');
    Object.defineProperty(mmEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(mmEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(muEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(muEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    document.body.dispatchEvent(mmEvt);
    document.body.dispatchEvent(muEvt);

    expect(dg).toBeTruthy();
    expect(dragInitSpy).toHaveBeenCalledWith(mdEvt, { startX: 10, startY: 10, deltaX: 2, deltaY: 0, dragHandle: containerElement, dragSource: containerElement, target: document.body });
    expect(dragStartSpy).toHaveBeenCalled();  // TODO: revisit calledWith X/Y pos, after migrating to TS class
    expect(dragSpy).toHaveBeenCalled();
    expect(dragEndSpy).toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalledTimes(5 * 2);
  });

  it('should NOT trigger dragInit,dragStart events when user is pressing mousedown and mousemove + Meta key combo that we considered as forbidden via "preventDragFromKeys"', () => {
    const removeListenerSpy = jest.spyOn(document.body, 'removeEventListener');
    const dragInitSpy = jest.fn();
    const dragSpy = jest.fn();
    const dragStartSpy = jest.fn();
    const dragEndSpy = jest.fn();
    containerElement.className = 'slick-cell';

    dg = Draggable({ containerElement, allowDragFrom: 'div.slick-cell', preventDragFromKeys: ['metaKey'], onDrag: dragSpy, onDragInit: dragInitSpy, onDragStart: dragStartSpy, onDragEnd: dragEndSpy });

    const mdEvt = new MouseEvent('mousedown', { metaKey: true });
    Object.defineProperty(mdEvt, 'clientX', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(mdEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    containerElement.dispatchEvent(mdEvt);

    const mmEvt = new MouseEvent('mousemove', { metaKey: true });
    const muEvt = new MouseEvent('mouseup', { metaKey: true });
    Object.defineProperty(mmEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(mmEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(muEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(muEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    document.body.dispatchEvent(mmEvt);
    document.body.dispatchEvent(muEvt);

    expect(dg).toBeTruthy();
    expect(dragInitSpy).not.toHaveBeenCalledWith(mdEvt, { startX: 10, startY: 10, deltaX: 2, deltaY: 0, dragHandle: containerElement, dragSource: containerElement, target: document.body });
    expect(dragStartSpy).not.toHaveBeenCalled();
    expect(dragSpy).not.toHaveBeenCalled();
    expect(dragEndSpy).not.toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalledTimes(5 * 2);
  });
});

describe('MouseWheel class', () => {
  let mw: any;

  afterEach(() => {
    mw?.destroy();
  });

  it('should be able to instantiate the class', () => {
    mw = MouseWheel({ element: document.createElement('div') });

    expect(mw).toBeTruthy();
  });

  it('should trigger mouse wheel event and expect onMouseWheel handler to be called old school way with regular mouse and WebKit browser event', () => {
    const removeListenerSpy = jest.spyOn(document.body, 'removeEventListener');
    const wheelSpy = jest.fn();

    const element = document.createElement('div');
    mw = MouseWheel({ element, onMouseWheel: wheelSpy });

    const mdEvt = new Event('wheel');
    Object.defineProperty(mdEvt, 'wheelDelta', { writable: true, configurable: true, value: -120 });
    Object.defineProperty(mdEvt, 'wheelDeltaX', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(mdEvt, 'wheelDeltaY', { writable: true, configurable: true, value: -120 });
    element.dispatchEvent(mdEvt);

    expect(mw).toBeTruthy();
    expect(wheelSpy).toHaveBeenCalledWith(mdEvt, -1, -0, -1);
    expect(removeListenerSpy).toHaveBeenCalledTimes(5 * 2);
  });

  it('should trigger mouse wheel event and expect onMouseWheel handler to be called new school way with touchpad multidimensional scroll', () => {
    const removeListenerSpy = jest.spyOn(document.body, 'removeEventListener');
    const wheelSpy = jest.fn();

    const element = document.createElement('div');
    mw = MouseWheel({ element, onMouseWheel: wheelSpy });

    const mdEvt = new Event('wheel');
    Object.defineProperty(mdEvt, 'detail', { writable: true, configurable: true, value: 3 });
    Object.defineProperty(mdEvt, 'wheelDeltaX', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(mdEvt, 'wheelDeltaY', { writable: true, configurable: true, value: -120 });
    element.dispatchEvent(mdEvt);

    expect(mw).toBeTruthy();
    expect(wheelSpy).toHaveBeenCalledWith(mdEvt, -1, -0, -1);
    expect(removeListenerSpy).toHaveBeenCalledTimes(5 * 2);
  });

  it('should trigger mouse wheel event and expect onMouseWheel handler to be called old school way with regular mouse and Gecko browser event', () => {
    const removeListenerSpy = jest.spyOn(document.body, 'removeEventListener');
    const wheelSpy = jest.fn();

    const element = document.createElement('div');
    mw = MouseWheel({ element, onMouseWheel: wheelSpy });

    const mdEvt = new Event('wheel');
    Object.defineProperty(mdEvt, 'wheelDelta', { writable: true, configurable: true, value: -120 });
    Object.defineProperty(mdEvt, 'axis', { writable: true, configurable: true, value: 3 });
    Object.defineProperty(mdEvt, 'HORIZONTAL_AXIS', { writable: true, configurable: true, value: 3 });
    element.dispatchEvent(mdEvt);

    expect(mw).toBeTruthy();
    expect(wheelSpy).toHaveBeenCalledWith(mdEvt, -1, 1, 0);
    expect(removeListenerSpy).toHaveBeenCalledTimes(5 * 2);
  });
});

describe('Resizable class', () => {
  let rsz: any;
  let containerElement;

  beforeEach(() => {
    containerElement = document.createElement('div');
    containerElement.className = 'slick-container';
  });

  afterEach(() => {
    rsz?.destroy();
  });

  it('should be able to instantiate the class', () => {
    rsz = Resizable({
      resizeableElement: document.createElement('div'),
      resizeableHandleElement: document.createElement('div')
    });

    expect(rsz).toBeTruthy();
  });

  it('should throw when instantiating without a valid handle resizeable element', () => {
    expect(() => Resizable({} as any)).toThrow('[SlickResizable] You did not provide a valid html element that will be used for the handle to resize.');
  });

  it('should trigger mousedown and expect a dragInit and a dragStart and drag to all happen since it was triggered by an allowed element and we did move afterward', () => {
    const removeListenerSpy = jest.spyOn(document.body, 'removeEventListener');
    const resizeSpy = jest.fn();
    const resizeStartSpy = jest.fn();
    const resizeEndSpy = jest.fn();
    containerElement.className = 'slick-cell';

    rsz = Resizable({ resizeableElement: containerElement, resizeableHandleElement: containerElement, onResize: resizeSpy, onResizeStart: resizeStartSpy, onResizeEnd: resizeEndSpy });

    const mdEvt = new MouseEvent('mousedown');
    Object.defineProperty(mdEvt, 'clientX', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(mdEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    containerElement.dispatchEvent(mdEvt);

    const mmEvt = new MouseEvent('mousemove');
    const muEvt = new MouseEvent('mouseup');
    Object.defineProperty(mmEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(mmEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    Object.defineProperty(muEvt, 'clientX', { writable: true, configurable: true, value: 12 });
    Object.defineProperty(muEvt, 'clientY', { writable: true, configurable: true, value: 10 });
    document.body.dispatchEvent(mmEvt);
    document.body.dispatchEvent(muEvt);

    expect(rsz).toBeTruthy();
    expect(resizeStartSpy).toHaveBeenCalledWith(mdEvt, { resizeableElement: containerElement, resizeableHandleElement: containerElement });
    expect(resizeSpy).toHaveBeenCalled();
    expect(resizeEndSpy).toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalledTimes(6 * 2 + 2);
  });
});