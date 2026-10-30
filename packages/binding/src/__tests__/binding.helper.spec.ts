import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BindingHelper } from '../binding.helper.js';

describe('Binding Helper', () => {
  let div: HTMLDivElement;
  let helper: BindingHelper;

  beforeEach(() => {
    div = document.createElement('div');
    document.body.appendChild(div);
    helper = new BindingHelper();
  });

  afterEach(() => {
    div.remove();
    helper.dispose();
    vi.clearAllMocks();
  });

  it('should add a binding for an input and call a value change and expect a mocked object to have the reflected value', () => {
    const mockCallback = vi.fn();
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    elm.className = 'custom-class';
    div.appendChild(elm);

    helper.addElementBinding(mockObj, 'name', 'input.custom-class', 'value', 'change', mockCallback);
    elm.value = 'Jane';
    const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: 'Jane' } } });
    elm.dispatchEvent(mockEvent);

    expect(helper.observers.length).toBe(1);
    expect(helper.querySelectorPrefix).toBe('');
    expect(mockObj.name).toBe('Jane');
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should reuse the observer for an input when calling "addElementBinding" twice with same arguments', () => {
    const mockCallback = vi.fn();
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    elm.className = 'custom-class';
    div.appendChild(elm);

    helper.addElementBinding(mockObj, 'name', 'input.custom-class', 'value', 'change', mockCallback);
    helper.addElementBinding(mockObj, 'name', 'input.custom-class', 'value', 'change', mockCallback);
    elm.value = 'Jane';
    const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: 'Jane' } } });
    elm.dispatchEvent(mockEvent);

    expect(helper.observers.length).toBe(1);
    expect(helper.querySelectorPrefix).toBe('');
    expect(mockObj.name).toBe('Jane');
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should add a binding for a mocked object and expect the value to be reflected in the element input value', () => {
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    elm.className = 'custom-class';
    div.appendChild(elm);

    helper.addElementBinding(mockObj, 'name', 'input.custom-class', 'value', 'change');
    mockObj.name = 'Jane';

    expect(helper.querySelectorPrefix).toBe('');
    expect(elm.value).toBe('Jane');
  });

  it('should add a binding for an span with multiple events change/blur and expect a mocked object to have the reflected value', () => {
    const mockObj = { name: 'John', age: 20 };
    const elm = document.createElement('input');
    elm.className = 'custom-class';
    div.appendChild(elm);

    helper.addElementBinding(mockObj, 'name', 'input.custom-class', 'value', ['change', 'blur']);
    elm.value = 'Jane';
    const mockEvent1 = new CustomEvent('change', { bubbles: true, detail: { target: { value: 'Jane' } } });
    elm.dispatchEvent(mockEvent1);

    expect(helper.querySelectorPrefix).toBe('');
    expect(mockObj.name).toBe('Jane');

    elm.value = 'Johnny';
    const mockEvent2 = new CustomEvent('blur', { bubbles: true, detail: { target: { value: 'Jane' } } });
    elm.dispatchEvent(mockEvent2);

    expect(mockObj.name).toBe('Johnny');
  });

  it('should add a binding for a mocked object and expect the value to be reflected in multiple elements input values', () => {
    const mockObj = { name: 'John', age: 20 };
    const elm1 = document.createElement('span');
    const elm2 = document.createElement('span');
    elm1.className = 'custom';
    elm2.className = 'custom';
    div.className = 'grid';
    div.appendChild(elm1);
    div.appendChild(elm2);

    helper.querySelectorPrefix = '.grid ';
    helper.addElementBinding(mockObj, 'age', 'span.custom', 'textContent');
    mockObj.age = 30;

    expect(helper.observers.length).toBe(1);
    expect(helper.observers[0].elementBindings.length).toBe(2);
    expect(helper.querySelectorPrefix).toBe('.grid ');
    expect(elm1.textContent).toBe('30');
    expect(elm2.textContent).toBe('30');
    expect(document.querySelectorAll('.grid span.custom').length).toBe(2);
  });

  it('should add event handler and expect callback to be called', () => {
    const mockCallback = vi.fn();
    const elm = document.createElement('button');
    elm.className = 'grid123 icon-first';
    div.appendChild(elm);

    helper.querySelectorPrefix = '.grid123';
    helper.bindEventHandler('.icon-first', 'click', mockCallback);
    const mockEvent = new CustomEvent('click');
    elm.dispatchEvent(mockEvent);

    expect(helper.querySelectorPrefix).toBe('.grid123');
    expect(mockCallback).toHaveBeenCalled();
  });

  it('set an element attribute with new value defined', () => {
    const elm = document.createElement('span');
    elm.className = 'something';
    div.appendChild(elm);

    helper.setElementAttributeValue('.something', 'textContent', 'Hello World');

    expect(elm.textContent).toBe('Hello World');
  });

  it('set an element attribute with new value defined with a prefix also defined', () => {
    const elm = document.createElement('span');
    elm.className = 'prefixer something';
    div.appendChild(elm);

    helper.querySelectorPrefix = '.prefixer';
    helper.setElementAttributeValue('.something', 'textContent', 'Hello World');

    expect(elm.textContent).toBe('Hello World');
  });
  it('shares model updates across selectors and keeps different models separate', () => {
    div.innerHTML = '<input class="first"><input class="second"><input class="third">';
    const model = { value: 'a' };
    helper.addElementBinding(model, 'value', '.first', 'value');
    helper.addElementBinding(model, 'value', '.second', 'value');
    helper.addElementBinding({ value: 'b' }, 'value', '.third', 'value');
    model.value = 'updated';
    expect(Array.from(div.querySelectorAll('input'), (elm) => elm.value)).toEqual(['updated', 'updated', 'b']);
    expect(helper.observers).toHaveLength(2);
  });

  it('removes helper event handlers on disposal including capture listeners', () => {
    div.className = 'target';
    const callback = vi.fn();
    helper.bindEventHandler('.target', 'click', callback, true);
    helper.dispose();
    div.dispatchEvent(new Event('click'));
    expect(callback).not.toHaveBeenCalled();
    helper.dispose();
  });

  it('ignores unknown element attributes', () => {
    div.className = 'target';
    helper.setElementAttributeValue('.target', 'unknown', 'value');
    expect(div).not.toHaveProperty('unknown');
  });
});
