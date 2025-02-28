describe('Example 21 - Row Detail with inner Grid', () => {
  const rootGridTitles = ['', 'ID', 'Company Name', 'Street Address', 'City', 'Zip Code', 'Country'];
  const innerGridTitles = ['Order ID', 'Ship City', 'Freight', 'Ship Name'];
  const GRID_ROW_HEIGHT = 33;
  let ROW_DETAIL_PANEL_COUNT = 8;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example21`);
    cy.get('h3').should('contain', 'Example 21 - Row Detail with inner Grid');
    cy.get('h3 span.subtitle').should('contain', '(with Salesforce Theme)');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid21')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(rootGridTitles[index]));
  });

  it('should row detail height to 8 rows and change server delay to 40ms for faster testing', () => {
    cy.get('[data-test="detail-view-row-count"]').clear().type('8');
    cy.get('[data-test="set-count-btn"]').click();
    cy.get('[data-test="server-delay"]').type('{backspace}');
  });

  it('should open the Row Detail of the 2nd row and expect to find an inner grid with all inner column titles', () => {
    cy.get('.slick-cell.detail-view-toggle:nth(1)').click().wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail').find('h4').should('contain', `- Order Details (id: ${1})`);

    cy.get('.innergrid-1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(innerGridTitles[index]));
  });

  it('should sort 2nd Row Detail inner grid "Freight" column in ascending order and filter "Ship City" with "m" and expect 2 sorted rows', () => {
    cy.get('.innergrid-1')
      .find('.slick-header-column:nth(2)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();

    cy.get('.innergrid-1 .slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(3)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Ascending')
      .click();

    cy.get('.innergrid-1 .search-filter.filter-shipCity').clear().type('m*');

    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should open 3rd row and still expect 2nd row to be sorted and filtered', () => {
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * (1 * (ROW_DETAIL_PANEL_COUNT + 1))}px;"] .slick-cell:nth(0)`)
      .click()
      .wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail').find('h4').should('contain', `- Order Details (id: ${2})`);

    // 2nd row detail
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');

    // 3rd row detail
    cy.get('.innergrid-2 .search-filter.filter-orderId').should('have.value', '');
    cy.get('.innergrid-2 .search-filter.filter-shipCity').should('have.value', '');
    cy.get('.innergrid-2 .slick-sort-indicator-asc').should('not.exist');

    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10261');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Rio de Janeiro');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should go at the bottom end of the grid, then back to top and expect all Row Details to be opened but reset to default', () => {
    cy.get('.grid21').type('{ctrl}{end}', { release: false });
    cy.get('.grid21').type('{ctrl}{home}', { release: false });

    // 2nd row detail
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10261');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Rio de Janeiro');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');

    // 3rd row detail
    cy.get('.innergrid-2 .search-filter.filter-orderId').should('have.value', '');
    cy.get('.innergrid-2 .search-filter.filter-shipCity').should('have.value', '');
    cy.get('.innergrid-2 .slick-sort-indicator-asc').should('not.exist');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10261');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Rio de Janeiro');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should close all rows', () => {
    cy.get('[data-test="collapse-all-btn"]').click();
  });

  it('should open 2nd row and sort inner grid "Freight" column in ascending order and filter "Order ID" and "Ship City" with "m" and expect 2 sorted rows', () => {
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 1}px;"] .slick-cell:nth(0)`)
      .click()
      .wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail').find('h4').should('contain', `- Order Details (id: ${1})`);

    cy.get('.innergrid-1')
      .find('.slick-header-column:nth(2)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();

    cy.get('.innergrid-1 .slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(3)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Ascending')
      .click();

    cy.get('.innergrid-1 .search-filter.filter-orderId').clear().type('>102');
    cy.get('.innergrid-1 .search-filter.filter-shipCity').clear().type('m*');

    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should open 1st row and expect 2nd row no longer be sorted neither filtered because it has to re-rendered', () => {
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 0}px;"] .slick-cell:nth(0)`)
      .click()
      .wait(40);

    cy.get('.innergrid-1 .search-filter.filter-shipCity').should('have.value', '');
    cy.get('.innergrid-1 .slick-sort-indicator-asc').should('not.exist');

    // default rows
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10261');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Rio de Janeiro');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should close all rows', () => {
    cy.get('[data-test="collapse-all-btn"]').click();
  });

  it('should re-open 2nd row and sort inner grid "Freight" column in ascending order and filter "Ship City" with "m" and expect 2 sorted rows', () => {
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 1}px;"] .slick-cell:nth(0)`)
      .click()
      .wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail').find('h4').should('contain', `- Order Details (id: ${1})`);

    cy.get('.innergrid-1')
      .find('.slick-header-column:nth(2)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();

    cy.get('.innergrid-1 .slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(3)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Ascending')
      .click();

    cy.get('.innergrid-1 .search-filter.filter-shipCity').clear().type('m*');

    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should scroll down when the row detail is just barely visible and then scroll back up and still expect same filters/sorting', () => {
    cy.get('.grid21 .slick-viewport-top.slick-viewport-left').first().scrollTo(0, 350);
    cy.wait(50);
    cy.get('.grid21 .slick-viewport-top.slick-viewport-left').first().scrollTo(0, 0);

    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should scroll down by 2 pages down and then scroll back up and no longer the same filters/sorting', () => {
    cy.get('.grid21 .slick-viewport-top.slick-viewport-left').first().scrollTo(0, 800);
    cy.wait(50);
    cy.get('.grid21 .slick-viewport-top.slick-viewport-left').first().scrollTo(0, 0);

    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('not.contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('not.contain', 'Madrid');
  });

  it('should close all rows and enable inner Grid State/Presets', () => {
    cy.get('[data-test="collapse-all-btn"]').click();
    cy.get('[data-test="use-inner-grid-state-presets"]').click();
  });

  it('should open again 2nd row and sort inner grid "Freight" column in ascending order & filter "Ship City" with "m" and expect 2 sorted rows', () => {
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 1}px;"] .slick-cell:nth(0)`)
      .click()
      .wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail').find('h4').should('contain', `- Order Details (id: ${1})`);

    cy.get('.innergrid-1')
      .find('.slick-header-column:nth(2)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();

    cy.get('.innergrid-1 .slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(3)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Ascending')
      .click();

    cy.get('.innergrid-1 .search-filter.filter-shipCity').clear().type('m*');

    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should open again 3rd row and sort inner grid "Freight" column in ascending order & filter "Order ID" and "Ship City" with "m" and expect 2 sorted rows', () => {
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * (1 * (ROW_DETAIL_PANEL_COUNT + 1))}px;"] .slick-cell:nth(0)`)
      .click()
      .wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail').find('h4').should('contain', `- Order Details (id: ${2})`);

    cy.get('.innergrid-2 .slick-header-column:nth(2)').trigger('mouseover').children('.slick-header-menu-button').invoke('show').click();

    cy.get('.innergrid-2 .slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(3)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Ascending')
      .click();

    cy.get('.innergrid-2 .search-filter.filter-orderId').clear().type('>102');
    cy.get('.innergrid-2 .search-filter.filter-shipCity').clear().type('m*');

    // 3rd row detail
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should go to the bottom end of the grid and open row 987', () => {
    cy.get('.grid21').type('{ctrl}{end}', { release: false });

    cy.get('.slick-row[data-row=1001] .detail-view-toggle').first().click();

    cy.get('.innergrid-987 .search-filter.filter-orderId').clear().type('>987');
    cy.get('.slick-empty-data-warning').should('be.visible');
  });

  it('should go again back to top of the grid and now expect that all Row Details are still opened AND their filters/sorting are kept and reapplied', () => {
    cy.get('.grid21').type('{ctrl}{home}', { release: false });

    // 2nd row detail
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');

    // 3rd row detail
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should go back to the bottom of the grid and still expect row detail 987 to be opened with same filter and no rows inside it', () => {
    cy.get('.grid21').type('{ctrl}{end}', { release: false });

    cy.get('.innergrid-987 .search-filter.filter-orderId').clear().type('>987');
    cy.get('.slick-empty-data-warning').should('be.visible');
  });

  it('should go back to the top of the grid once more and close 3nd row and still expect same rows in both row details', () => {
    cy.get('.grid21').type('{ctrl}{home}', { release: false });
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * (1 * (ROW_DETAIL_PANEL_COUNT + 1))}px;"] .slick-cell:nth(0)`)
      .click()
      .wait(40);

    // 2nd row detail
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');

    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * (1 * (ROW_DETAIL_PANEL_COUNT + 1))}px;"] .slick-cell:nth(0)`)
      .click()
      .wait(40);

    // 2nd row detail
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');

    // 3rd row detail
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });

  it('should change Row Detail panel height to 15, open 2nd and 3rd then execute PageDown twice', () => {
    ROW_DETAIL_PANEL_COUNT = 15;
    cy.get('[data-test="collapse-all-btn"]').click();
    cy.get('[data-test="detail-view-row-count"]').clear().type('15');
    cy.get('[data-test="set-count-btn"]').click();

    cy.get('.slick-cell.detail-view-toggle:nth(1)').click().wait(40);

    // 2nd row detail
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');

    // open 3rd row detail
    cy.get(`.slick-row[data-row="14"] .slick-cell:nth(0)`).click().wait(40);

    // 3rd row detail
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');

    cy.get('.grid21').type('{pageDown}{pageDown}', { release: false });
    cy.wait(50);
    cy.get('.grid21 .slick-viewport-top.slick-viewport-left').first().scrollTo(0, 350);

    // expect same grid details for both grids
    // 2nd row detail
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-1 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
    // 3rd row detail
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`).should('contain', '10281');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(1)`).should('contain', 'Madrid');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`).should('contain', '10267');
    cy.get(`.innergrid-2 [style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'München');
  });
});
