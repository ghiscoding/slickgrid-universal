describe('Example 50 - Master/Detail Grids', () => {
  const firstGridTitles = ['Customer Name', 'Company Name', 'Address', 'Country'];
  const secondGridTitles = ['Order ID', 'Freight', 'Ship Company', 'Ship City', 'Ship Country', 'Ship Address'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example50`);
    cy.get('h2').should('contain', 'Example 50: Master/Detail Grids');
  });

  it('should have 2 grids width of 800px and 950px', () => {
    cy.get('#slickGridContainer-grid50-1').should('have.css', 'width', '800px');
    cy.get('#slickGridContainer-grid50-2').should('have.css', 'width', '950px');
  });

  it('should have exact column titles on both grids', () => {
    cy.get('#grid50-1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(firstGridTitles[index]));

    cy.get('#grid50-2')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(secondGridTitles[index]));
  });

  it('should have specific Customers in the first grid', () => {
    cy.get('#grid50-1 .slick-header-columns .slick-header-column').should('have.length', 4);
    cy.get('#grid50-1 [data-row="0"] > .slick-cell:nth(0)').should('contain', 'Jerome Aufderhar');
    cy.get('#grid50-1 [data-row="0"] > .slick-cell:nth(1)').should('contain', 'Morissette Inc');

    cy.get('#grid50-1 [data-row="1"] > .slick-cell:nth(0)').should('contain', 'Angeline Gislason');
    cy.get('#grid50-1 [data-row="1"] > .slick-cell:nth(1)').should('contain', 'Moen, Dooley and Champlin');

    cy.get('#grid50-1 [data-row="2"] > .slick-cell:nth(0)').should('contain', 'Dean Gibson');
    cy.get('#grid50-1 [data-row="2"] > .slick-cell:nth(1)').should('contain', 'Champlin - Schoen & Co');

    cy.get('#grid50-1 [data-row="3"] > .slick-cell:nth(0)').should('contain', 'Sherwood Collins');
    cy.get('#grid50-1 [data-row="3"] > .slick-cell:nth(1)').should('contain', 'Watsica, Smitham and Willms');

    cy.get('#grid50-1 [data-row="4"] > .slick-cell:nth(0)').should('contain', 'Colleen Gutmann');
    cy.get('#grid50-1 [data-row="4"] > .slick-cell:nth(1)').should('contain', 'Ledner, Schiller and Leuschke');
  });

  it('should have Order data for customer "Jerome Aufderhar"', () => {
    cy.get('.customer-detail').should('contain', 'Jerome Aufderhar - Morissette Inc');
    cy.get('#grid50-2 .slick-header-columns .slick-header-column').should('have.length', 6);
    cy.get('#grid50-2 [data-row="0"] > .slick-cell:nth(0)').should('contain', '10355');
    cy.get('#grid50-2 [data-row="1"] > .slick-cell:nth(0)').should('contain', '10383');
    cy.get('#grid50-2 [data-row="2"] > .slick-cell:nth(0)').should('contain', '10452');
    cy.get('#grid50-2 [data-row="3"] > .slick-cell:nth(0)').should('contain', '10662');
  });

  it('should click on 2nd row in first grid and expect Order Data for "Angeline Gislason"', () => {
    cy.get('#grid50-1 [data-row="1"] > .slick-cell:nth(0)').should('contain', 'Angeline Gislason').click();
    cy.get('.customer-detail').should('contain', 'Angeline Gislason - Moen, Dooley and Champlin');
    cy.get('#grid50-2 [data-row="0"] > .slick-cell:nth(0)').should('contain', '10278');
    cy.get('#grid50-2 [data-row="1"] > .slick-cell:nth(0)').should('contain', '10280');
    cy.get('#grid50-2 [data-row="2"] > .slick-cell:nth(0)').should('contain', '10384');
    cy.get('#grid50-2 [data-row="3"] > .slick-cell:nth(0)').should('contain', '10444');
    cy.get('#grid50-2 [data-row="4"] > .slick-cell:nth(0)').should('contain', '10445');
  });

  it('should Sort by Customer Name column in descending order and expect 4th row to be Order data for "Colleen Gutmann"', () => {
    cy.get('.customer-detail').should('contain', 'Angeline Gislason - Moen, Dooley and Champlin');
    cy.get('#grid50-1 .slick-header-columns .slick-header-column:nth(0)').click().click();
    cy.get('#grid50-1 .slick-header-columns .slick-header-column').should('have.length', 4);
    cy.get('#grid50-2 [data-row="0"] > .slick-cell:nth(0)').should('contain', '10278');
    cy.get('#grid50-2 [data-row="1"] > .slick-cell:nth(0)').should('contain', '10280');
    cy.get('#grid50-2 [data-row="2"] > .slick-cell:nth(0)').should('contain', '10384');
    cy.get('#grid50-2 [data-row="3"] > .slick-cell:nth(0)').should('contain', '10444');
    cy.get('#grid50-2 [data-row="4"] > .slick-cell:nth(0)').should('contain', '10445');

    cy.get('#grid50-1 [data-row="3"] > .slick-cell:nth(0)').should('contain', 'Colleen Gutmann').click();
    cy.get('.customer-detail').should('contain', 'Colleen Gutmann - Ledner, Schiller and Leuschke');
    cy.get('#grid50-2 .slick-header-columns .slick-header-column').should('have.length', 6);
    cy.get('#grid50-2 [data-row="0"] > .slick-cell:nth(0)').should('contain', '10258');
    cy.get('#grid50-2 [data-row="1"] > .slick-cell:nth(0)').should('contain', '10263');
    cy.get('#grid50-2 [data-row="2"] > .slick-cell:nth(0)').should('contain', '10368');
    cy.get('#grid50-2 [data-row="3"] > .slick-cell:nth(0)').should('contain', '10382');
  });
});
