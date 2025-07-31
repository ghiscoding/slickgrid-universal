import { describe, expect, it, vi } from 'vitest';

import {
  calculateAvailableSpace,
  classNameToList,
  createDomElement,
  destroyAllElementProps,
  emptyElement,
  findFirstAttribute,
  findWidthOrDefault,
  getHtmlStringOutput,
  getOffsetRelativeToParent,
  getStyleProp,
  getOffset,
  getInnerSize,
  htmlDecode,
  htmlEncode,
  htmlEntityDecode,
  htmlEncodeWithPadding,
  insertAfterElement,
} from '../domUtils.js';

describe('Service/domUtilies', () => {
  describe('calculateAvailableSpace() method', () => {
    const div = document.createElement('div');
    div.innerHTML = `<ul><li>Item 1</li><li>Item 2</li></ul>`;
    document.body.appendChild(div);

    it('should calculate space when return left/top 0 when original resolution is 1024*768', () => {
      const output = calculateAvailableSpace(div);
      expect(output).toEqual({
        bottom: 768,
        left: 0,
        right: 1024,
        top: 0,
      });
    });

    it('should calculate space on all sides', () => {
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 400 });
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
      vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 25 } as any);
      div.style.top = '10px';
      div.style.left = '25px';

      const output = calculateAvailableSpace(div);
      expect(output).toEqual({
        bottom: 390, // 400px - 10px
        left: 25,
        right: 1175, // 1200px - 25px
        top: 10,
      });
    });
  });

  describe('classNameToList() method', () => {
    it('should return empty array when input string is undefined', () => {
      expect(classNameToList(undefined)).toEqual([]);
    });

    it('should return an array with 2 words when multiple whitespaces are part of the string', () => {
      const input = '   hello    world  ';
      expect(classNameToList(input)).toEqual(['hello', 'world']);
    });

    it('should return an array with 4 words when input includes hypens and multiple whitespaces', () => {
      const input = '   my-class  another--class    hello world!  ';
      expect(classNameToList(input)).toEqual(['my-class', 'another--class', 'hello', 'world!']);
    });
  });

  describe('createDomElement() method', () => {
    it('should create a DOM element via the method to equal a regular DOM element', () => {
      const div = document.createElement('div');
      div.className = 'red bold';
      const cdiv = createDomElement('div', { className: 'red bold' });

      expect(cdiv).toEqual(div);
      expect(cdiv.outerHTML).toEqual(div.outerHTML);
    });

    it('should create a DOM element via the method to equal a regular DOM element', () => {
      const div = document.createElement('div');
      div.className = 'red bold';
      createDomElement('span', { className: 'blue', textContent: 'some text', style: { fontWeight: 'bold' } }, div);

      expect(div.outerHTML).toBe('<div class="red bold"><span class="blue" style="font-weight: bold;">some text</span></div>');
    });

    it('should display a warning when trying to use innerHTML via the method', () => {
      const consoleWarnSpy = vi.spyOn(global.console, 'warn').mockReturnValue();
      createDomElement('div', { className: 'red bold', innerHTML: '<input />' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `[Slickgrid-Universal] For better CSP (Content Security Policy) support, do not use "innerHTML" directly in "createDomElement('div', { innerHTML: 'some html'})"`
        )
      );
    });
  });

  describe('destroyAllElementProps() method', () => {
    it('should clear all DOM element props from the object', () => {
      const obj = {
        age: 20,
        elm: document.createElement('div'),
        elms: [document.createElement('div')],
      };
      destroyAllElementProps(obj);

      expect(obj).toEqual({ age: 20, elm: null, elms: [null] });
    });
  });

  describe('emptyElement() method', () => {
    const div = document.createElement('div');
    div.innerHTML = `<ul><li>Item 1</li><li>Item 2</li></ul>`;
    document.body.appendChild(div);

    it('should empty the DOM element', () => {
      expect(div.outerHTML).toBe('<div><ul><li>Item 1</li><li>Item 2</li></ul></div>');
      emptyElement(div);
      expect(div.outerHTML).toBe('<div></div>');
    });
  });

  describe('findFirstAttribute() method', () => {
    const div = document.createElement('div');
    div.innerHTML = `<ul><li>Item 1</li><li custom-title="custom text" title="some tooltip text">Item 2</li></ul>`;
    document.body.appendChild(div);

    it('should return [title] attribute when other attribute is not defined', () => {
      const output = findFirstAttribute(div.querySelectorAll('li')[1], ['not-exist', 'title']);
      expect(output).toBe('some tooltip text');
    });

    it('should return [custom-title] attribute when both attributes are defined but custom-title is first found', () => {
      const output = findFirstAttribute(div.querySelectorAll('li')[1], ['custom-title', 'title']);
      expect(output).toBe('custom text');
    });

    it('should return null when no attributes found', () => {
      const output = findFirstAttribute(div.querySelectorAll('li')[1], ['not-exist', 'another']);
      expect(output).toBe(null);
    });
  });

  describe('findWidthOrDefault() method', () => {
    it('should return default value when input is null', () => {
      expect(findWidthOrDefault(null, '20px')).toBe('20px');
    });

    it('should return default value when input is undefined', () => {
      expect(findWidthOrDefault(undefined, '20px')).toBe('20px');
    });

    it('should return value in pixel when input is a number', () => {
      expect(findWidthOrDefault(33, '20px')).toBe('33px');
    });
  });

  describe('getHtmlStringOutput() method', () => {
    it('should return innerHTML from fragment', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'some text';
      const fragment = new DocumentFragment();
      div.appendChild(span);
      fragment.appendChild(div);

      const result = getHtmlStringOutput(fragment);

      expect(result).toBe('<span>some text</span>');
    });

    it('should return outerHTML from fragment', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'some text';
      const fragment = new DocumentFragment();
      div.appendChild(span);
      fragment.appendChild(div);

      const result = getHtmlStringOutput(fragment, 'outerHTML');

      expect(result).toBe('<div><span>some text</span></div>');
    });

    it('should return innerHTML of input div when input is a div and no argument type is provided, defaults to innerHTML', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'some text';
      div.appendChild(span);

      expect(getHtmlStringOutput(div as any)).toEqual('<span>some text</span>');
    });

    it('should return same string when input is already an HTML string', () => {
      const input = '<span>some text</span>';

      expect(getHtmlStringOutput(input)).toEqual(input);
    });
  });

  describe('getElementOffsetRelativeToParent() method', () => {
    const parentDiv = document.createElement('div');
    const childDiv = document.createElement('div');
    parentDiv.innerHTML = `<span></span>`;
    document.body.appendChild(parentDiv);

    it('should return undefined when element if not a valid html element', () => {
      const output = getOffsetRelativeToParent(null, null);
      expect(output).toEqual(undefined);
    });

    it('should return top/left 0 when creating a new element in the document without positions', () => {
      const output = getOffsetRelativeToParent(parentDiv, childDiv);
      expect(output).toEqual({ top: 0, left: 0, bottom: 0, right: 0 });
    });

    it('should return same top/left positions as defined in the document/window', () => {
      vi.spyOn(parentDiv, 'getBoundingClientRect').mockReturnValue({ top: 20, bottom: 33, left: 25, right: 44 } as any);
      vi.spyOn(childDiv, 'getBoundingClientRect').mockReturnValue({ top: 130, bottom: 70, left: 250, right: 66 } as any);
      parentDiv.style.top = '10px';
      parentDiv.style.left = '25px';

      const output = getOffsetRelativeToParent(parentDiv, childDiv);
      expect(output).toEqual({ top: 110, left: 225, bottom: 37, right: 22 });
    });
  });

  describe('getOffset() method', () => {
    const div = document.createElement('div');
    div.innerHTML = `<span></span>`;
    document.body.appendChild(div);

    it('should return undefined when element if not a valid html element', () => {
      const output = getOffset(null as any);
      expect(output).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
    });

    it('should return top/left 0 when creating a new element in the document without positions', () => {
      const output = getOffset(div);
      expect(output).toEqual({ top: 0, left: 0, bottom: 0, right: 0 });
    });

    it('should return same top/left positions as defined in the document/window', () => {
      vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 25 } as any);
      div.style.top = '10px';
      div.style.left = '25px';

      const output = getOffset(div);
      expect(output).toEqual({ top: 10, left: 25 });
    });
  });

  describe('getInnerSize() method', () => {
    it('should return 0 when input element is null', () => {
      const result = getInnerSize(null as any, 'height');

      expect(result).toBe(0);
    });

    it('should return clientHeight when input element is defined with a certain height', () => {
      const div = document.createElement('div');
      Object.defineProperty(div, 'clientHeight', { writable: true, configurable: true, value: 324 });
      const result = getInnerSize(div, 'height');

      expect(result).toBe(324);
    });

    it('should return clientWidth when input element is defined with a certain width', () => {
      const div = document.createElement('div');
      Object.defineProperty(div, 'clientWidth', { writable: true, configurable: true, value: 324 });
      const result = getInnerSize(div, 'width');

      expect(result).toBe(324);
    });

    it('should return null when calling getElementProp() without a valid element', () => {
      const prop = getStyleProp(null as any, 'clientWidth');

      expect(prop).toBeNull();
    });
  });

  describe('htmlDecode() method', () => {
    it('should return a decoded HTML string', () => {
      const result = htmlDecode(`&lt;div class=&quot;color: blue&quot;&gt;Bob&#39;s Boat&lt;/div&gt;`);
      expect(result).toBe(`<div class="color: blue">Bob's Boat</div>`);
    });

    it('should return a decoded HTML string with single quotes decoded as well', () => {
      const result = htmlDecode(`&lt;div class=&#39;color: blue&#39;&gt;Hablar espa&#241;ol?&lt;/div&gt;`);
      expect(result).toBe(`<div class='color: blue'>Hablar español?</div>`);
    });

    it('should return a decoded HTML map even when prefixed with invalid map like the "&" char and still decode what it can', () => {
      const result = htmlDecode(`&lt;div class=&quot;color: blue&quot;&gt;Bob &&amp; John, hablar espa&#241;ol&lt;/div&gt;`);
      expect(result).toBe(`<div class="color: blue">Bob && John, hablar español</div>`);
    });

    it('should return same HTML string when encode value is not a valid entity map', () => {
      const input = `&abc;Hello&xyz;`;
      const result = htmlDecode(input);
      expect(result).toBe(input);
    });

    it('should return empty string when input is undefined or null', () => {
      const result1 = htmlDecode(undefined);
      const result2 = htmlDecode(null as any);

      expect(result1).toBe('');
      expect(result2).toBe('');
    });

    it('should return stringified value when input is a boolean', () => {
      const result1 = htmlDecode(false as any);
      const result2 = htmlDecode(true as any);

      expect(result1).toBe('false');
      expect(result2).toBe('true');
    });

    it('should return stringified number when input is a number', () => {
      const result = htmlDecode(0 as any);
      expect(result).toBe('0');
    });
  });

  describe('htmlEncode() method', () => {
    it('should return a encoded HTML string', () => {
      const result = htmlEncode(`<div class="color: blue">Bob's Boat</div>`);
      expect(result).toBe(`&lt;div class=&quot;color: blue&quot;&gt;Bob&#39;s Boat&lt;/div&gt;`);
    });

    it('should return a encoded HTML string with single quotes encoded as well', () => {
      const result = htmlEncode(`<div class='color: blue'>Something</div>`);
      expect(result).toBe(`&lt;div class=&#39;color: blue&#39;&gt;Something&lt;/div&gt;`);
    });
  });

  describe('htmlEntityDecode() method', () => {
    it('should be able to decode HTML entity of an HTML string', () => {
      const result = htmlEntityDecode(`&#60;&#100;&#105;&#118;&#62;&#97;&#60;&#47;&#100;&#105;&#118;&#62;`);
      expect(result).toBe(`<div>a</div>`);
    });

    it('should be able to decode unicode characters and also latin accents', () => {
      const result = htmlEntityDecode(`&#83;&#97;&#109;&#39;&#115;&#32;&#55357;&#56960;&#55358;&#56708;&#32;&#101;&#115;&#112;&#97;&#241;&#111;&#108;`);
      expect(result).toBe(`Sam's 🚀🦄 español`);
    });
  });

  describe('htmlEncodeWithPadding() method', () => {
    it('should return 2 spaces HTML encoded when input is empty', () => {
      const result = htmlEncodeWithPadding('', 2);
      expect(result).toBe(`&nbsp;&nbsp;`);
    });

    it('should be able to encore HTML entity to an encoded HTML string', () => {
      const result = htmlEncodeWithPadding(`<div>some text</div>`, 2);
      expect(result).toBe(`&lt;div&gt;some text&lt;/div&gt;`);
    });
  });

  describe('insertAfterElement() method', () => {
    it('should insert span3 after span1', () => {
      const div = document.createElement('div');
      div.className = 'div-one';
      const span1 = document.createElement('span');
      span1.className = 'span-one';
      const span2 = document.createElement('span');
      span2.className = 'span-two';
      const span3 = document.createElement('span');
      span3.className = 'span-three';
      div.appendChild(span1);
      div.appendChild(span2);

      insertAfterElement(span1, span3);
      expect(div.outerHTML).toBe(`<div class="div-one"><span class="span-one"></span><span class="span-three"></span><span class="span-two"></span></div>`);
    });
  });
});
