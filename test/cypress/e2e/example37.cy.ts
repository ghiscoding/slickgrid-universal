import { getScrollDistanceWhenDragOutsideGrid } from '../support/drag';

function testScroll(fromClass: string, toClass: string, fromRow: number, fromCol: number) {
  return getScrollDistanceWhenDragOutsideGrid(fromClass, 'topLeft', 'right', fromRow, fromCol, 165).then((cellScrollDistance: any) => {
    return getScrollDistanceWhenDragOutsideGrid(toClass, 'topLeft', 'bottom', fromRow, fromCol, 165).then((rowScrollDistance: any) => {
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

describe('Example 37 - Hybrid Selection Model', () => {
  const grid1Titles = ['#', 'Title', '% Complete', 'Start', 'Finish', 'Priority', 'Effort Driven'];
  const grid2Titles = ['', '#', 'Title', '% Complete', 'Start', 'Finish', 'Priority', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example37`);
    cy.get('h3').should('contain', 'Example 37 - Hybrid Selection Model');
  });

  describe('Grid 1', () => {
    it('should have exact column titles in first grid', () => {
      cy.get('.grid37-1')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => {
          if (index > 0 && index < grid1Titles.length) {
            expect($child.text()).to.eq(grid1Titles[index]);
          }
        });
    });

    it('should export Grid 1 to Excel without hidden columns and keep expected data shapes', () => {
      const downloadsFolder = Cypress.config('downloadsFolder');

      cy.get('[data-test="export-excel-btn"]').click();

      cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 11 }).then((xlsx: any) => {
        expect(xlsx.fileName).to.match(/\.xlsx$/i);

        const normalizedHeader = xlsx.header.map((columnName: string) =>
          `${columnName}`
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
        );

        expect(normalizedHeader).to.deep.equal(['#', 'title', '% complete', 'start', 'finish', 'priority', 'effort driven']);
        expect(normalizedHeader).to.have.length(7);
        expect(normalizedHeader).to.not.include('last column / hidden column');
        expect(xlsx.rowCount - 1).to.equal(400);

        expect(xlsx.dataRows).to.be.an('array');
        expect(xlsx.dataRows.length).to.equal(11);

        xlsx.dataRows.forEach((row: string[], index: number) => {
          expect(row[0]).to.equal(`${index}`);
          expect(row[1]).to.equal(`Task ${index}`);
          expect(Number(row[2])).to.be.within(0, 99);
          expect(row[3]).to.match(/^\d{2}\/\d{2}\/\d{4}$/);
          expect(row[4]).to.match(/^\d{2}\/\d{2}\/\d{4}$/);
          expect(row[5]).to.match(/^(Low|Medium|High)$/);
          expect(row[6]).to.match(/^(Yes|No)$/);
        });
      });
    });

    it('should allow Ctrl-drag from Task 1 to expand the cell selections to include 4 cells', () => {
      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l1.r1').as('task1');
      cy.get('@task1').should('contain', 'Task 1');
      cy.get('@task1').click().should('have.class', 'selected');
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 1);

      cy.get('@task1').find('.slick-drag-replace-handle').trigger('mousedown', { which: 1, ctrlKey: true, force: true });

      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l2.r2')
        .trigger('mousemove', 'bottomRight', { ctrlKey: true, force: true })
        .trigger('mouseup', 'bottomRight', { which: 1, ctrlKey: true, force: true });

      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 4);
    });

    it('should preserve cell selection when dragging with the secondary mouse button', () => {
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 4);

      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l1.r1').trigger('mousedown', {
        button: 2,
        which: 3,
        force: true,
      });
      cy.get('.grid37-1 .slick-row[data-row="3"] .slick-cell.l3.r3')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { button: 2, which: 3, force: true });

      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 4);
    });

    it('should be able to expand the cell selections further to the right', () => {
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 4);
      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l2.r2')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l3.r3')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 6);
    });

    it('should be able to expand the cell selections further to the bottom', () => {
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 6);
      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l3.r3')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('.grid37-1 .slick-row[data-row="3"] .slick-cell.l3.r3')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 9);
    });

    it('should be able to shrink the cell selections back to the top and to the left', () => {
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 9);
      cy.get('.grid37-1 .slick-row[data-row="3"] .slick-cell.l3.r3')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l3.r3')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 6);

      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l3.r3')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l2.r2')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 4);
    });

    it('should expand the cell selections upward when dragging the handle above the selection top row', () => {
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 4);
      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l2.r2')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });

      cy.get('.grid37-1 .slick-row[data-row="0"] .slick-cell.l2.r2')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 6);
    });

    it('should click on 1st column and then row 2 and 3, then expect the full (single) row to be selected', () => {
      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l0.r0').as('task1');
      cy.get('@task1').should('contain', '1');
      cy.get('@task1').click().should('have.class', 'selected');
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 7);

      // select another row
      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l0.r0').as('task2');
      cy.get('@task2').should('contain', '2');
      cy.get('@task2').click().should('have.class', 'selected');
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 7);
    });

    it('should be able to select 3 rows (from Task 4 to 6) when holding Shift key and clicking on the next 2 rows (again on same column index 0)', () => {
      cy.get('.grid37-1 .slick-row[data-row="4"] .slick-cell.l0.r0').as('task4');
      cy.get('@task4').should('contain', '4');
      cy.get('@task4').click().should('have.class', 'selected');

      cy.get('.grid37-1 .slick-row[data-row="6"] .slick-cell.l0.r0').click({ shiftKey: true }).should('have.class', 'selected');
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 7 * 3);
    });

    it('should auto scroll take effect to display the selecting element when dragging', { scrollBehavior: false }, () => {
      cy.get('.grid37-1 .slick-viewport-top.slick-viewport-left').scrollTo('top');

      testScroll('.grid37-1', '.grid37-1', 0, 1).then((scrollDistance: any) => {
        expect(scrollDistance.cell.scrollBefore).to.be.lte(scrollDistance.cell.scrollAfter);
        expect(scrollDistance.row.scrollBefore).to.be.lte(scrollDistance.row.scrollAfter);
      });

      cy.get('#selectionRange1').contains(/"fromRow":0,"fromCell":1,"toRow":1[45],"toCell":3/);
      cy.get('.grid37-1 .slick-viewport-top.slick-viewport-left').scrollTo(0, 13 * 35);
    });

    it('should show "Command which should be shown" in context menu even when last column definition is hidden', () => {
      cy.get('.grid37-1 .slick-row[data-row="14"] .slick-cell.l1.r1').as('task14');
      cy.get('@task14').should('contain', 'Task 14');
      cy.get('@task14').rightclick({ force: true });
      cy.get('.slick-context-menu .slick-menu-item').should('contain', 'Command which should be shown');
      cy.get('body').type('{esc}');
    });

    it('should toggle multiple cell selection ranges with the checkbox', () => {
      cy.get('.grid37-1 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('[data-test="enable-multi-selection"]').check();

      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l1.r1').click();
      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l1.r1')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });
      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l2.r2')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });
      cy.get('.grid37-1 .slick-row[data-row="3"] .slick-cell.l1.r1').click({ ctrlKey: true });
      cy.get('.grid37-1 .slick-row[data-row="3"] .slick-cell.l1.r1')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });
      cy.get('.grid37-1 .slick-row[data-row="4"] .slick-cell.l1.r1')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });
      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 4);
      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.selected').should('have.length', 0);
      cy.get('#selectionRange1').contains(/"fromRow":1,"fromCell":1,"toRow":1,"toCell":2/);
      cy.get('#selectionRange1').contains(/"fromRow":3,"fromCell":1,"toRow":4,"toCell":1/);
      cy.get('#selectionRange1')
        .invoke('text')
        .then((text) => expect(text.match(/"fromRow"/g)).to.have.length(2));
      cy.get('[data-test="enable-multi-selection"]').should('be.checked');
    });

    it('should select a rectangular cell range when Shift-clicking another cell', () => {
      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l1.r1').click();
      cy.get('.grid37-1 .slick-row[data-row="3"] .slick-cell.l3.r3').click({ shiftKey: true });

      cy.get('.grid37-1 .slick-cell.selected').should('have.length', 9);
      cy.get('#selectionRange1').should('have.text', '{"fromRow":1,"fromCell":1,"toRow":3,"toCell":3}');
    });

    it('should preserve row and column offsets when copying multiple cell ranges', () => {
      cy.get('.grid37-1 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('[data-test="enable-multi-selection"]').should('be.checked');
      cy.window().then((win) => {
        cy.stub(win.navigator.clipboard, 'writeText').as('clipboardWriteText');
      });

      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l1.r1').click();
      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l1.r1')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });
      cy.get('.grid37-1 .slick-row[data-row="3"] .slick-cell.l1.r1')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l5.r5').click({ ctrlKey: true });
      cy.get('.grid37-1 .slick-row[data-row="2"] .slick-cell.l5.r5')
        .find('.slick-drag-replace-handle')
        .trigger('mousedown', { which: 1, force: true });
      cy.get('.grid37-1 .slick-row[data-row="3"] .slick-cell.l5.r5')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      cy.get('#selectionRange1').contains(/"fromRow":1,"fromCell":1,"toRow":3,"toCell":1/);
      cy.get('#selectionRange1').contains(/"fromRow":2,"fromCell":5,"toRow":3,"toCell":5/);
      cy.get('.grid37-1 .grid-canvas').first().trigger('keydown', { key: 'c', ctrlKey: true, bubbles: true, force: true });

      cy.get('@clipboardWriteText').should('have.been.calledWith', 'Task 1\t\t\t\t\r\nTask 2\t\t\t\t2\r\nTask 3\t\t\t\t3\r\n');
    });

    it('should select the active cell when cell selection disables active-row selection', () => {
      cy.window()
        .its('main.app.viewModelObj', { timeout: 10000 })
        .should((viewModelObj: Record<string, any>) => {
          expect(
            Object.values(viewModelObj).some((viewModel) => viewModel?.sgb1?.slickGrid),
            'Grid 1 view model'
          ).to.be.true;
        })
        .then((viewModelObj: Record<string, any>) => {
          const viewModel = Object.values(viewModelObj).find((candidate) => candidate?.sgb1?.slickGrid);
          const selectionModel = viewModel.sgb1.slickGrid.getSelectionModel();
          selectionModel.setOptions({ selectActiveCell: true, selectActiveRow: false, selectionType: 'cell' });
          selectionModel.setSelectedRanges([]);
        });

      cy.get('.grid37-1 .slick-row[data-row="1"] .slick-cell.l1.r1').click();
      cy.get('#selectionRange1').should('have.text', '{"fromRow":1,"fromCell":1,"toRow":1,"toCell":1}');
    });
  });

  describe('Grid 2', () => {
    it('should have exact column titles in second grid', () => {
      cy.get('.grid37-2')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => {
          if (index > 0 && index < grid2Titles.length) {
            expect($child.text()).to.eq(grid2Titles[index]);
          }
        });
    });

    it('should click on Task 1 and be able to drag from bottom right corner to expand the cell selections to include 4 cells', () => {
      cy.get('.grid37-2 .slick-row[data-row="1"] .slick-cell.l2.r2').as('task1');
      cy.get('@task1').should('contain', 'Task 1');
      cy.get('@task1').click().should('have.class', 'active');

      cy.get('@task1').trigger('mousemove', 'bottomRight');
      cy.get('@task1').type('{shift}{rightArrow}', { force: true }); // hold the Shift key while dragging

      cy.get('.grid37-2 .slick-row[data-row="1"] .slick-cell.l3.r3').trigger('mouseup', 'bottomRight', { which: 1, force: true });

      testScroll('.grid37-2', '.grid37-2', 0, 1).then((scrollDistance: any) => {
        expect(scrollDistance.cell.scrollBefore).to.be.lte(scrollDistance.cell.scrollAfter);
        expect(scrollDistance.row.scrollBefore).to.be.lte(scrollDistance.row.scrollAfter);
      });

      cy.get('#selectionRange2').contains(/"fromRow":0,"fromCell":0,"toRow":1[0-9],"toCell":7/);
      cy.get('.grid37-2 .slick-viewport-top.slick-viewport-left').scrollTo(0, 12 * 35);
    });

    it('should click on a cell outside of the selected range and expect previous selection to remain', () => {
      cy.get('.grid37-2 .slick-row[data-row="16"] .slick-cell.l2.r2').as('task1x');
      cy.get('@task1x')
        .contains(/Task 1[0-9]/)
        .click();
      cy.get('.grid37-2 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('.grid37-2 .slick-cell.selected').should('have.length.gte', 60);
      cy.get('#selectionRange2').contains(/"fromRow":0,"fromCell":0,"toRow":1[0-9],"toCell":7/);
    });

    it('should clear Select All checkboxes', () => {
      cy.get('.grid37-2 .header-checkbox-selectall').click().click();
    });

    it('should click on row 4 and 5 row checkbox and expect 5 full rows to be selected', () => {
      cy.get('.grid37-2 .slick-row[data-row="4"] .slick-cell.l1.r1').should('contain', '4');
      cy.get('.grid37-2 .slick-row[data-row="4"] input[type=checkbox]').click({ force: true });
      cy.get('.grid37-2 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('.grid37-2 .slick-row[data-row="4"] .slick-cell.l0.r0').should('have.class', 'selected');
      cy.get('.grid37-2 .slick-cell.selected').should('have.length', 8 * 1);

      // select another row
      cy.get('.grid37-2 .slick-row[data-row="5"] .slick-cell.l1.r1').should('contain', '5');
      cy.get('.grid37-2 .slick-row[data-row="5"] input[type=checkbox]').click({ force: true });
      cy.get('.grid37-2 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('.grid37-2 .slick-row[data-row="5"] .slick-cell.l0.r0').should('have.class', 'selected');
      cy.get('.grid37-2 .slick-cell.selected').should('have.length', 8 * 2);
    });

    it('should toggle multiple row selection ranges with the checkbox', () => {
      cy.get('.grid37-2 .slick-viewport-top.slick-viewport-left').scrollTo('top');
      cy.get('.grid37-2 .slick-row[data-row="4"] input[type=checkbox]').uncheck({ force: true });
      cy.get('.grid37-2 .slick-row[data-row="5"] input[type=checkbox]').uncheck({ force: true });
      cy.get('[data-test="enable-multi-selection"]').should('be.checked');

      cy.get('.grid37-2 .slick-row[data-row="1"] input[type=checkbox]').check({ force: true });
      cy.get('.grid37-2 .slick-row[data-row="2"] input[type=checkbox]').check({ force: true });
      cy.get('.grid37-2 .slick-row[data-row="4"] .slick-cell.l1.r1').click({ ctrlKey: true });
      cy.get('#selectionRange2')
        .invoke('text')
        .then((text) => expect(text.match(/"fromRow"/g)).to.have.length(3));
      cy.get('.grid37-2 .slick-cell.selected').should('have.length', 8 * 3);
      cy.get('.grid37-2 .slick-row[data-row="3"] .slick-cell.selected').should('have.length', 0);
      cy.get('#selectionRange2').contains(/"fromRow":1,"fromCell":0,"toRow":1,"toCell":7/);
      cy.get('#selectionRange2').contains(/"fromRow":2,"fromCell":0,"toRow":2,"toCell":7/);
      cy.get('#selectionRange2').contains(/"fromRow":4,"fromCell":0,"toRow":4,"toCell":7/);
    });

    it('should preserve row ranges when enabling multi-selection and show the live modifier-drag preview', () => {
      const gridSelector = '.grid37-2';
      const firstRange = '{"fromRow":0,"fromCell":0,"toRow":1,"toCell":7}';
      const secondRange = '{"fromRow":3,"fromCell":0,"toRow":4,"toCell":7}';
      const combinedRanges = `${firstRange}${secondRange}`;

      cy.get(`${gridSelector} .slick-viewport-top.slick-viewport-left`).scrollTo('top');
      cy.get(`${gridSelector} .slick-row[data-row="1"] input[type=checkbox]`).uncheck({ force: true });
      cy.get(`${gridSelector} .slick-row[data-row="2"] input[type=checkbox]`).uncheck({ force: true });
      cy.get(`${gridSelector} .slick-row[data-row="4"] input[type=checkbox]`).uncheck({ force: true });
      cy.get('[data-test="enable-multi-selection"]').uncheck();

      const firstRowCell = `${gridSelector} .slick-row[data-row="0"] .slick-cell.l1.r1`;
      cy.get(firstRowCell).dragStart();
      cy.get(firstRowCell).dragCell(1, 0);
      cy.dragEnd(gridSelector);
      cy.get('#selectionRange2').should('have.text', firstRange);

      cy.get('[data-test="enable-multi-selection"]').check();
      cy.get('#selectionRange2').should('have.text', firstRange);

      const secondRowCell = `${gridSelector} .slick-row[data-row="3"] .slick-cell.l1.r1`;
      cy.get(secondRowCell).trigger('mousedown', { which: 1, ctrlKey: true, force: true });
      cy.get(secondRowCell).trigger('mousemove', 30, 10, { ctrlKey: true, force: true });
      cy.get(secondRowCell).trigger('mousemove', 30, 52, { ctrlKey: true, force: true });

      cy.get('#selectionRange2').should('have.text', combinedRanges);
      cy.get(`${gridSelector} .slick-cell.selected`).should('have.length', 8 * 4);
      cy.get(`${gridSelector} .slick-row[data-row="2"] .slick-cell.selected`).should('have.length', 0);

      cy.dragEnd(gridSelector);
      cy.get('#selectionRange2').should('have.text', combinedRanges);
    });
  });
});
