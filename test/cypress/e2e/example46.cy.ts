describe('Example 46 - Formula Service (MVP)', () => {
  const GRID_ROW_HEIGHT = 38;
  const fullTitles = ['#', 'Name', 'Price', 'Quantity', 'Sub-Total', 'Taxable', 'Taxes', 'Total', 'Custom Sum'];

  const rowSelector = (rowIdx: number) => `.grid46 [style="transform: translateY(${GRID_ROW_HEIGHT * rowIdx}px);"]`;
  const cell = (rowIdx: number, cellIdx: number) => `${rowSelector(rowIdx)} > .slick-cell:nth(${cellIdx})`;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example46`);
    cy.get('h3').should('contain', 'Example 46 - Formula Service (MVP)');
  });

  it('should have exact column titles on grid', () => {
    cy.get('.grid46')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should check first 3 rows with calculated values (including Custom Sum)', () => {
    // 1st row
    cy.get(cell(0, 0)).contains('1');
    cy.get(cell(0, 1)).contains('Oranges');
    cy.get(cell(0, 2)).contains('$2.22');
    cy.get(cell(0, 3)).contains('4');
    cy.get(cell(0, 4)).contains('$8.88');
    cy.get(cell(0, 5)).should('have.text', '');
    cy.get(cell(0, 6)).contains('$0.00');
    cy.get(cell(0, 7)).contains('$8.88');
    cy.get(cell(0, 8)).contains('$6.22');

    // 2nd row
    cy.get(cell(1, 0)).contains('2');
    cy.get(cell(1, 1)).contains('Apples');
    cy.get(cell(1, 2)).contains('$1.55');
    cy.get(cell(1, 3)).contains('3');
    cy.get(cell(1, 4)).contains('$4.65');
    cy.get(cell(1, 5)).should('have.text', '');
    cy.get(cell(1, 6)).contains('$0.00');
    cy.get(cell(1, 7)).contains('$4.65');
    cy.get(cell(1, 8)).contains('$4.55');

    // 3rd row
    cy.get(cell(2, 0)).contains('3');
    cy.get(cell(2, 1)).contains('Honeycomb Cereals');
    cy.get(cell(2, 2)).contains('$4.55');
    cy.get(cell(2, 3)).contains('2');
    cy.get(cell(2, 4)).contains('$9.10');
    cy.get(cell(2, 5)).find('.mdi-check');
    cy.get(cell(2, 6)).contains('$0.68');
    cy.get(cell(2, 7)).contains('$9.78');
    cy.get(cell(2, 8)).contains('$6.55');
  });

  it('should edit a formula cell in Formula Editor and persist the updated formula result', () => {
    cy.get(cell(0, 4)).click();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=C1*D1*2{enter}', { force: true });

    cy.get(cell(0, 4)).contains('$17.76');
    cy.get(cell(0, 7)).contains('$17.76');

    // Re-open editor and verify the entered formula text persisted in store.
    cy.get(cell(0, 4)).click();
    cy.get('.formula-editor-input')
      .should('be.visible')
      .invoke('text')
      .then((text) => text.replace(/\s+/g, ''))
      .should('contain', '=C1*D1*2');
    cy.get('.formula-editor-input').type('{enter}', { force: true });

    // restore baseline formulas for subsequent test steps in this serial run
    cy.get('[data-test="reload-formulas-btn"]').click();
    // In this demo, reloaded formula text can require one editor commit to refresh displayed calculated value.
    cy.get(cell(0, 4)).click();
    cy.get('.formula-editor-input').should('be.visible').type('{enter}', { force: true });
    cy.get(cell(0, 4)).contains('$8.88');
    cy.get(cell(0, 7)).contains('$8.88');
  });

  it('should keep first argument and append second reference after operator in function expression', () => {
    // Start formula entry from the Sub-Total formula cell.
    cy.get(cell(0, 4)).click();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=s', { force: true });

    // Pick SUM from autocomplete.
    cy.get('.formula-autocomplete').should('be.visible');
    cy.contains('.formula-autocomplete div', /^SUM$/).click({ force: true });

    // Pick first cell reference, then multiply operator, then second reference.
    cy.get(cell(0, 2)).click();
    cy.get('.formula-editor-input').should('be.visible').type('*', { force: true });
    cy.get(cell(0, 3)).click();

    // Regression assertion: second click must append at caret, not replace C1.
    cy.get('.formula-editor-input')
      .invoke('text')
      .then((text) => text.replace(/\s+/g, ''))
      .should('eq', '=SUM(C1*D1');

    // This test validates editor UX string composition (not formula execution semantics).
    // Cancel edit to avoid committing a partially composed function expression in this serial flow.
    cy.get('.formula-editor-input').type('{esc}', { force: true });
    cy.get(cell(0, 4)).contains('$8.88');

    // Restore canonical formula text for subsequent serial test steps.
    cy.get('[data-test="reload-formulas-btn"]').click();
    cy.get(cell(0, 4)).click();
    cy.get('.formula-editor-input').should('be.visible').type('{enter}', { force: true });
    cy.get(cell(0, 4)).contains('$8.88');
  });

  it('should evaluate IF formula correctly for non-taxable and taxable rows', () => {
    // non-taxable row: IF condition should return 0 taxes
    cy.get(cell(0, 6)).click();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=IF(F1=TRUE,E1*0.2,0){enter}', { force: true });
    cy.get(cell(0, 6)).contains('$0.00');
    cy.get(cell(0, 7)).contains('$8.88');

    // taxable row: IF condition should calculate taxes from sub-total
    cy.get(cell(2, 6)).click();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=IF(F3=TRUE,E3*0.2,0){enter}', { force: true });
    cy.get(cell(2, 6)).contains('$1.82');
    cy.get(cell(2, 7)).contains('$10.92');

    // restore baseline formulas for subsequent serial tests
    cy.get('[data-test="reload-formulas-btn"]').click();
    cy.get(cell(0, 4)).click();
    cy.get('.formula-editor-input').should('be.visible').type('{enter}', { force: true });
    cy.get(cell(2, 6)).contains('$0.68');
    cy.get(cell(2, 7)).contains('$9.78');
  });

  it('should support SUM and other built-in functions and keep custom function column editable', () => {
    // verify default custom function exists in editor text for row 1
    cy.get(cell(0, 8)).click();
    cy.get('.formula-editor-input')
      .should('be.visible')
      .invoke('text')
      .then((text) => text.replace(/\s+/g, ''))
      .should('contain', '=CUSTOMSUM(C1:D1)');

    // SUM on row 1 (same expected result)
    cy.get('.formula-editor-input').click().type('{selectall}=SUM(C1:D1){enter}', { force: true });
    cy.get(cell(0, 8)).contains('$6.22');

    // PRODUCT on row 2
    cy.get(cell(1, 8)).click();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=PRODUCT(C2,D2){enter}', { force: true });
    cy.get(cell(1, 8)).contains('$4.65');

    // MAX on row 3
    cy.get(cell(2, 8)).click();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=MAX(C3,D3){enter}', { force: true });
    cy.get(cell(2, 8)).contains('$4.55');

    // restore baseline formulas for subsequent serial tests
    cy.get('[data-test="reload-formulas-btn"]').click();
    cy.get(cell(0, 4)).click();
    cy.get('.formula-editor-input').should('be.visible').type('{enter}', { force: true });
    cy.get(cell(0, 8)).contains('$6.22');
    cy.get(cell(1, 8)).contains('$4.55');
    cy.get(cell(2, 8)).contains('$6.55');
  });

  it('should update tax rate and then recalculate formula-driven values after editing price/qty', () => {
    cy.get('[data-test="taxrate"]').clear().type('6.25');
    cy.get('[data-test="update-btn"]').click();

    // 3rd row taxes/total should reflect new tax rate
    cy.get(cell(2, 6)).contains('$0.57');
    cy.get(cell(2, 7)).contains('$9.67');

    // edit price + qty in row 3 and validate formula recalculation
    cy.get(cell(2, 2)).click();
    cy.get(`${cell(2, 2)} input`)
      .clear()
      .type('4.23{enter}');
    cy.get(cell(2, 3)).click();
    cy.get(`${cell(2, 3)} input`)
      .clear()
      .type('3{enter}');

    cy.get(cell(2, 4)).contains('$12.69');
    cy.get(cell(2, 6)).contains('$0.79');
    cy.get(cell(2, 7)).contains('$13.48');
    cy.get(cell(2, 8)).contains('$7.23');
  });

  it('should group by Taxable and allow returning back to ungrouped view', () => {
    cy.get('[data-test="group-by-btn"]').click();

    cy.get('.grid46 .slick-group').should('have.length.at.least', 2);
    cy.get('.grid46 .slick-group').first().should('contain', 'Taxable:');
    cy.get('.grid46 .slick-group-totals').should('have.length.at.least', 1);

    cy.get('[data-test="clear-grouping-btn"]').click();

    cy.get(cell(0, 1)).contains('Oranges');
    cy.get(cell(1, 1)).contains('Apples');
  });
});
