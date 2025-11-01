import { getScrollDistanceWhenDragOutsideGrid } from '../support/drag';

function testScroll(fromClass: string, toClass: string, fromRow: number, fromCol: number) {
  return getScrollDistanceWhenDragOutsideGrid(fromClass, 'topLeft', 'right', fromRow, fromCol, 165).then((cellScrollDistance) => {
    return getScrollDistanceWhenDragOutsideGrid(toClass, 'topLeft', 'bottom', fromRow, fromCol, 165).then((rowScrollDistance) => {
      return cy.wrap({
        cell: {
          scrollBefore: cellScrollDistance.scrollLeftBefore,
          scrollAfter: cellScrollDistance.scrollLeftAfter,
        },
        row: {
          scrollBefore: rowScrollDistance.scrollTopBefore,
          scrollAfter: rowScrollDistance.scrollTopAfter,
        },
      });
    });
  });
}

describe('Example 48 - Hybrid Selection Model', () => {
  const grid1Titles = ['#', 'Title', '% Complete', 'Start', 'Finish', 'Priority', 'Effort Driven'];
  const grid2Titles = ['', '#', 'Title', '% Complete', 'Start', 'Finish', 'Priority', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example48`);
    cy.get('h2').should('contain', 'Example 48: Hybrid Selection Model');
  });

  describe('Grid 1', () => {
    it('should have exact column titles in first grid', () => {
      cy.get('#grid48-1')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => {
          if (index > 0 && index < grid1Titles.length) {
            expect($child.text()).to.eq(grid1Titles[index]);
          }
        });
    });

    it('should click on Task 1 and be able to drag from bottom right corner to expand the cell selections to include 4 cells', () => {
      cy.get('#grid48-1 .slick-row[data-row="1"] .slick-cell.l1.r1').as('task1');
      cy.get('@task1').should('contain', 'Task 1');
      cy.get('@task1').click().should('have.class', 'selected');
      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 1);

      cy.get('@task1').find('.slick-drag-replace-handle').trigger('mousedown', { which: 1, force: true });

      cy.get('#grid48-1 .slick-row[data-row="2"] .slick-cell.l2.r2')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 4);
    });

    it('should be able to expand the cell selections further to the right', () => {
      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 4);
      cy.get('#grid48-1 .slick-row[data-row="2"] .slick-cell.l2.r2')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('#grid48-1 .slick-row[data-row="2"] .slick-cell.l3.r3')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 6);
    });

    it('should be able to expand the cell selections further to the bottom', () => {
      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 6);
      cy.get('#grid48-1 .slick-row[data-row="2"] .slick-cell.l3.r3')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('#grid48-1 .slick-row[data-row="3"] .slick-cell.l3.r3')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 9);
    });

    it('should click on 1st column and then row 2 and 3, then expect the full (single) row to be selected', () => {
      cy.get('#grid48-1 .slick-row[data-row="1"] .slick-cell.l0.r0').as('task1');
      cy.get('@task1').should('contain', '1');
      cy.get('@task1').click().should('have.class', 'selected');
      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 7);

      // select another row
      cy.get('#grid48-1 .slick-row[data-row="2"] .slick-cell.l0.r0').as('task2');
      cy.get('@task2').should('contain', '2');
      cy.get('@task2').click().should('have.class', 'selected');
      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 7);
    });

    it('should be able to select 3 rows (from Task 4 to 6) when holding Shift key and clicking on the next 2 rows (again on same column index 0)', () => {
      cy.get('#grid48-1 .slick-row[data-row="4"] .slick-cell.l0.r0').as('task4');
      cy.get('@task4').should('contain', '4');
      cy.get('@task4').click().should('have.class', 'selected');

      cy.get('#grid48-1 .slick-row[data-row="6"] .slick-cell.l0.r0').click({ shiftKey: true }).should('have.class', 'selected');
      cy.get('#grid48-1 .slick-cell.selected').should('have.length', 7 * 3);
    });

    it('should auto scroll take effect to display the selecting element when dragging', { scrollBehavior: false }, () => {
      cy.get('#grid48-1 .slick-viewport-top.slick-viewport-left').scrollTo('top');

      testScroll('#grid48-2', '#grid48-1', 0, 1).then((scrollDistance) => {
        expect(scrollDistance.cell.scrollBefore).to.be.lte(scrollDistance.cell.scrollAfter);
        expect(scrollDistance.row.scrollBefore).to.be.lte(scrollDistance.row.scrollAfter);
      });

      cy.get('#selectionRange1').should('contain', '{"fromRow":0,"fromCell":1,"toRow":15,"toCell":3}');
      cy.get('#grid48-1 .slick-viewport-top.slick-viewport-left').scrollTo(0, 13 * 35);
    });
  });

  describe('Grid 2', () => {
    it('should have exact column titles in second grid', () => {
      cy.get('#grid48-2')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => {
          if (index > 0 && index < grid2Titles.length) {
            expect($child.text()).to.eq(grid2Titles[index]);
          }
        });
    });

    it('should click on Task 1 and be able to drag from bottom right corner to expand the cell selections to include 4 cells', () => {
      cy.get('#grid48-2 .slick-row[data-row="1"] .slick-cell.l2.r2').as('task1');
      cy.get('@task1').should('contain', 'Task 1');
      cy.get('@task1').click().should('have.class', 'active');

      cy.get('@task1').trigger('mousemove', 'bottomRight');
      cy.get('@task1').type('{shift}{rightArrow}', { force: true }); // hold the Shift key while dragging

      cy.get('#grid48-2 .slick-row[data-row="1"] .slick-cell.l3.r3').trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('#grid48-2 .slick-row[data-row="1"] .slick-cell.l3.r3')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('#grid48-2 .slick-row[data-row="2"] .slick-cell.l3.r3')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('#grid48-2 .slick-cell.selected').should('have.length', 4);
    });

    it('should be able to expand the cell selections further to the right', () => {
      cy.get('#grid48-2 .slick-cell.selected').should('have.length', 4);
      cy.get('#grid48-2 .slick-row[data-row="2"] .slick-cell.l3.r3')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('#grid48-2 .slick-row[data-row="2"] .slick-cell.l4.r4')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('#grid48-2 .slick-cell.selected').should('have.length', 6);
    });

    it('should be able to expand the cell selections further to the bottom', () => {
      cy.get('#grid48-2 .slick-cell.selected').should('have.length', 6);
      cy.get('#grid48-2 .slick-row[data-row="2"] .slick-cell.l4.r4')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('#grid48-2 .slick-row[data-row="3"] .slick-cell.l4.r4')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('#grid48-2 .slick-cell.selected').should('have.length', 9);
    });

    it('should click on a cell outside of the selected range and expect previous selection to remain', () => {
      cy.get('#grid48-2 .slick-row[data-row="4"] .slick-cell.l2.r2').as('task4');
      cy.get('@task4').should('contain', 'Task 4').click();
      cy.get('#grid48-2 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('#grid48-2 .slick-cell.selected').should('have.length', 9);
    });

    it('should click on row 4 and 5 row checkbox and expect 5 full rows to be selected', () => {
      cy.get('#grid48-2 .slick-row[data-row="4"] .slick-cell.l0.r0').as('task4');
      cy.get('#grid48-2 .slick-row[data-row="4"] .slick-cell.l1.r1').should('contain', '4');
      cy.get('@task4').click();
      cy.get('#grid48-2 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('#grid48-2 .slick-row[data-row="4"] .slick-cell.l0.r0').should('have.class', 'selected');
      cy.get('#grid48-2 .slick-cell.selected').should('have.length', 8 * 4);

      // select another row
      cy.get('#grid48-2 .slick-row[data-row="5"] .slick-cell.l0.r0').as('task5');
      cy.get('#grid48-2 .slick-row[data-row="5"] .slick-cell.l1.r1').should('contain', '5');
      cy.get('@task5').click();
      cy.get('#grid48-2 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('@task5').should('have.class', 'selected');
      cy.get('#grid48-2 .slick-cell.selected').should('have.length', 8 * 5);
    });
  });
});
