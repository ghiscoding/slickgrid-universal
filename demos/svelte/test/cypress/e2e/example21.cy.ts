describe('Example 21 - Grid AutoHeight', () => {
  const fullTitles = ['Title', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];
  const GRID_ROW_HEIGHT = 35;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example21`);
    cy.get('h2').should('contain', 'Example 21: Grid AutoHeight');
  });

  it('should have exact column titles in grid', () => {
    cy.get('#slickGridContainer-grid21')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should search for Duration over 50 and expect rows to be that', () => {
    cy.get('[data-test="search-column-list"]').select('Duration (days)', { force: true });

    cy.get('[data-test="search-operator-list"]').select('>', { force: true });

    cy.get('[data-test="search-value-input"]').type('50', { force: true });

    cy.get('#grid21')
      .find('.slick-row .slick-cell:nth(1)')
      .each(($child, index) => {
        if (index > 10) {
          return;
        }
        expect(+$child.text()).to.be.gt(50);
      });
  });

  it('should search for Duration below 50 and expect rows to be that', () => {
    cy.get('[data-test="search-operator-list"]').select('<');

    cy.wait(200);

    cy.get('#grid21')
      .find('.slick-row .slick-cell:nth(1)')
      .each(($child, index) => {
        if (index > 10) {
          return;
        }
        expect(+$child.text()).to.be.lt(50);
      });
  });

  it('should type a filter which returns an empty dataset', () => {
    cy.get('[data-test="search-value-input"]').clear().type('zzz');

    cy.get('.slick-empty-data-warning:visible').contains('No data to display.');
  });

  it('should search for Title ending with text "5" expect rows to be (Task 5, 15, 25, ...)', () => {
    cy.get('[data-test="clear-search-value"]').click();

    cy.get('[data-test="search-column-list"]').select('Title', { force: true });

    cy.get('[data-test="search-operator-list"]').select('EndsWith', { force: true });

    cy.get('[data-test="search-value-input"]').type('5', { force: true });

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 5');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 15');
  });

  it('should type a filter which returns an empty dataset', () => {
    cy.get('[data-test="search-value-input"]').clear().type('zzz');

    cy.get('.slick-empty-data-warning:visible').contains('No data to display.');
  });

  it('should clear search input and expect empty dataset warning to go away and also expect data back (Task 0, 1, 2, ...)', () => {
    cy.get('[data-test="clear-search-value"]').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 0');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 1');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 2');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 3');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 4');
  });

  it('should keep the column headers stuck below the fixed navbar while scrolling the page with "autoHeight.stickyHeader"', () => {
    const NAVBAR_HEIGHT = 56;
    const expectHeaderStuckAndVisible = () => {
      cy.get('#grid21 .slick-header-column:nth(1)').should(($column) => {
        const { top, left, height } = $column[0].getBoundingClientRect();
        expect(top).to.be.closeTo(NAVBAR_HEIGHT, 1);
        // the header column must be the topmost element at its position, not hidden behind the rows
        const topElm = $column[0].ownerDocument.elementFromPoint(left + 10, top + height / 2);
        expect(topElm?.closest('.slick-header-column')).to.eq($column[0]);
      });
    };

    // without page scroll, the column headers are in their natural position below the page content
    cy.get('#grid21 .slick-header-column:nth(1)').should(($column) => {
      expect($column[0].getBoundingClientRect().top).to.be.gt(NAVBAR_HEIGHT + 100);
    });

    cy.scrollTo(0, 1500, { duration: 300 });
    cy.window().its('scrollY').should('be.gt', 1000);

    // the first row is scrolled out under the navbar, but the column headers remain visible right below it
    cy.get(`#grid21 [style="transform: translateY(0px);"] > .slick-cell:nth(0)`).should(($cell) => {
      expect($cell[0].getBoundingClientRect().top).to.be.lt(NAVBAR_HEIGHT);
    });
    expectHeaderStuckAndVisible();

    // still stuck when scrolling to the bottom of the page
    cy.scrollTo('bottom', { duration: 300 });
    cy.get(`#grid21 [style="transform: translateY(${GRID_ROW_HEIGHT * 99}px);"] > .slick-cell:nth(0)`).should('be.visible');
    expectHeaderStuckAndVisible();
  });
});
