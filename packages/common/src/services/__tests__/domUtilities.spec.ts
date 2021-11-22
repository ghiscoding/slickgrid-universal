import 'jest-extended';
import { GridOption } from '../../interfaces';
import {
  calculateAvailableSpace,
  emptyElement,
  findFirstElementAttribute,
  getElementOffsetRelativeToParent,
  getHtmlElementOffset,
  htmlEncode,
  htmlEntityDecode,
  sanitizeHtmlToText,
  sanitizeTextByAvailableSanitizer,
} from '../domUtilities';

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

    it('should calculate space ', () => {
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

  describe('findFirstElementAttribute method', () => {
    const div = document.createElement('div');
    div.innerHTML = `<ul><li>Item 1</li><li custom-title="custom text" title="some tooltip text">Item 2</li></ul>`;
    document.body.appendChild(div);

    it('should return [title] attribute when other attribute is not defined', () => {
      const output = findFirstElementAttribute(div.querySelectorAll('li')[1], ['not-exist', 'title']);
      expect(output).toBe('some tooltip text');
    });

    it('should return [custom-title] attribute when both attributes are defined but custom-title is first found', () => {
      const output = findFirstElementAttribute(div.querySelectorAll('li')[1], ['custom-title', 'title']);
      expect(output).toBe('custom text');
    });

    it('should return null when no attributes found', () => {
      const output = findFirstElementAttribute(div.querySelectorAll('li')[1], ['not-exist', 'another']);
      expect(output).toBe(null);
    });
  });

  describe('getElementOffsetRelativeToParent method', () => {
    const parentDiv = document.createElement('div');
    const childDiv = document.createElement('div');
    parentDiv.innerHTML = `<span></span>`;
    document.body.appendChild(parentDiv);

    it('should return undefined when element if not a valid html element', () => {
      const output = getElementOffsetRelativeToParent(null, null);
      expect(output).toEqual(undefined);
    });

    it('should return top/left 0 when creating a new element in the document without positions', () => {
      const output = getElementOffsetRelativeToParent(parentDiv, childDiv);
      expect(output).toEqual({ top: 0, left: 0, bottom: 0, right: 0 });
    });

    it('should return same top/left positions as defined in the document/window', () => {
      jest.spyOn(parentDiv, 'getBoundingClientRect').mockReturnValue({ top: 20, bottom: 33, left: 25, right: 44 } as any);
      jest.spyOn(childDiv, 'getBoundingClientRect').mockReturnValue({ top: 130, bottom: 70, left: 250, right: 66 } as any);
      parentDiv.style.top = '10px';
      parentDiv.style.left = '25px';

      const output = getElementOffsetRelativeToParent(parentDiv, childDiv);
      expect(output).toEqual({ top: 110, left: 225, bottom: 37, right: 22 });
    });
  });

  describe('getHtmlElementOffset method', () => {
    const div = document.createElement('div');
    div.innerHTML = `<span></span>`;
    document.body.appendChild(div);

    it('should return undefined when element if not a valid html element', () => {
      const output = getHtmlElementOffset(null);
      expect(output).toEqual(undefined);
    });

    it('should return top/left 0 when creating a new element in the document without positions', () => {
      const output = getHtmlElementOffset(div);
      expect(output).toEqual({ top: 0, left: 0, bottom: 0, right: 0 });
    });

    it('should return same top/left positions as defined in the document/window', () => {
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 25 } as any);
      div.style.top = '10px';
      div.style.left = '25px';

      const output = getHtmlElementOffset(div);
      expect(output).toEqual({ top: 10, left: 25 });
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

  describe('sanitizeHtmlToText method', () => {
    it('should return original value when input does not include any HTML tags', () => {
      const input = 'foo bar';
      const output = sanitizeHtmlToText(input);
      expect(output).toBe('foo bar');
    });

    it('should return a string with only the HTML text content without any HTML tags', () => {
      const input = '<div class="color: blue">Something</div>';
      const output = sanitizeHtmlToText(input);
      expect(output).toBe('Something');
    });

    it('should return the script content without javascript script tags when a script is provided', () => {
      const input = '<script>alert("Hello World")</script>';
      const output = sanitizeHtmlToText(input);
      expect(output).toBe('alert("Hello World")');
    });
  });

  describe('sanitizeTextByAvailableSanitizer method', () => {
    describe('use default DOMPurify sanitizer when no sanitizer exist', () => {
      const gridOptions = {} as GridOption;

      it('should return original value when input does not include any HTML tags', () => {
        const input = 'foo bar';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('foo bar');
      });

      it('should return original value when input does not include any bad HTML tags', () => {
        const input = '<div class="color: blue">Something</div>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('<div class="color: blue">Something</div>');
      });

      it('should return empty string when some javascript script tags are included', () => {
        const input = '<script>alert("Hello World")</script>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('');
      });

      it('should return an empty <a> link tag when "javascript:" is part of the dirty html', () => {
        const input = '<a href="javascript:alert(\"Hello World\")"></a>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('<a></a>');
      });
    });

    describe('use custom sanitizer when provided in the grid options', () => {
      const gridOptions = {
        sanitizer: (dirtyHtml) => (dirtyHtml.replace(/(\b)(on\S+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script([<>]*)/gi, '')),
      } as GridOption;

      it('should return original value when input does not include any HTML tags', () => {
        const input = 'foo bar';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('foo bar');
      });

      it('should return original value when input does not include any bad HTML tags', () => {
        const input = '<div class="color: blue">Something</div>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('<div class="color: blue">Something</div>');
      });

      it('should return empty string when some javascript script tags are included', () => {
        const input = '<script>alert("Hello World")</script>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('');
      });

      it('should return text without the word "javascript:" when that is part of the dirty html', () => {
        const input = 'javascript:alert("Hello World")';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('');
      });

      it('should return an empty <a> link tag when "javascript:" is part of the dirty html', () => {
        const input = '<a href="javascript:alert(\"Hello World\")"></a>';
        const output = sanitizeTextByAvailableSanitizer(gridOptions, input);
        expect(output).toBe('<a href="></a>');
      });
    });
  });
});
