// eslint-disable-next-line n/file-extension-in-import
import { getScrollDistanceWhenDragOutsideGrid } from '../support/drag';

describe('Example 17 - Auto-Scroll with Range Selector', () => {
  // NOTE:  everywhere there's a * 2 is because we have a top+bottom (frozen rows) containers even after Unfreeze Columns/Rows
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 35;
  const SCROLLBAR_DIMENSION = 17;
  const fullTitles = ['#', 'Title', 'Duration', '% Complete', 'Start', 'Finish', 'Cost', 'Effort Driven'];
  for (let i = 0; i < 30; i++) {
    fullTitles.push(`Mock${i}`);
  }

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example17`);
    cy.get('h3').should('contain', 'Example 17 - Auto-Scroll with Range Selector');
    cy.get('h3 span.subtitle').should('contain', '(with Salesforce Theme)');
  });

  it('should have exact column titles on both grids', () => {
    cy.get('.grid17-1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));

    cy.get('.grid17-1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should select border shown in cell selection model, and hidden in row selection model when dragging', { scrollBehavior: false }, () => {
    cy.getNthCell(0, 1, '', { parentSelector: '.grid17-1', rowHeight: CELL_HEIGHT })
      .as('cell1')
      .dragStart();
    cy.get('.grid17-1 .slick-range-decorator').should('be.exist').and('have.css', 'border-color').and('not.equal', 'none');
    cy.get('@cell1')
      .dragCell(0, 5)
      .dragEnd('.grid17-1');
    cy.get('.grid17-1 .slick-range-decorator').should('not.be.exist');
    cy.get('.grid17-1 .slick-cell.selected').should('have.length', 6);

    cy.getNthCell(0, 1, '', { parentSelector: '.grid17-2', rowHeight: CELL_HEIGHT })
      .as('cell2')
      .dragStart();
    cy.get('.grid17-2 .slick-range-decorator').should('be.exist').and('have.css', 'border-style').and('equal', 'none');
    cy.get('@cell2')
      .dragCell(5, 1)
      .dragEnd('.grid17-2');
    cy.get('.grid17-2 .slick-range-decorator').should('not.be.exist');
    cy.get('.grid17-2 .slick-row:nth-child(-n+6)')
      .children(':not(.cell-unselectable)')
      .each(($child) => expect($child.attr('class')).to.include('selected'));
  });

  function testScroll() {
    return getScrollDistanceWhenDragOutsideGrid('.grid17-1', 'topLeft', 'right', 0, 1).then(cellScrollDistance => {
      return getScrollDistanceWhenDragOutsideGrid('.grid17-2', 'topLeft', 'bottom', 0, 1).then(rowScrollDistance => {
        return cy.wrap({
          cell: {
            scrollBefore: cellScrollDistance.scrollLeftBefore,
            scrollAfter: cellScrollDistance.scrollLeftAfter
          },
          row: {
            scrollBefore: rowScrollDistance.scrollTopBefore,
            scrollAfter: rowScrollDistance.scrollTopAfter
          }
        });
      });
    });
  }

  it('should auto scroll take effect to display the selecting element when dragging', { scrollBehavior: false }, () => {
    testScroll().then(scrollDistance => {
      expect(scrollDistance.cell.scrollBefore).to.be.lessThan(scrollDistance.cell.scrollAfter);
      expect(scrollDistance.row.scrollBefore).to.be.lessThan(scrollDistance.row.scrollAfter);
    });

    cy.get('[data-test="is-autoscroll-chk"]').uncheck();
    cy.get('[data-test="set-options-btn"]').click();

    testScroll().then(scrollDistance => {
      expect(scrollDistance.cell.scrollBefore).to.be.equal(scrollDistance.cell.scrollAfter);
      expect(scrollDistance.row.scrollBefore).to.be.equal(scrollDistance.row.scrollAfter);
    });

    cy.get('[data-test="default-options-btn"]').click();
    cy.get('[data-test="is-autoscroll-chk"]').should('have.value', 'on');
  });

  function getIntervalUntilRow12Displayed(selector, px, rowNumber = 12) {
    const viewportSelector = (`${selector} .slick-viewport:first`);
    cy.getNthCell(0, 1, '', { parentSelector: selector, rowHeight: CELL_HEIGHT })
      .dragStart();

    return cy.get(viewportSelector).invoke('scrollTop').then(scrollBefore => {
      cy.dragOutside('bottom', 0, px, { parentSelector: selector });

      const start = performance.now();
      cy.get(`${selector} .slick-row:not(.slick-group) >.cell-unselectable`)
        .contains(`${rowNumber}`, { timeout: 10000 }) // actually #8 will be selected
        .should('not.be.hidden');

      return cy.get(viewportSelector).invoke('scrollTop').then(scrollAfter => {
        cy.dragEnd(selector);
        const interval = performance.now() - start;
        expect(scrollBefore).to.be.lte(scrollAfter as number);
        cy.get(viewportSelector).scrollTo(0, 0, { ensureScrollable: false });
        return cy.wrap(interval);
      });
    });
  }

  function testInterval(px: number, rowNumber?: number) {
    return getIntervalUntilRow12Displayed('.grid17-1', px, rowNumber).then(intervalCell => {
      return getIntervalUntilRow12Displayed('.grid17-2', px, rowNumber).then(intervalRow => {
        return cy.wrap({
          cell: intervalCell,
          row: intervalRow
        });
      });
    });
  }

  it('should MIN interval take effect when auto scroll: 30ms -> 90ms', { scrollBehavior: false }, () => {
    // cy.get('[data-test="min-interval-input"]').type('{selectall}90'); // 30ms -> 90ms
    // By default the MIN interval to show next cell is 30ms.
    testInterval(CELL_HEIGHT * 10).then(defaultInterval => {

      // Setting the interval to 90ms (3 times of the default).
      cy.get('[data-test="min-interval-input"]').type('{selectall}90'); // 30ms -> 90ms
      cy.get('[data-test="set-options-btn"]').click();

      // Ideally if we scrolling to same row by MIN interval, the used time should be 3 times slower than default.
      // Considering the threshold, 1.2 times slower than default is expected
      testInterval(CELL_HEIGHT * 10).then(newInterval => {

        // max scrolling speed is slower than before
        expect(newInterval.cell).to.be.greaterThan(0.9 * defaultInterval.cell);
        expect(newInterval.row).to.be.greaterThan(0.9 * defaultInterval.row);

        cy.get('[data-test="default-options-btn"]').click();
        cy.get('[data-test="min-interval-input"]').should('have.value', '30');
      });
    });
  });

  /* this test is very flaky, let's skip it since it doesn't bring much value anyway */
  it.skip('should MAX interval take effect when auto scroll: 600ms -> 200ms', { scrollBehavior: false }, () => {
    // By default the MAX interval to show next cell is 600ms.
    testInterval(0, 9).then(defaultInterval => {

      // Setting the interval to 200ms (1/3 of the default).
      cy.get('[data-test="max-interval-input"]').type('{selectall}200'); // 600ms -> 200ms
      cy.get('[data-test="set-options-btn"]').click();

      // Ideally if we scrolling to same row by MAX interval, the used time should be 3 times faster than default.
      // Considering the threshold, 1.5 times faster than default is expected
      testInterval(0, 9).then(newInterval => {

        // min scrolling speed is quicker than before
        expect(0.8 * newInterval.cell).to.be.lessThan(defaultInterval.cell);
        expect(0.8 * newInterval.row).to.be.lessThan(defaultInterval.row);

        cy.get('[data-test="default-options-btn"]').click();
        cy.get('[data-test="max-interval-input"]').should('have.value', '600');
      });
    });
  });

  it('should Delay per Px take effect when auto scroll: 5ms/px -> 50ms/px', { scrollBehavior: false }, () => {
    // By default the Delay per Px is 5ms/px.
    testInterval(SCROLLBAR_DIMENSION).then(defaultInterval => {

      // Setting to 50ms/px (10 times of the default).
      cy.get('[data-test="delay-cursor-input"]').type('{selectall}50'); // 5ms/px -> 50ms/px
      cy.get('[data-test="set-options-btn"]').click();

      // Ideally if we are scrolling to same row, and set cursor to 17px, the new interval will be set to MIN interval (Math.max(30, 600 - 50 * 17) = 30ms),
      // and the used time should be around 17 times faster than default.
      // Considering the threshold, 5 times faster than default is expected
      testInterval(SCROLLBAR_DIMENSION).then(newInterval => {

        // scrolling speed is quicker than before
        expect(2.0 * newInterval.cell).to.be.lessThan(defaultInterval.cell);
        expect(2.0 * newInterval.row).to.be.lessThan(defaultInterval.row);

        cy.get('[data-test="default-options-btn"]').click();
        cy.get('[data-test="delay-cursor-input"]').should('have.value', '5');
      });
    });
  });

  it('should have a frozen grid with 4 containers with 2 columns on the left and 3 rows on the top after click Set/Clear Frozen button', () => {
    cy.get(`.grid17-1 [style="top: ${CELL_HEIGHT * 0}px;"]`).should('have.length', 1);
    cy.get(`.grid17-2 [style="top: ${CELL_HEIGHT * 0}px;"]`).should('have.length', 1);

    cy.get('[data-test="set-clear-frozen-btn"]').click();

    cy.get(`.grid17-1 [style="top: ${CELL_HEIGHT * 0}px;"]`).should('have.length', 2 * 2);
    cy.get(`.grid17-2 [style="top: ${CELL_HEIGHT * 0}px;"]`).should('have.length', 2 * 2);
    cy.get(`.grid17-1 .grid-canvas-left > [style="top: ${CELL_HEIGHT * 0}px;"]`).children().should('have.length', 2 * 2);
    cy.get(`.grid17-2 .grid-canvas-left > [style="top: ${CELL_HEIGHT * 0}px;"]`).children().should('have.length', 2 * 2);
    cy.get('.grid17-1 .grid-canvas-top').children().should('have.length', 3 * 2);
    cy.get('.grid17-2 .grid-canvas-top').children().should('have.length', 3 * 2);
  });

  function resetScrollInFrozen() {
    cy.get('.grid17-1 .slick-viewport:last').scrollTo(0, 0);
    cy.get('.grid17-2 .slick-viewport:last').scrollTo(0, 0);
  }

  it('should auto scroll to display the selecting element when dragging in frozen grid', { scrollBehavior: false }, () => {
    // top left - to bottomRight
    getScrollDistanceWhenDragOutsideGrid('.grid17-1', 'topLeft', 'bottomRight', 0, 1).then(result => {
      expect(result.scrollTopBefore).to.be.equal(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.equal(result.scrollLeftAfter);
    });
    getScrollDistanceWhenDragOutsideGrid('.grid17-2', 'topLeft', 'bottomRight', 0, 1).then(result => {
      expect(result.scrollTopBefore).to.be.equal(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.equal(result.scrollLeftAfter);
    });

    // top right - to bottomRight
    getScrollDistanceWhenDragOutsideGrid('.grid17-1', 'topRight', 'bottomRight', 0, 0).then(result => {
      expect(result.scrollTopBefore).to.be.equal(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.lte(result.scrollLeftAfter);
    });
    getScrollDistanceWhenDragOutsideGrid('.grid17-2', 'topRight', 'bottomRight', 0, 0).then(result => {
      expect(result.scrollTopBefore).to.be.equal(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.lte(result.scrollLeftAfter);
    });
    resetScrollInFrozen();

    // bottom left - to bottomRight
    getScrollDistanceWhenDragOutsideGrid('.grid17-1', 'bottomLeft', 'bottomRight', 0, 1).then(result => {
      expect(result.scrollTopBefore).to.be.lessThan(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.equal(result.scrollLeftAfter);
    });
    getScrollDistanceWhenDragOutsideGrid('.grid17-2', 'bottomLeft', 'bottomRight', 0, 1).then(result => {
      expect(result.scrollTopBefore).to.be.lessThan(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.equal(result.scrollLeftAfter);
    });
    resetScrollInFrozen();

    // bottom right - to bottomRight
    getScrollDistanceWhenDragOutsideGrid('.grid17-1', 'bottomRight', 'bottomRight', 0, 0).then(result => {
      expect(result.scrollTopBefore).to.be.lessThan(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.lessThan(result.scrollLeftAfter);
    });
    getScrollDistanceWhenDragOutsideGrid('.grid17-2', 'bottomRight', 'bottomRight', 0, 0).then(result => {
      expect(result.scrollTopBefore).to.be.lessThan(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.lessThan(result.scrollLeftAfter);
    });
    resetScrollInFrozen();
    cy.get('.grid17-1 .slick-viewport-bottom.slick-viewport-right').scrollTo(CELL_WIDTH * 3, CELL_HEIGHT * 3);
    cy.get('.grid17-2 .slick-viewport-bottom.slick-viewport-right').scrollTo(CELL_WIDTH * 3, CELL_HEIGHT * 3);

    // bottom right - to topLeft
    getScrollDistanceWhenDragOutsideGrid('.grid17-1', 'bottomRight', 'topLeft', 6, 4, 140).then(result => {
      expect(result.scrollTopBefore).to.be.greaterThan(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.greaterThan(result.scrollLeftAfter);
    });
    getScrollDistanceWhenDragOutsideGrid('.grid17-2', 'bottomRight', 'topLeft', 6, 4, 140).then(result => {
      expect(result.scrollTopBefore).to.be.greaterThan(result.scrollTopAfter);
      expect(result.scrollLeftBefore).to.be.greaterThan(result.scrollLeftAfter);
    });
    resetScrollInFrozen();
  });

  it('should have a frozen & grouping by Duration grid after click Set/Clear grouping by Duration button', { scrollBehavior: false }, () => {
    cy.get('[data-test="set-clear-grouping-btn"]').trigger('click');
    cy.get(`.grid17-1 [style="top: ${CELL_HEIGHT * 0}px;"]`).should('have.length', 2 * 2);
    cy.get(`.grid17-2 [style="top: ${CELL_HEIGHT * 0}px;"]`).should('have.length', 2 * 2);
    cy.get('.grid17-1 .grid-canvas-top.grid-canvas-left').contains('Duration');
    cy.get('.grid17-2 .grid-canvas-top.grid-canvas-left').contains('Duration');
  });

  function testDragInGrouping(selector) {
    cy.getNthCell(7, 0, 'bottomRight', { parentSelector: selector, rowHeight: CELL_HEIGHT })
      .dragStart();
    cy.get(`${selector} .slick-viewport:last`).as('viewport').invoke('scrollTop').then(scrollBefore => {
      cy.dragOutside('bottom', 400, CELL_HEIGHT * 12, { parentSelector: selector });
      cy.get('@viewport').invoke('scrollTop').then(scrollAfter => {
        expect(scrollBefore).to.be.lessThan(scrollAfter as number);
        cy.dragEnd(selector);
        cy.get(`${selector} [style='top: ${CELL_HEIGHT * 14}px;'].slick-group`).should('exist');
      });
    });
  }

  it('should auto scroll to display the selecting element even unselectable cell exist in grouping grid', { scrollBehavior: false }, () => {
    testDragInGrouping('.grid17-1');
    testDragInGrouping('.grid17-2');
  });

  it('should reset to default grid when click Set/Clear Frozen button and Set/Clear grouping button', () => {
    cy.get('[data-test="set-clear-frozen-btn"]').trigger('click');
    cy.get('[data-test="set-clear-grouping-btn"]').trigger('click');
    cy.get(`.grid17-1 [style="top: ${CELL_HEIGHT * 0}px;"]`).should('have.length', 1);
    cy.get(`.grid17-2 [style="top: ${CELL_HEIGHT * 0}px;"]`).should('have.length', 1);
  });
});
