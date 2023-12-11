import 'jest-extended';

import {
  calculateAvailableSpace,
  createDomElement,
  emptyElement,
  findFirstAttribute,
  getHTMLFromFragment,
  getOffsetRelativeToParent,
  getStyleProp,
  getOffset,
  getInnerSize,
  htmlEncode,
  htmlEntityDecode,
} from '../domUtils';

describe('Service/domUtilies', () => {
  describe('calculateAvailableSpace method', () => {
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
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 25 } as any);
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

  describe('createDomElement method', () => {
    it('should create a DOM element via the method to equal a regular DOM element', () => {
      const div = document.createElement('div');
      div.className = 'red bold';
      const cdiv = createDomElement('div', { className: 'red bold' });

      expect(cdiv).toEqual(div);
      expect(cdiv.outerHTML).toEqual(div.outerHTML);
    });

    it('should display a warning when trying to use innerHTML via the method', () => {
      const consoleWarnSpy = jest.spyOn(global.console, 'warn').mockReturnValue();
      createDomElement('div', { className: 'red bold', innerHTML: '<input />' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(`[Slickgrid-Universal] For better CSP (Content Security Policy) support, do not use "innerHTML" directly in "createDomElement('div', { innerHTML: 'some html'})"`));
    });
  });

  describe('emptyElement method', () => {
    const div = document.createElement('div');
    div.innerHTML = `<ul><li>Item 1</li><li>Item 2</li></ul>`;
    document.body.appendChild(div);

    it('should empty the DOM element', () => {
      expect(div.outerHTML).toBe('<div><ul><li>Item 1</li><li>Item 2</li></ul></div>');
      emptyElement(div);
      expect(div.outerHTML).toBe('<div></div>');
    });
  });

  describe('findFirstAttribute method', () => {
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

  describe('getHTMLFromFragment() method', () => {
    it('should return innerHTML from fragment', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'some text';
      const fragment = new DocumentFragment();
      div.appendChild(span);
      fragment.appendChild(div);

      const result = getHTMLFromFragment(fragment);

      expect(result).toBe('<span>some text</span>');
    });

    it('should return outerHTML from fragment', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'some text';
      const fragment = new DocumentFragment();
      div.appendChild(span);
      fragment.appendChild(div);

      const result = getHTMLFromFragment(fragment, 'outerHTML');

      expect(result).toBe('<div><span>some text</span></div>');
    });

    it('should return same input when it is not an instance of DocumentFragment', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'some text';
      div.appendChild(span);

      expect(getHTMLFromFragment(div as any)).toEqual(div);
    });
  });

  describe('getElementOffsetRelativeToParent method', () => {
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
      jest.spyOn(parentDiv, 'getBoundingClientRect').mockReturnValue({ top: 20, bottom: 33, left: 25, right: 44 } as any);
      jest.spyOn(childDiv, 'getBoundingClientRect').mockReturnValue({ top: 130, bottom: 70, left: 250, right: 66 } as any);
      parentDiv.style.top = '10px';
      parentDiv.style.left = '25px';

      const output = getOffsetRelativeToParent(parentDiv, childDiv);
      expect(output).toEqual({ top: 110, left: 225, bottom: 37, right: 22 });
    });
  });

  describe('getOffset method', () => {
    const div = document.createElement('div');
    div.innerHTML = `<span></span>`;
    document.body.appendChild(div);

    it('should return undefined when element if not a valid html element', () => {
      const output = getOffset(null as any);
      expect(output).toEqual(undefined);
    });

    it('should return top/left 0 when creating a new element in the document without positions', () => {
      const output = getOffset(div);
      expect(output).toEqual({ top: 0, left: 0, bottom: 0, right: 0 });
    });

    it('should return same top/left positions as defined in the document/window', () => {
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 25 } as any);
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

  describe('htmlEncode method', () => {
    it('should return a encoded HTML string', () => {
      const result = htmlEncode(`<div class="color: blue">Something</div>`);
      expect(result).toBe(`&lt;div class=&quot;color: blue&quot;&gt;Something&lt;/div&gt;`);
    });

    it('should return a encoded HTML string with single quotes encoded as well', () => {
      const result = htmlEncode(`<div class='color: blue'>Something</div>`);
      expect(result).toBe(`&lt;div class=&#39;color: blue&#39;&gt;Something&lt;/div&gt;`);
    });
  });

  describe('htmlEntityDecode method', () => {
    it('should be able to decode HTML entity of an HTML string', () => {
      const result = htmlEntityDecode(`&#60;&#100;&#105;&#118;&#62;&#97;&#60;&#47;&#100;&#105;&#118;&#62;`);
      expect(result).toBe(`<div>a</div>`);
    });

    it('should be able to decode unicode characters and also latin accents', () => {
      const result = htmlEntityDecode(`&#83;&#97;&#109;&#39;&#115;&#32;&#55357;&#56960;&#55358;&#56708;&#32;&#101;&#115;&#112;&#97;&#241;&#111;&#108;`);
      expect(result).toBe(`Sam's 🚀🦄 español`);
    });
  });
});
