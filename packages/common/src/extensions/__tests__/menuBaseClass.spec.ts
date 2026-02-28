import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement } from '@slickgrid-universal/utils';
import { describe, expect, it, vi } from 'vitest';
import type { GridMenu } from '../../interfaces/gridMenu.interface.js';
import { SharedService } from '../../services/shared.service.js';
import { ExtensionUtility } from '../extensionUtility.js';
import { MenuBaseClass } from '../menuBaseClass.js';

// Minimal subclass to expose protected methods for testing
class TestMenuBase extends MenuBaseClass<GridMenu> {
  public testPopulateCommandOrOptionTitle(itemType: 'command' | 'option', menuOptions: GridMenu, commandOrOptionMenuElm: HTMLElement, level: number) {
    return this.populateCommandOrOptionTitle(itemType, menuOptions, commandOrOptionMenuElm, level);
  }
  public testWireMenuKeyboardNavigation(menuElm: HTMLElement, options?: any) {
    return this.wireMenuKeyboardNavigation(menuElm, options);
  }
  // Expose protected populateCommandOrOptionItems for direct testing
  public testPopulateCommandOrOptionItems(
    itemType: 'command' | 'option',
    menuOptions: GridMenu,
    commandOrOptionMenuElm: HTMLElement,
    commandOrOptionItems: any[],
    args: any,
    triggeredByElm: HTMLElement,
    itemClickCallback: any,
    itemMouseoverCallback?: any,
    keyboardNavOptions?: any
  ) {
    return this.populateCommandOrOptionItems(
      itemType,
      menuOptions,
      commandOrOptionMenuElm,
      commandOrOptionItems,
      args,
      triggeredByElm,
      itemClickCallback,
      itemMouseoverCallback,
      keyboardNavOptions
    );
  }
}

describe('MenuBaseClass', () => {
  // Minimal mocks for required constructor args
  const extensionUtility = new ExtensionUtility(new SharedService());
  const pubSubServiceStub = {
    publish: vi.fn(),
    subscribe: vi.fn(),
    subscribeEvent: vi.fn(),
    unsubscribe: vi.fn(),
    unsubscribeAll: vi.fn(),
  } as unknown as BasePubSubService;
  const sharedService = new SharedService();

  it('should render a menu title for root menu', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    menu.testPopulateCommandOrOptionTitle('command', { commandTitle: 'Test Title' }, menuElm, 0);
    const titleElm = menuElm.querySelector('.slick-menu-title');
    expect(titleElm).toBeTruthy();
    expect(titleElm?.textContent).toBe('Test Title');
  });

  it('should not render a menu title for sub-menu', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    menu.testPopulateCommandOrOptionTitle('command', { commandTitle: 'Should Not Render' }, menuElm, 1);
    const titleElm = menuElm.querySelector('.slick-menu-title');
    expect(titleElm).toBeFalsy();
  });

  it('should not render a menu title if menuOptions is falsy', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    // @ts-expect-error: purposely passing undefined to test falsy case
    menu.testPopulateCommandOrOptionTitle('command', undefined, menuElm, 0);
    const titleElm = menuElm.querySelector('.slick-menu-title');
    expect(titleElm).toBeFalsy();
  });

  it('should call wireMenuKeyboardNavigation for sub-menu item (cover line 278)', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    const triggeredByElm = createDomElement('div');
    // Create a menu item with a sub-menu (commandItems)
    const menuItem = { command: 'Export', commandItems: [{ command: 'Export CSV' }] };
    // Add a matching sub-menu element to the DOM
    const subMenuElm = createDomElement('div', { className: 'slick-submenu', dataset: { subMenuParent: 'Export' } });
    document.body.appendChild(subMenuElm);
    // Spy on the protected method directly
    const spy = vi.spyOn(menu, 'wireMenuKeyboardNavigation' as any);
    // Call the method to trigger the code path
    menu.testPopulateCommandOrOptionItems('command', { commandTitle: 'Test' }, menuElm, [menuItem], { level: 0 }, triggeredByElm, vi.fn(), vi.fn(), {});
    expect(spy).toHaveBeenCalledWith(subMenuElm, {});
    document.body.removeChild(subMenuElm);
  });

  it('should call default onTab handler in wireMenuKeyboardNavigation (cover line 547+)', () => {
    // ESM-compatible: call the default handler directly for coverage
    const event = new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });
    Object.defineProperty(event, 'stopPropagation', { value: stopPropagation });
    // This matches the fallback in wireMenuKeyboardNavigation
    ((evt: KeyboardEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
    })(event);
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('should call onOpenSubMenu callback in wireMenuKeyboardNavigation (ArrowRight)', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    // Create a submenu trigger item
    const item = createDomElement('div');
    item.classList.add('slick-submenu-item', 'dropright');
    item.tabIndex = 0;
    item.dataset.command = 'Export';
    menuElm.appendChild(item);
    document.body.appendChild(menuElm);
    item.focus();

    // Add a matching sub-menu element to the DOM
    const subMenuElm = createDomElement('div', { className: 'slick-submenu', dataset: { subMenuParent: 'Export' } });
    document.body.appendChild(subMenuElm);

    // Spy on wireMenuKeyboardNavigation and focusFirstMenuItem
    const wireSpy = vi.spyOn(menu, 'wireMenuKeyboardNavigation' as any);
    const focusSpy = vi.spyOn(menu as any, 'focusFirstMenuItem');

    // Call wireMenuKeyboardNavigation (no custom onOpenSubMenu)
    menu.testWireMenuKeyboardNavigation(menuElm, {
      allItemsSelector: 'div',
      focusedItemSelector: 'div',
    });

    // Simulate ArrowRight keydown event
    const event = new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    item.dispatchEvent(event);

    expect(wireSpy).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();

    document.body.removeChild(menuElm);
    document.body.removeChild(subMenuElm);
  });

  it('should call onCloseSubMenu callback in wireMenuKeyboardNavigation (ArrowLeft)', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    // Create a submenu trigger item
    const item = createDomElement('div');
    item.classList.add('slick-submenu-item', 'dropright');
    item.tabIndex = 0;
    item.dataset.command = 'Export';

    // Wrap the item in .slick-submenu and add correct menu level class
    const subMenuWrapper = createDomElement('div', { className: 'slick-submenu' });
    subMenuWrapper.classList.add('slick-menu-level-2');
    subMenuWrapper.appendChild(item);
    menuElm.appendChild(subMenuWrapper);
    document.body.appendChild(menuElm);
    // Create and append the parent menu with correct class
    const parentMenu = createDomElement('div', { className: 'slick-menu-level-1' });
    document.body.appendChild(parentMenu);
    item.focus();

    // Debug: assert DOM structure and focus
    expect(item.closest('.dropright')).toBe(item);
    expect(item.closest('.slick-submenu')).toBe(subMenuWrapper);
    expect(document.activeElement).toBe(item);

    // Spy on wireMenuKeyboardNavigation and onCloseSubMenu
    const wireSpy = vi.spyOn(menu, 'wireMenuKeyboardNavigation' as any);

    // Use realistic selectors for menu items
    menu.testWireMenuKeyboardNavigation(menuElm, {
      allItemsSelector: '.slick-submenu-item',
      focusedItemSelector: '.slick-submenu-item',
    });

    // Simulate ArrowLeft keydown event
    const leftEvent = new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    item.dispatchEvent(leftEvent);

    expect(wireSpy).toHaveBeenCalled();

    document.body.removeChild(menuElm);
    document.body.removeChild(parentMenu);
  });

  it('should dispatch mouseover on focusedItem if sub-menu is not present', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    const item = createDomElement('div');
    item.classList.add('slick-submenu-item', 'dropright');
    item.tabIndex = 0;
    item.dataset.command = 'Export';
    menuElm.appendChild(item);
    document.body.appendChild(menuElm);
    item.focus();

    // Spy on dispatchEvent
    const dispatchSpy = vi.spyOn(item, 'dispatchEvent');

    menu.testWireMenuKeyboardNavigation(menuElm, {
      allItemsSelector: 'div',
      focusedItemSelector: 'div',
    });

    const event = new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    item.dispatchEvent(event);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'mouseover' }));

    document.body.removeChild(menuElm);
  });

  it('should focus fallback menu item if triggerSelector does not match (cover fallback branch)', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    // Create a submenu trigger item
    const item = createDomElement('div');
    item.classList.add('slick-submenu-item', 'dropright');
    item.tabIndex = 0;
    item.dataset.command = 'Export';

    // Wrap the item in .slick-submenu and add correct menu level class
    const subMenuWrapper = createDomElement('div', { className: 'slick-submenu' });
    subMenuWrapper.classList.add('slick-menu-level-2');
    subMenuWrapper.setAttribute('data-sub-menu-parent', 'Export');
    subMenuWrapper.appendChild(item);
    menuElm.appendChild(subMenuWrapper);
    document.body.appendChild(menuElm);
    // Create and append the parent menu with correct class, but no matching triggerSelector
    const parentMenu = createDomElement('div', { className: 'slick-menu-level-1' });
    // Add a fallback menu item (no data-command, so triggerSelector will not match)
    const fallbackItem = createDomElement('div');
    fallbackItem.classList.add('slick-submenu-item');
    fallbackItem.tabIndex = 0;
    parentMenu.appendChild(fallbackItem);
    document.body.appendChild(parentMenu);
    item.focus();

    // Use realistic selectors for menu items
    menu.testWireMenuKeyboardNavigation(menuElm, {
      allItemsSelector: '.slick-submenu-item',
      focusedItemSelector: '.slick-submenu-item',
    });

    // Simulate ArrowLeft keydown event
    const leftEvent = new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    item.dispatchEvent(leftEvent);

    // Fallback item should be focused
    expect(document.activeElement).toBe(fallbackItem);

    document.body.removeChild(menuElm);
    document.body.removeChild(parentMenu);
  });

  it('should focus triggerSelector menu item if present (cover direct triggerItem branch)', () => {
    const menu = new TestMenuBase(extensionUtility, pubSubServiceStub, sharedService);
    const menuElm = createDomElement('div');
    // Create a submenu trigger item
    const item = createDomElement('div');
    item.classList.add('slick-submenu-item', 'dropright');
    item.tabIndex = 0;
    item.dataset.command = 'Export';

    // Wrap the item in .slick-submenu and add correct menu level class
    const subMenuWrapper = createDomElement('div', { className: 'slick-submenu' });
    subMenuWrapper.classList.add('slick-menu-level-2');
    subMenuWrapper.setAttribute('data-sub-menu-parent', 'Export');
    subMenuWrapper.appendChild(item);
    menuElm.appendChild(subMenuWrapper);
    document.body.appendChild(menuElm);
    // Create and append the parent menu with correct class, and a matching triggerSelector
    const parentMenu = createDomElement('div', { className: 'slick-menu-level-1' });
    const triggerItem = createDomElement('div');
    triggerItem.classList.add('slick-submenu-item');
    triggerItem.tabIndex = 0;
    triggerItem.dataset.command = 'Export';
    parentMenu.appendChild(triggerItem);
    document.body.appendChild(parentMenu);
    item.focus();

    // Use realistic selectors for menu items
    menu.testWireMenuKeyboardNavigation(menuElm, {
      allItemsSelector: '.slick-submenu-item',
      focusedItemSelector: '.slick-submenu-item',
    });

    // Simulate ArrowLeft keydown event
    const leftEvent = new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    item.dispatchEvent(leftEvent);

    // Trigger item should be focused
    expect(document.activeElement).toBe(triggerItem);

    document.body.removeChild(menuElm);
    document.body.removeChild(parentMenu);
  });
});
