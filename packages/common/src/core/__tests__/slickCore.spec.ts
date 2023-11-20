import { SlickGroup, SlickGroupTotals, SlickRange } from '../slickCore';

describe('slick.core file', () => {
  describe('SlickRange class', () => {
    it('should call isSingleCell() and expect truthy when fromRow equals toRow', () => {
      const range = new SlickRange(0, 2);
      range.fromCell = 0;
      range.toCell = 0;

      expect(range.isSingleCell()).toBeTruthy();
    });

    it('should call isSingleCell() and expect falsy when fromRow does not equals toRow', () => {
      const range = new SlickRange(0, 2);
      range.fromCell = 0;
      range.toCell = 2;

      expect(range.isSingleCell()).toBeFalsy();
    });

    it('should call isSingleRow() and expect truthy when fromRow equals toRow', () => {
      const range = new SlickRange(0, 0);
      range.fromRow = 0;
      range.toRow = 0;

      expect(range.isSingleRow()).toBeTruthy();
    });

    it('should call isSingleRow() and expect falsy when fromRow does not equals toRow', () => {
      const range = new SlickRange(0, 1);
      range.fromRow = 0;
      range.toRow = 2;

      expect(range.isSingleRow()).toBeFalsy();
    });

    it('should call contains() and expect falsy when row is not found', () => {
      const range = new SlickRange(0, 1, 2, 5);

      expect(range.contains(4, 0)).toBeFalsy();
    });

    it('should call contains() and expect truthy when row is found within the range', () => {
      const range = new SlickRange(0, 1, 2, 5);

      expect(range.contains(1, 3)).toBeTruthy();
    });

    it('should call toString() and expect a readable stringified result for a single cell range', () => {
      const range = new SlickRange(0, 1, 0, 1);

      expect(range.toString()).toBe('(0:1)');
    });

    it('should call toString() and expect a readable stringified result for a range including multiple cells', () => {
      const range = new SlickRange(0, 1, 2, 5);

      expect(range.toString()).toBe('(0:1 - 2:5)');
    });
  });

  describe('SlickGroup class', () => {
    it('should call equals() and return truthy when groups are equal', () => {
      const group = new SlickGroup();
      group.value = '123';
      group.count = 2;
      group.collapsed = false;
      group.level = 0;
      group.title = 'my title';
      const group2 = { ...group } as SlickGroup;

      expect(group.equals(group2)).toBeTruthy();
    });

    it('should call equals() and return false when groups have differences', () => {
      const group = new SlickGroup();
      group.value = '123';
      group.count = 2;
      group.collapsed = false;
      group.level = 0;
      group.title = 'my title';

      const group2 = { ...group } as SlickGroup;
      group2.title = 'another title';
      group.value = '222';

      expect(group.equals(group2)).toBeFalsy();
    });
  });

  describe('SlickGroupTotals class', () => {
    it('should be able to create a SlickGroupTotals and assign a SlickGroup', () => {
      const group = new SlickGroup();
      group.value = '123';
      group.count = 2;
      group.collapsed = false;
      group.level = 0;
      group.title = 'my title';

      const groupTotals = new SlickGroupTotals();
      groupTotals.group = group;
      group.totals = groupTotals;

      expect(groupTotals).toBeTruthy();
      expect(groupTotals.__nonDataRow).toBeTruthy();
      expect(groupTotals.__groupTotals).toBeTruthy();
      expect(groupTotals.initialized).toBeFalsy();

      groupTotals.initialized = true;
      expect(groupTotals.initialized).toBeTruthy();
    });
  })
});