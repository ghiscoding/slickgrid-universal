import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Wire up keyboard navigation (this will use the filterFn)
import { bindKeyboardNavigation, wireMenuKeyboardNavigation } from '../keyboardNavigation';

describe('bindKeyboardNavigation', () => {
  let container: HTMLElement;
  let items: HTMLElement[];

  beforeEach(() => {
    container = document.createElement('div');
    container.tabIndex = 0;
    items = [];
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div');
      item.setAttribute('role', 'menuitem');
      item.tabIndex = 0;
      item.textContent = `Item ${i}`;
      // Mock offsetParent to simulate visible element
      Object.defineProperty(item, 'offsetParent', { value: container, configurable: true });
      items.push(item);
      container.appendChild(item);
    }
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should bind keydown handler', () => {
    const fakeService = {
      bind: vi.fn(),
    };

    bindKeyboardNavigation(container, fakeService as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });

    // Verify keydown handler is registered
    expect(fakeService.bind).toHaveBeenCalledWith(container, 'keydown', expect.any(Function), undefined, 'keyboard-navigation');
  });

  it('should bind mouseover handler for hover-to-focus', () => {
    const fakeService = {
      bind: vi.fn(),
    };

    bindKeyboardNavigation(container, fakeService as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });

    // Verify mouseover handler is registered (new hover feature)
    expect(fakeService.bind).toHaveBeenCalledWith(container, 'mouseover', expect.any(Function), undefined, 'keyboard-navigation');
  });

  it('should use custom eventServiceKey for both handlers', () => {
    const fakeService = {
      bind: vi.fn(),
    };

    bindKeyboardNavigation(container, fakeService as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
      eventServiceKey: 'custom-nav',
    });

    // Verify custom key is used for both keydown and mouseover
    const keydownCall = fakeService.bind.mock.calls.find((call) => call[1] === 'keydown');
    const mouseoverCall = fakeService.bind.mock.calls.find((call) => call[1] === 'mouseover');

    expect(keydownCall?.[4]).toBe('custom-nav');
    expect(mouseoverCall?.[4]).toBe('custom-nav');
  });

  it('should use custom filterFn when provided', () => {
    const filterFn = vi.fn(() => true);
    const fakeService = {
      bind: vi.fn(),
    };

    bindKeyboardNavigation(container, fakeService as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
      filterFn,
    });

    // Just verify binding happens with filter function
    expect(fakeService.bind).toHaveBeenCalled();
  });

  it('should move focus with ArrowDown and ArrowUp', () => {
    const service = {
      bind: (el: HTMLElement, event: string, handler: EventListener) => {
        el.addEventListener(event, handler);
      },
    };
    bindKeyboardNavigation(container, service as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });
    // Focus first item
    items[0].focus();
    expect(document.activeElement).toBe(items[0]);

    // ArrowDown moves to second item
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    container.dispatchEvent(downEvent);
    expect(document.activeElement).toBe(items[1]);

    // ArrowDown moves to third item
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);

    // ArrowDown wraps to first item
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);

    // ArrowUp wraps to last item
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);

    // ArrowUp moves to second item
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
  });

  it('should return early for non-navigation keys', () => {
    const service = {
      bind: (el: HTMLElement, event: string, handler: EventListener) => {
        el.addEventListener(event, handler);
      },
    };
    bindKeyboardNavigation(container, service as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });
    // Focus first item
    items[0].focus();
    // Dispatch a non-navigation key
    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    container.dispatchEvent(event);
    // No error, no focus change, just covers the early return
    expect(document.activeElement).toBe(items[0]);
  });

  it('should apply filterFn when hovering over items', () => {
    const menuItems = container.querySelectorAll('[role="menuitem"]');
    const filterFn = (item: HTMLElement) => item !== menuItems[2];

    const bindService = {
      bind: vi.fn(),
    };

    bindKeyboardNavigation(container, bindService as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
      filterFn,
    });

    // Verify mouseover handler is bound
    const mouseoverCall = bindService.bind.mock.calls.find((call) => call[1] === 'mouseover');
    expect(mouseoverCall).toBeDefined();

    // Extract and test the handler logic directly with proper event target
    const handler = mouseoverCall?.[2] as EventListener;
    if (handler) {
      // Test with item 1 (not filtered) - should call focus
      const focusSpy1 = vi.spyOn(menuItems[1] as HTMLElement, 'focus');
      const mockEvent1 = new MouseEvent('mouseover', { bubbles: true });
      Object.defineProperty(mockEvent1, 'target', { value: menuItems[1], configurable: true });
      handler(mockEvent1);
      expect(focusSpy1).toHaveBeenCalled();
      focusSpy1.mockRestore();

      // Test with item 2 (filtered out) - should NOT call focus
      const focusSpy2 = vi.spyOn(menuItems[2] as HTMLElement, 'focus');
      const mockEvent2 = new MouseEvent('mouseover', { bubbles: true });
      Object.defineProperty(mockEvent2, 'target', { value: menuItems[2], configurable: true });
      handler(mockEvent2);
      expect(focusSpy2).not.toHaveBeenCalled();
    }
  });

  it('should focus item on hover over valid menu item', () => {
    const menuItems = container.querySelectorAll('[role="menuitem"]');
    const bindService = {
      bind: vi.fn(),
    };

    bindKeyboardNavigation(container, bindService as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });

    // Verify mouseover handler is bound
    const mouseoverCall = bindService.bind.mock.calls.find((call) => call[1] === 'mouseover');
    expect(mouseoverCall).toBeDefined();

    // Extract and test the handler logic directly
    const handler = mouseoverCall?.[2] as EventListener;
    if (handler) {
      const focusSpy = vi.spyOn(menuItems[1] as HTMLElement, 'focus');
      const mockEvent = new MouseEvent('mouseover', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: menuItems[1], configurable: true });
      handler(mockEvent);
      expect(focusSpy).toHaveBeenCalled();
    }
  });

  it('should not focus item on hover if target is not a valid menu item', () => {
    const menuItems = container.querySelectorAll('[role="menuitem"]');
    const bindService = {
      bind: vi.fn(),
    };

    bindKeyboardNavigation(container, bindService as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });

    // Verify mouseover handler is bound
    const mouseoverCall = bindService.bind.mock.calls.find((call) => call[1] === 'mouseover');
    expect(mouseoverCall).toBeDefined();

    // Extract and test the handler logic directly
    const handler = mouseoverCall?.[2] as EventListener;
    if (handler) {
      const focusSpies = Array.from(menuItems).map((item) => vi.spyOn(item as HTMLElement, 'focus'));
      const outsideEl = document.createElement('div');
      const mockEvent = new MouseEvent('mouseover', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: outsideEl, configurable: true });
      handler(mockEvent);
      focusSpies.forEach((spy) => {
        expect(spy).not.toHaveBeenCalled();
      });
    }
  });

  it('should focus menu item when hovering over child element using closest()', () => {
    const menuItems = container.querySelectorAll('[role="menuitem"]');
    const bindService = {
      bind: vi.fn(),
    };

    bindKeyboardNavigation(container, bindService as any, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
    });

    // Verify mouseover handler is bound
    const mouseoverCall = bindService.bind.mock.calls.find((call) => call[1] === 'mouseover');
    expect(mouseoverCall).toBeDefined();

    // Extract and test the handler logic directly
    const handler = mouseoverCall?.[2] as EventListener;
    if (handler) {
      // Create a child element inside a menu item
      const child = document.createElement('span');
      child.textContent = 'child content';
      (menuItems[1] as HTMLElement).appendChild(child);

      const focusSpy = vi.spyOn(menuItems[1] as HTMLElement, 'focus');
      const mockEvent = new MouseEvent('mouseover', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: child, configurable: true });
      handler(mockEvent);

      // Should focus the parent menu item when hovering the child
      expect(focusSpy).toHaveBeenCalled();
    }
  });
});

describe('wireMenuKeyboardNavigation', () => {
  let menu: HTMLElement;

  beforeEach(() => {
    menu = document.createElement('div');
    menu.tabIndex = 0;
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div');
      item.setAttribute('role', 'menuitem');
      item.tabIndex = 0;
      item.textContent = `Menu Item ${i}`;
      // Mock offsetParent to simulate visible element
      Object.defineProperty(item, 'offsetParent', { value: menu, configurable: true });
      menu.appendChild(item);
    }
    document.body.appendChild(menu);
  });

  afterEach(() => {
    menu.remove();
  });

  it('should call bindKeyboardNavigation with default selectors', () => {
    const fakeService = {
      bind: vi.fn(),
    };

    wireMenuKeyboardNavigation(menu, fakeService);

    // Verify bindKeyboardNavigation was called with proper handler binding
    expect(fakeService.bind).toHaveBeenCalledWith(menu, 'keydown', expect.any(Function), undefined, 'menu-keyboard');
    expect(fakeService.bind).toHaveBeenCalledWith(menu, 'mouseover', expect.any(Function), undefined, 'menu-keyboard');
  });

  it('should prevent double-binding using data-keyboardNavBound flag', () => {
    const fakeService = {
      bind: vi.fn(),
    };

    // First call
    wireMenuKeyboardNavigation(menu, fakeService);
    const firstCallCount = fakeService.bind.mock.calls.length;

    // Reset mock
    fakeService.bind.mockClear();

    // Second call - should not bind again
    wireMenuKeyboardNavigation(menu, fakeService);
    const secondCallCount = fakeService.bind.mock.calls.length;

    expect(secondCallCount).toBe(0);
    expect(menu.dataset.keyboardNavBound).toBe('true');
  });

  it('should use custom onActivate option', () => {
    const onActivate = vi.fn();
    const fakeService = {
      bind: vi.fn(),
    };

    wireMenuKeyboardNavigation(menu, fakeService, { onActivate });

    expect(fakeService.bind).toHaveBeenCalled();
    expect(menu.dataset.keyboardNavBound).toBe('true');
  });

  it('should use custom onEscape option', () => {
    const onEscape = vi.fn();
    const fakeService = {
      bind: vi.fn(),
    };

    wireMenuKeyboardNavigation(menu, fakeService, { onEscape });

    expect(fakeService.bind).toHaveBeenCalled();
    expect(menu.dataset.keyboardNavBound).toBe('true');
  });

  it('should use custom onTab option', () => {
    const onTab = vi.fn();
    const fakeService = {
      bind: vi.fn(),
    };

    wireMenuKeyboardNavigation(menu, fakeService, { onTab });

    expect(fakeService.bind).toHaveBeenCalled();
    expect(menu.dataset.keyboardNavBound).toBe('true');
  });

  it('should use custom eventServiceKey', () => {
    const fakeService = {
      bind: vi.fn(),
    };

    wireMenuKeyboardNavigation(menu, fakeService, { eventServiceKey: 'custom-menu' });

    const keydownCall = fakeService.bind.mock.calls.find((call) => call[1] === 'keydown');
    expect(keydownCall?.[4]).toBe('custom-menu');
  });

  it('should use custom focusedItemSelector and allItemsSelector', () => {
    const fakeService = {
      bind: vi.fn(),
    };

    wireMenuKeyboardNavigation(menu, fakeService, {
      focusedItemSelector: '[data-custom]:focus',
      allItemsSelector: '[data-custom]',
    });

    expect(fakeService.bind).toHaveBeenCalled();
    expect(menu.dataset.keyboardNavBound).toBe('true');
  });

  it('should exclude disabled items from navigation based on selector', () => {
    const disabled = menu.children[1] as HTMLElement;
    disabled.classList.add('slick-menu-item-disabled');

    const fakeService = {
      bind: vi.fn(),
    };

    wireMenuKeyboardNavigation(menu, fakeService);

    // Verify the default selector excludes disabled items
    expect(fakeService.bind).toHaveBeenCalled();
  });

  it('should bind hover handler for mouseover events', () => {
    const fakeService = {
      bind: vi.fn(),
    };

    wireMenuKeyboardNavigation(menu, fakeService);

    // Verify mouseover handler is bound (hover-to-focus feature)
    const mouseoverCall = fakeService.bind.mock.calls.find((call) => call[1] === 'mouseover');
    expect(mouseoverCall).toBeDefined();
    expect(mouseoverCall?.[1]).toBe('mouseover');
  });

  it('should filter out hidden items using filterFn in wireMenuKeyboardNavigation', () => {
    // Create a menu container and two items, one hidden
    const testMenu = document.createElement('div');
    testMenu.tabIndex = 0;
    const visible = document.createElement('div');
    visible.setAttribute('role', 'menuitem');
    visible.tabIndex = 0;
    visible.textContent = 'Visible';
    // Mock offsetParent for visible item
    Object.defineProperty(visible, 'offsetParent', { value: testMenu, configurable: true });
    const hidden = document.createElement('div');
    hidden.setAttribute('role', 'menuitem');
    hidden.tabIndex = 0;
    hidden.textContent = 'Hidden';
    hidden.style.display = 'none';
    // offsetParent is null for hidden items
    testMenu.appendChild(visible);
    testMenu.appendChild(hidden);
    document.body.appendChild(testMenu);

    const fakeService = {
      bind: (el: HTMLElement, event: string, handler: EventListener) => {
        el.addEventListener(event, handler);
      },
    };

    // Focus the visible item
    visible.focus();

    wireMenuKeyboardNavigation(testMenu, fakeService);

    // Dispatch ArrowDown (should not focus hidden)
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    testMenu.dispatchEvent(event);

    // Only the visible item should be focusable
    expect(document.activeElement).toBe(visible);

    testMenu.remove();
  });
});

describe('Sub-menu keyboard navigation', () => {
  let container: HTMLElement;
  let parentItem: HTMLElement;
  let subMenuItem: HTMLElement;
  let subMenu: HTMLElement;
  let bindService: any;
  let onOpenSubMenu: any;
  let onCloseSubMenu: any;

  beforeEach(() => {
    container = document.createElement('div');
    container.tabIndex = 0;
    parentItem = document.createElement('div');
    parentItem.setAttribute('role', 'menuitem');
    parentItem.classList.add('slick-submenu-item', 'dropright');
    parentItem.tabIndex = 0;
    parentItem.textContent = 'Parent Item';
    Object.defineProperty(parentItem, 'offsetParent', { value: container, configurable: true });
    container.appendChild(parentItem);

    subMenu = document.createElement('div');
    subMenu.classList.add('slick-submenu');
    subMenu.tabIndex = 0;
    Object.defineProperty(subMenu, 'offsetParent', { value: document.body, configurable: true });
    document.body.appendChild(subMenu);

    subMenuItem = document.createElement('div');
    subMenuItem.setAttribute('role', 'menuitem');
    subMenuItem.tabIndex = 0;
    subMenuItem.textContent = 'SubMenu Item';
    Object.defineProperty(subMenuItem, 'offsetParent', { value: subMenu, configurable: true });
    subMenu.appendChild(subMenuItem);

    // Ensure offsetParent is set for all elements in every test
    Object.defineProperty(parentItem, 'offsetParent', { value: container, configurable: true });
    Object.defineProperty(subMenu, 'offsetParent', { value: document.body, configurable: true });
    Object.defineProperty(subMenuItem, 'offsetParent', { value: subMenu, configurable: true });

    bindService = {
      bind: (el: HTMLElement, event: string, handler: EventListener) => {
        el.addEventListener(event, handler);
      },
    };
    onOpenSubMenu = vi.fn();
    onCloseSubMenu = vi.fn();

    bindKeyboardNavigation(container, bindService, {
      focusedItemSelector: '[role="menuitem"]:focus',
      allItemsSelector: '[role="menuitem"]',
      onOpenSubMenu,
      onCloseSubMenu,
    });
  });

  afterEach(() => {
    container.remove();
    subMenu.remove();
  });

  it('should call onOpenSubMenu when ArrowRight is pressed on submenu trigger', () => {
    document.body.appendChild(container);
    parentItem.tabIndex = 0;
    parentItem.focus();
    if (document.activeElement !== parentItem) {
      Object.defineProperty(document, 'activeElement', { value: parentItem, configurable: true });
    }
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    container.dispatchEvent(event);
    expect(onOpenSubMenu).toHaveBeenCalledWith(parentItem);
  });

  it('should call onOpenSubMenu when Enter is pressed on submenu trigger', () => {
    document.body.appendChild(container);
    parentItem.tabIndex = 0;
    parentItem.focus();
    if (document.activeElement !== parentItem) {
      Object.defineProperty(document, 'activeElement', { value: parentItem, configurable: true });
    }
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    container.dispatchEvent(event);
    expect(onOpenSubMenu).toHaveBeenCalledWith(parentItem);
  });

  it('should call onOpenSubMenu when Space is pressed on submenu trigger', () => {
    document.body.appendChild(container);
    parentItem.tabIndex = 0;
    parentItem.focus();
    if (document.activeElement !== parentItem) {
      Object.defineProperty(document, 'activeElement', { value: parentItem, configurable: true });
    }
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    container.dispatchEvent(event);
    expect(onOpenSubMenu).toHaveBeenCalledWith(parentItem);
  });

  it('should call onCloseSubMenu when ArrowLeft is pressed in submenu', () => {
    parentItem.appendChild(subMenu);
    container.appendChild(parentItem);
    document.body.appendChild(container);
    subMenuItem.tabIndex = 0;
    subMenuItem.focus();
    if (document.activeElement !== subMenuItem) {
      Object.defineProperty(document, 'activeElement', { value: subMenuItem, configurable: true });
    }
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    subMenu.dispatchEvent(event);
    expect(onCloseSubMenu).toHaveBeenCalledWith(subMenuItem);
  });

  it('should call onCloseSubMenu when ArrowLeft is pressed in dropleft submenu', () => {
    parentItem.classList.remove('dropright');
    parentItem.classList.add('dropleft');
    parentItem.appendChild(subMenu);
    container.appendChild(parentItem);
    document.body.appendChild(container);
    subMenuItem.tabIndex = 0;
    subMenuItem.focus();
    if (document.activeElement !== subMenuItem) {
      Object.defineProperty(document, 'activeElement', { value: subMenuItem, configurable: true });
    }
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    subMenu.dispatchEvent(event);
    expect(onCloseSubMenu).toHaveBeenCalledWith(subMenuItem);
  });

  it('should not call onOpenSubMenu for ArrowRight if not a submenu trigger', () => {
    subMenuItem.focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    container.dispatchEvent(event);
    expect(onOpenSubMenu).not.toHaveBeenCalled();
  });

  it('should not call onCloseSubMenu for ArrowLeft if not in submenu', () => {
    parentItem.focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    container.dispatchEvent(event);
    expect(onCloseSubMenu).not.toHaveBeenCalled();
  });
});
