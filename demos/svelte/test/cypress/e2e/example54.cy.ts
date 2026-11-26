describe('Example 54 - AI / Web MCP Toolkit', () => {
  const titles = ['#', 'Title', 'Priority', 'Status', 'Duration (days)', 'Completed %'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example54`);
    cy.get('h2').should('contain', 'Example 54: AI / Web MCP Toolkit');
  });

  it('should have exact Column Titles in the grid', () => {
    cy.get('.slick-header-columns .slick-column-name').each(($child, index) => expect($child.text()).to.eq(titles[index]));
  });

  it('getStructuredSchema() should return column metadata containing "priority"', () => {
    cy.contains('getStructuredSchema()').click();
    cy.get('#mcp-output').should('contain', 'priority');
  });

  it('applyGridState() should apply simulated LLM state (filter priority=High + sort duration desc)', () => {
    // Apply simulated AI state
    cy.contains('applyGridState()').click();

    // Wait a short time for state to be applied then inspect grid state
    cy.contains('getGridState()').click();

    cy.get('#mcp-output')
      .invoke('text')
      .then((text) => {
        const state = JSON.parse(text);
        expect(state).to.have.property('filters');
        expect(state.filters).to.be.an('array').and.to.have.length.greaterThan(0);
        expect(state.filters[0].columnId).to.equal('priority');
      });

    // Verify first row priority cell contains 'High'
    cy.get('[data-row="0"] > .slick-cell:nth(2)').should('contain', 'High');
  });

  it('reset should clear filters (getGridState shows empty filters)', () => {
    cy.contains('Reset').click();
    cy.contains('getGridState()').click();
    cy.get('#mcp-output')
      .invoke('text')
      .then((text) => {
        const state = JSON.parse(text);
        expect(state.filters).to.be.an('array').and.to.have.length(0);
      });
  });
});
