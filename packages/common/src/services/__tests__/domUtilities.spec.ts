import 'jest-extended';
import {
  getElementOffsetRelativeToParent,
  getHtmlElementOffset,
  windowScrollPosition,
} from '../Domutilities';

describe('Service/Utilies', () => {
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
});
