import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupColumnReorderDrag, setupDropzonePillDrag } from '../slickColumnReorderDrag.js';

describe('slickColumnReorderDrag', () => {
  const createHeaderColumn = (id: string, extraClass = '') => {
    const elm = document.createElement('div');
    elm.className = `slick-header-column ${extraClass}`.trim();
    elm.dataset.id = id;
    elm.textContent = id;
    return elm;
  };

  const createDragEvent = (type: string, props: Partial<Record<string, unknown>> = {}) => {
    const evt = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
    for (const [key, value] of Object.entries(props)) {
      Object.defineProperty(evt, key, { value, configurable: true, writable: true });
    }
    return evt;
  };

  const createMouseEvent = (type: string, props: Partial<Record<string, unknown>> = {}) => {
    const evt = new MouseEvent(type, { bubbles: true, cancelable: true });
    for (const [key, value] of Object.entries(props)) {
      Object.defineProperty(evt, key, { value, configurable: true, writable: true });
    }
    return evt;
  };

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should initialize draggable headers and clear draggable flags on destroy', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const orderable = createHeaderColumn('firstName');
    const unorderable = createHeaderColumn('lastName', 'unorderable');
    headerLeft.append(orderable, unorderable);

    const instance = setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      unorderableColumnCssClass: 'unorderable',
      onDragEnd: vi.fn(),
    });

    expect(orderable.draggable).toBe(true);
    expect(unorderable.draggable).toBe(false);

    instance.destroy();

    expect(orderable.draggable).toBe(false);
    expect(unorderable.draggable).toBe(false);
  });

  it('should prevent dragstart when event target is not a header column', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const onDragEnd = vi.fn();

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
    });

    const dragStartEvt = createDragEvent('dragstart');
    const preventDefaultSpy = vi.spyOn(dragStartEvt, 'preventDefault');
    headerLeft.dispatchEvent(dragStartEvt);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('should prevent default on dragover and skip when drag was never started', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const target = createHeaderColumn('age');
    headerLeft.append(target);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const dragOverEvt = createDragEvent('dragover', { clientX: 120 });
    const preventDefaultSpy = vi.spyOn(dragOverEvt, 'preventDefault');
    target.dispatchEvent(dragOverEvt);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(headerLeft.firstElementChild).toBe(target);
  });

  it('should move dragged header before target when cursor is in target left half', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    const age = createHeaderColumn('age');
    headerLeft.append(firstName, lastName, age);

    const onDragEnd = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
    });

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
      offsetX: 8,
      offsetY: 4,
    });
    firstName.dispatchEvent(dragStartEvt);

    vi.spyOn(lastName, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 40,
      right: 140,
      top: 0,
      bottom: 0,
      x: 100,
      y: 0,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);

    const dragOverEvt = createDragEvent('dragover', { clientX: 110 }); // left side of lastName
    lastName.dispatchEvent(dragOverEvt);

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName', 'age']);

    const dragEndEvt = createDragEvent('dragend');
    firstName.dispatchEvent(dragEndEvt);
    expect(onDragEnd).toHaveBeenCalledWith(['firstName', 'lastName', 'age']);
  });

  it('should ignore dragover when target is the same dragged header element', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    headerLeft.append(firstName, lastName);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
      offsetX: 5,
      offsetY: 3,
    });
    firstName.dispatchEvent(dragStartEvt);

    const dragOverEvt = createDragEvent('dragover', { clientX: 10 });
    firstName.dispatchEvent(dragOverEvt);

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName']);
  });

  it('should move dragged header after target when cursor is in target right half', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    const age = createHeaderColumn('age');
    headerLeft.append(firstName, lastName, age);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
      offsetX: 8,
      offsetY: 4,
    });
    firstName.dispatchEvent(dragStartEvt);

    vi.spyOn(lastName, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 40,
      right: 140,
      top: 0,
      bottom: 0,
      x: 100,
      y: 0,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);

    const dragOverEvt = createDragEvent('dragover', { clientX: 139 }); // right side of lastName
    lastName.dispatchEvent(dragOverEvt);

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['lastName', 'firstName', 'age']);
  });

  it('should not move dragged header into a preheader-style container', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    const preHeaderGroup = createHeaderColumn('preHeaderGroup');
    const preHeaderContainer = document.createElement('div');
    preHeaderContainer.append(preHeaderGroup);
    headerLeft.append(firstName, lastName);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
      offsetX: 8,
      offsetY: 4,
    });
    firstName.dispatchEvent(dragStartEvt);

    vi.spyOn(preHeaderGroup, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 40,
      right: 140,
      top: 0,
      bottom: 0,
      x: 100,
      y: 0,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);

    const dragOverEvt = createDragEvent('dragover', { clientX: 110 });
    preHeaderGroup.dispatchEvent(dragOverEvt);

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName']);
    expect(preHeaderContainer.contains(firstName)).toBe(false);
  });

  it('should call setDragImage with rect-relative coords (Firefox/Linux ghost fix) on dragstart', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    const setDragImageSpy = vi.fn();
    // Simulate the column header at left=50, top=10 in the viewport
    vi.spyOn(firstName, 'getBoundingClientRect').mockReturnValue({
      left: 50,
      top: 10,
      right: 130,
      bottom: 30,
      width: 80,
      height: 20,
      x: 50,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: setDragImageSpy },
      clientX: 60, // 10px inside the column header
      clientY: 15, // 5px inside the column header
    });
    firstName.dispatchEvent(dragStartEvt);

    // The ghost should be anchored at (clientX - rect.left, clientY - rect.top) = (10, 5)
    // NOT at e.offsetX / e.offsetY which would be relative to whichever child element was clicked
    expect(setDragImageSpy).toHaveBeenCalledWith(firstName, 10, 5);
  });

  it('should notify onDrop instead of onDragEnd when dropped onto a dropzone', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const dropzone = document.createElement('div');
    dropzone.className = 'slick-dropzone';
    document.body.append(dropzone);
    headerLeft.append(firstName);

    const onDragEnd = vi.fn();
    const onDrop = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
      onDrop,
    });

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => dropzone as Element),
    });

    const dragStartEvt = createDragEvent('dragstart', {
      dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
      clientX: 10,
      clientY: 10,
    });
    firstName.dispatchEvent(dragStartEvt);

    const dragEndEvt = createDragEvent('dragend', { clientX: 20, clientY: 20 });
    firstName.dispatchEvent(dragEndEvt);

    expect(onDrop).toHaveBeenCalledWith(firstName, dragEndEvt, 'firstName');
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('should reorder headers with Firefox/Linux mouse fallback and call onDragEnd', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 Firefox/128.0 Linux x86_64' },
    });

    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    headerLeft.append(firstName, lastName);

    vi.spyOn(lastName, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 40,
      right: 140,
      top: 0,
      bottom: 0,
      x: 100,
      y: 0,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => lastName as Element),
    });

    const onDragEnd = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
    });

    firstName.dispatchEvent(createMouseEvent('mousedown', { clientX: 10, clientY: 10, target: firstName }));
    document.dispatchEvent(createMouseEvent('mousemove', { clientX: 139, clientY: 10 }));
    document.dispatchEvent(createMouseEvent('mouseup', { clientX: 139, clientY: 10 }));

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['lastName', 'firstName']);
    expect(onDragEnd).toHaveBeenCalledWith(['lastName', 'firstName']);

    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
  });

  it('should call onDrop on Firefox/Linux fallback mouseup when dropped over a dropzone', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 Firefox/128.0 Linux x86_64' },
    });

    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);
    const dropzone = document.createElement('div');
    dropzone.className = 'slick-dropzone';
    document.body.append(dropzone);

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => dropzone as Element),
    });

    const onDragEnd = vi.fn();
    const onDrop = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
      onDrop,
    });

    firstName.dispatchEvent(createMouseEvent('mousedown', { clientX: 10, clientY: 10, target: firstName }));
    document.dispatchEvent(createMouseEvent('mousemove', { clientX: 20, clientY: 20 }));
    document.dispatchEvent(createMouseEvent('mouseup', { clientX: 20, clientY: 20 }));

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDragEnd).not.toHaveBeenCalled();

    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
  });

  it('should keep working when elementFromPoint throws in dragend and still call onDragEnd', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    const onDragEnd = vi.fn();
    const instance = setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
    });

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => {
        throw new Error('boom');
      }),
    });

    firstName.dispatchEvent(
      createDragEvent('dragstart', {
        dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
        clientX: 10,
        clientY: 10,
      })
    );
    firstName.dispatchEvent(createDragEvent('dragend', { clientX: 20, clientY: 20 }));

    expect(onDragEnd).toHaveBeenCalledWith(['firstName']);

    instance.destroy();
  });

  it('should return early on dragover when pointer is over a dropzone and restore dragged header parent', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    headerLeft.append(firstName, lastName);
    const foreignParent = document.createElement('div');
    const dropzone = document.createElement('div');
    dropzone.className = 'slick-dropzone';
    document.body.append(dropzone, foreignParent);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    firstName.dispatchEvent(
      createDragEvent('dragstart', {
        dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
        clientX: 10,
        clientY: 10,
      })
    );

    foreignParent.append(firstName);

    const dropzoneOverEvent = createDragEvent('dragover', { clientX: 10, clientY: 10, target: dropzone });
    headerLeft.dispatchEvent(dropzoneOverEvent);

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName']);
  });

  it('should handle document-level dropzone enter/leave/hover listeners during an active drag', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    headerLeft.append(firstName, lastName);

    const foreignParent = document.createElement('div');
    const dropzone = document.createElement('div');
    dropzone.className = 'slick-dropzone';
    document.body.append(dropzone, foreignParent);

    const onDrop = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
      onDrop,
    });

    firstName.dispatchEvent(
      createDragEvent('dragstart', {
        dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
        clientX: 10,
        clientY: 10,
      })
    );

    // simulate dragged element being moved outside headers before document-level listeners fire
    foreignParent.append(firstName);

    const dragEnterEvt = createDragEvent('dragenter', { target: dropzone });
    document.dispatchEvent(dragEnterEvt);
    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName']);

    // mouseover path should also restore parent if moved again
    foreignParent.append(firstName);
    const mouseOverEvt = createMouseEvent('mouseover', { target: dropzone });
    document.dispatchEvent(mouseOverEvt);
    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName']);

    // mouseout + dragleave should clear dropzone active state and avoid onDrop
    const mouseOutEvt = createMouseEvent('mouseout', { target: dropzone, relatedTarget: document.body });
    document.dispatchEvent(mouseOutEvt);
    const dragLeaveEvt = createDragEvent('dragleave', { target: dropzone });
    document.dispatchEvent(dragLeaveEvt);

    firstName.dispatchEvent(createDragEvent('dragend', { clientX: 20, clientY: 20 }));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('should keep dropzone active on mouseout when relatedTarget is null but pointer is still over dropzone', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    const dropzone = document.createElement('div');
    dropzone.className = 'slick-dropzone';
    const dropzoneChild = document.createElement('div');
    dropzone.append(dropzoneChild);
    document.body.append(dropzone);

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => dropzoneChild as Element),
    });

    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd,
      onDrop,
    });

    firstName.dispatchEvent(
      createDragEvent('dragstart', {
        dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
        clientX: 10,
        clientY: 10,
      })
    );

    // mark dropzone active first
    document.dispatchEvent(createDragEvent('dragenter', { target: dropzone }));

    const mouseOutEvt = createMouseEvent('mouseout', { target: dropzone, relatedTarget: null, clientX: 25, clientY: 25 });
    document.dispatchEvent(mouseOutEvt);

    firstName.dispatchEvent(createDragEvent('dragend', { clientX: 25, clientY: 25 }));

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('should return early on dragover when target parent is not a header container', () => {
    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    const lastName = createHeaderColumn('lastName');
    const preHeaderGroup = createHeaderColumn('preHeaderGroup');
    const preHeaderContainer = document.createElement('div');
    preHeaderContainer.append(preHeaderGroup);
    headerLeft.append(firstName, lastName);

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    firstName.dispatchEvent(
      createDragEvent('dragstart', {
        dataTransfer: { effectAllowed: '', setData: vi.fn(), setDragImage: vi.fn() },
        clientX: 10,
        clientY: 10,
      })
    );

    // listener is on header containers, so dispatch from headerLeft with a foreign target
    headerLeft.dispatchEvent(createDragEvent('dragover', { target: preHeaderGroup, clientX: 110, clientY: 10 }));

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName', 'lastName']);
  });

  it('should return early in fallback mousemove when target header parent is not a header container', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 Firefox/128.0 Linux x86_64' },
    });

    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    const externalParent = document.createElement('div');
    const externalHeader = createHeaderColumn('externalHeader');
    externalParent.append(externalHeader);
    document.body.append(externalParent);

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => externalHeader as Element),
    });

    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    firstName.dispatchEvent(createMouseEvent('mousedown', { clientX: 10, clientY: 10, target: firstName }));
    document.dispatchEvent(createMouseEvent('mousemove', { clientX: 120, clientY: 10 }));

    expect(Array.from(headerLeft.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['firstName']);

    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
  });

  it('should detect dropzone from elementFromPoint on fallback mouseup when dropzone was not previously active', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 Firefox/128.0 Linux x86_64' },
    });

    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    const nonDropzoneElm = document.createElement('div');
    const dropzone = document.createElement('div');
    dropzone.className = 'slick-dropzone';
    document.body.append(nonDropzoneElm, dropzone);

    const elementFromPointMock = vi
      .fn()
      .mockReturnValueOnce(nonDropzoneElm as Element) // mousemove -> not dropzone, keeps internal flag false
      .mockReturnValueOnce(dropzone as Element); // mouseup -> should set droppedOnDropzone=true
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: elementFromPointMock,
    });

    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDrop,
      onDragEnd,
    });

    firstName.dispatchEvent(createMouseEvent('mousedown', { clientX: 10, clientY: 10, target: firstName }));
    document.dispatchEvent(createMouseEvent('mousemove', { clientX: 20, clientY: 20 }));
    document.dispatchEvent(createMouseEvent('mouseup', { clientX: 20, clientY: 20 }));

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDragEnd).not.toHaveBeenCalled();

    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
  });

  it('should set droppedOnDropzone during fallback mouseup from elementFromPoint detection path', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 Firefox/128.0 Linux x86_64' },
    });

    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    const nonDropzoneElm = document.createElement('div');
    const dropzone = document.createElement('div');
    dropzone.className = 'slick-dropzone';
    document.body.append(nonDropzoneElm, dropzone);

    let pointCallCount = 0;
    const elementFromPointMock = vi.fn(() => {
      pointCallCount += 1;
      return pointCallCount === 1 ? (nonDropzoneElm as Element) : (dropzone as Element);
    });
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: elementFromPointMock,
    });

    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDrop,
      onDragEnd,
    });

    firstName.dispatchEvent(createMouseEvent('mousedown', { clientX: 10, clientY: 10, target: firstName }));
    // 1st call to elementFromPoint from fallback mousemove => non-dropzone
    document.dispatchEvent(createMouseEvent('mousemove', { clientX: 20, clientY: 20 }));
    // 2nd call from fallback mouseup => dropzone (hits droppedOnDropzone = true path)
    document.dispatchEvent(createMouseEvent('mouseup', { clientX: 30, clientY: 30 }));

    expect(elementFromPointMock).toHaveBeenCalledTimes(2);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDragEnd).not.toHaveBeenCalled();

    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
  });

  it('should fallback to onDragEnd when elementFromPoint throws in fallback mouseup', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 Firefox/128.0 Linux x86_64' },
    });

    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => {
        throw new Error('boom');
      }),
    });

    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDrop,
      onDragEnd,
    });

    firstName.dispatchEvent(createMouseEvent('mousedown', { clientX: 10, clientY: 10, target: firstName }));
    document.dispatchEvent(createMouseEvent('mouseup', { clientX: 20, clientY: 20 }));

    expect(onDrop).not.toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalledWith(['firstName']);

    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
  });

  it('should remove Firefox fallback mousedown listener on destroy', () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 Firefox/128.0 Linux x86_64' },
    });

    const headerLeft = document.createElement('div');
    const headerRight = document.createElement('div');
    const viewport = document.createElement('div');
    const container = document.createElement('div');
    const firstName = createHeaderColumn('firstName');
    headerLeft.append(firstName);

    const removeLeftSpy = vi.spyOn(headerLeft, 'removeEventListener');
    const removeRightSpy = vi.spyOn(headerRight, 'removeEventListener');

    const instance = setupColumnReorderDrag({
      headerLeft,
      headerRight,
      container,
      viewportScrollContainerX: viewport,
      hasFrozenColumns: () => false,
      onDragEnd: vi.fn(),
    });

    instance.destroy();

    expect(removeLeftSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
    expect(removeRightSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);

    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
  });

  it('should return early in dropzone fallback mousemove when target resolves to dragged pill', () => {
    const originalUserAgent = window.navigator.userAgent;
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 Firefox/128.0 Linux x86_64',
    });

    const dropzoneElm = document.createElement('div');
    const firstPill = document.createElement('div');
    const secondPill = document.createElement('div');
    firstPill.className = 'slick-dropped-grouping';
    secondPill.className = 'slick-dropped-grouping';
    firstPill.dataset.id = 'age';
    secondPill.dataset.id = 'medals';
    dropzoneElm.append(firstPill, secondPill);
    document.body.append(dropzoneElm);

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => firstPill as Element), // ensures target === draggedPill
    });

    const onPillDragEnd = vi.fn();
    const instance = setupDropzonePillDrag({
      dropzoneElm,
      onPillDragEnd,
    });

    firstPill.dispatchEvent(createMouseEvent('mousedown', { clientX: 10, clientY: 10, target: firstPill }));
    document.dispatchEvent(createMouseEvent('mousemove', { clientX: 20, clientY: 20 }));

    // Should stay unchanged because fallback mousemove returned early when target === draggedPill.
    expect(Array.from(dropzoneElm.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(['age', 'medals']);

    document.dispatchEvent(createMouseEvent('mouseup', { clientX: 20, clientY: 20 }));
    expect(onPillDragEnd).toHaveBeenCalledTimes(1);

    instance.destroy();
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: originalUserAgent });
  });
});
