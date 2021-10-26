import {
  calculateAvailableSpace,
  findFirstElementAttribute,
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
});