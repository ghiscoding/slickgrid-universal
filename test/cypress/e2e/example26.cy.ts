describe('Example 26 - OData with Infinite Scroll', () => {
  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example26`);
    cy.get('h3').should('contain', 'Example 26 - OData Backend Service with Infinite Scroll');
  });

  describe('when "enableCount" is set', () => {
    it('should have default OData query', () => {
      cy.get('[data-test=alert-odata-query]').should('exist');
      cy.get('[data-test=alert-odata-query]').should('contain', 'OData Query');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished');

      cy.get('[data-test=odata-query-result]')
        .should(($span) => {
          expect($span.text()).to.eq(`$count=true&$top=30`);
        });
    });

    it('should scroll to bottom of the grid and expect next batch of 30 items appended to current dataset for a total of 60 items', () => {
      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '30');

      cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
        .scrollTo('bottom');

      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '60');

      cy.get('[data-test=odata-query-result]')
        .should(($span) => {
          expect($span.text()).to.eq(`$count=true&$top=30&$skip=30`);
        });
    });

    it('should scroll to bottom of the grid and expect next batch of 30 items appended to current dataset for a new total of 90 items', () => {
      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '60');

      cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
        .scrollTo('bottom');

      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '90');

      cy.get('[data-test=odata-query-result]')
        .should(($span) => {
          expect($span.text()).to.eq(`$count=true&$top=30&$skip=60`);
        });
    });

    it('should do one last scroll to reach the end of the data and have a full total of 100 items', () => {
      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '90');

      cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
        .scrollTo('bottom');

      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '100');

      cy.get('[data-test=odata-query-result]')
        .should(($span) => {
          expect($span.text()).to.eq(`$count=true&$top=30&$skip=90`);
        });
    });

    it('should sort by Name column and expect dataset to restart at index zero and have a total of 30 items', () => {
      cy.get('[data-id="name"]')
        .click();

      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '30');

      cy.get('[data-test=odata-query-result]')
        .should(($span) => {
          expect($span.text()).to.eq(`$count=true&$top=30&$orderby=Name asc`);
        });
    });

    it('should scroll to bottom again and expect next batch of 30 items appended to current dataset for a total of 60 items', () => {
      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '30');

      cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
        .scrollTo('bottom');

      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '60');

      cy.get('[data-test=odata-query-result]')
        .should(($span) => {
          expect($span.text()).to.eq(`$count=true&$top=30&$skip=30&$orderby=Name asc`);
        });
    });

    it('should change Gender filter to "female" and expect dataset to restart at index zero and have a total of 30 items', () => {
      cy.get('.ms-filter.filter-gender:visible').click();

      cy.get('[data-name="filter-gender"].ms-drop')
        .find('li:visible:nth(2)')
        .contains('female')
        .click();

      cy.get('[data-test=odata-query-result]')
        .should(($span) => {
          expect($span.text()).to.eq(`$count=true&$top=30&$orderby=Name asc&$filter=(Gender eq 'female')`);
        });
    });

    it('should scroll to bottom again and expect next batch to be only 20 females appended to current dataset for a total of 50 items found in DB', () => {
      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '30');

      cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
        .scrollTo('bottom');

      cy.get('[data-test="totalItemCount"]')
        .should('have.text', '50');

      cy.get('[data-test=odata-query-result]')
        .should(($span) => {
          expect($span.text()).to.eq(`$count=true&$top=30&$skip=30&$orderby=Name asc&$filter=(Gender eq 'female')`);
        });
    });
  });
});
