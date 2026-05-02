describe('Example 53 - Custom Filter Bar ', () => {
  const titles = ['Item', 'Cost', 'State Tax', 'County Tax', 'Federal Tax', 'Sub-Total', 'Total', 'Type'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example53`);
    cy.get('h3').should('contain', 'Example 53 - Custom Filter Bar');
  });

  it('should have exact Column Titles in the grid', () => {
    cy.get('#grid53')
      .find('.slick-header-columns .slick-column-name')
      .each(($child, index) => expect($child.text()).to.eq(titles[index]));
  });

  it('should have 2 sorted columns as presets & have filled column filter icons', () => {
    cy.get('.slick-header-columns .slick-header-column:nth(3) .slick-header-button .mdi').should('have.class', 'mdi-filter');
    cy.get('.slick-header-left .slick-header-column:nth(3)')
      .find('.slick-sort-indicator-asc')
      .should('have.length', 1)
      .siblings('.slick-sort-indicator-numbered')
      .contains('1');

    cy.get('.slick-header-columns .slick-header-column:nth(6) .slick-header-button .mdi').should('have.class', 'mdi-filter');
    cy.get('.slick-header-left .slick-header-column:nth(6)')
      .find('.slick-sort-indicator-desc')
      .should('have.length', 1)
      .siblings('.slick-sort-indicator-numbered')
      .contains('2');
  });

  it('should also have 2 preset filters and be shown in top header bar', () => {
    cy.get('.slick-topheader-panel .top-dropped-filter').should('have.length', 2);
    cy.get('.top-dropped-filter[data-col-id="tax2"] .filter-title').should('contain', 'County Tax');
    cy.get('.top-dropped-filter[data-col-id="tax2"] .filter-value').should('contain', '>= 2');

    cy.get('.top-dropped-filter[data-col-id="total"] .filter-title').should('contain', 'Total');
    cy.get('.top-dropped-filter[data-col-id="total"] .filter-value').should('contain', '< 777');
  });

  it('should expect "County Tax >= 2" and "Total < 777"', () => {
    cy.get('[data-row="0"] > .slick-cell:nth(3)').then(($cell) => expect(Number($cell.text())).to.be.gte(2));
    cy.get('[data-row="1"] > .slick-cell:nth(3)').then(($cell) => expect(Number($cell.text())).to.be.gte(2));
    cy.get('[data-row="2"] > .slick-cell:nth(3)').then(($cell) => expect(Number($cell.text())).to.be.gte(2));
    cy.get('[data-row="3"] > .slick-cell:nth(3)').then(($cell) => expect(Number($cell.text())).to.be.gte(2));
    cy.get('[data-row="4"] > .slick-cell:nth(3)').then(($cell) => expect(Number($cell.text())).to.be.gte(2));

    cy.get('[data-row="0"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.lt(777));
    cy.get('[data-row="1"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.lt(777));
    cy.get('[data-row="2"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.lt(777));
    cy.get('[data-row="3"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.lt(777));
    cy.get('[data-row="4"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.lt(777));
  });

  it('should click on "Total" filter and change it to < 600 and expect rows to be lower', () => {
    cy.get('.slick-header-columns .slick-header-column:nth(6) .slick-header-button .mdi-filter').click();
    cy.get('.filter-modal .filter-modal-input')
      .invoke('val')
      .then((text) => expect(text).to.eq('< 777'));

    cy.get('input.filter-modal-input').type('{backspace}{backspace}{backspace}450{enter}');
    cy.get('.top-dropped-filter[data-col-id="total"] .filter-value').should('contain', '< 450');
    cy.get('[data-row="0"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.lt(450));
    cy.get('[data-row="1"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.lt(450));
    cy.get('[data-row="2"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.lt(450));
  });

  it('should clear "Total" filter from top header bar and then sort column descending and expect > 777', () => {
    cy.get('.top-dropped-filter[data-col-id="total"] .filter-remove').click();
    cy.get('.slick-topheader-panel .top-dropped-filter').should('have.length', 1);
    cy.get('.slick-header-columns .slick-header-column:nth(6)').click().click();
    cy.get('[data-row="0"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.gt(777));
    cy.get('[data-row="1"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.gt(777));
    cy.get('[data-row="2"] > .slick-cell:nth(6)').then(($cell) => expect(Number($cell.text())).to.be.gt(777));
  });

  it('should click on "County Tax" filter header button then expect modal filter to have ">= 2" value and be able to change filter value', () => {
    cy.get('.slick-header-columns .slick-header-column:nth(3) .slick-header-button .mdi-filter').click();
    cy.get('.filter-modal .filter-modal-input')
      .invoke('val')
      .then((text) => expect(text).to.eq('>= 2'));

    cy.get('input.filter-modal-input').type('{backspace}3{enter}');
    cy.get('.top-dropped-filter[data-col-id="tax2"] .filter-value').should('contain', '>= 3');
    cy.get('.slick-header-columns .slick-header-column:nth(3)').click();
    cy.get('[data-row="0"] > .slick-cell:nth(3)').then(($cell) => expect(Number($cell.text())).to.be.gte(3));
    cy.get('[data-row="1"] > .slick-cell:nth(3)').then(($cell) => expect(Number($cell.text())).to.be.gte(3));
    cy.get('[data-row="2"] > .slick-cell:nth(3)').then(($cell) => expect(Number($cell.text())).to.be.gte(3));
  });

  it('should be able to search for "Toy"', () => {
    cy.get('.slick-header-columns .slick-header-column:nth(7) .slick-header-button .mdi-filter-outline').click();
    cy.get('input.filter-modal-input').type('toy');
    cy.get('.filter-modal .filter-modal-ok').click();

    cy.get('[data-row="0"] > .slick-cell:nth(7)').should('contain', 'Toy');
    cy.get('[data-row="1"] > .slick-cell:nth(7)').should('contain', 'Toy');
    cy.get('[data-row="2"] > .slick-cell:nth(7)').should('contain', 'Toy');
  });
});
