describe('Example 48 - Formula Service', () => {
  const GRID_ROW_HEIGHT = 38;
  const fullTitles = ['#', 'Name', 'Price', 'Quantity', 'Sub-Total', 'Taxable', 'Taxes', 'Total', 'Custom Sum'];

  const rowSelector = (rowIdx: number) => `.grid48 [style="transform: translateY(${GRID_ROW_HEIGHT * rowIdx}px);"]`;
  const cell = (rowIdx: number, cellIdx: number) => `${rowSelector(rowIdx)} > .slick-cell:nth(${cellIdx})`;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example48`);
    cy.get('h3').should('contain', 'Example 48 - Formula Service');
  });

  it('should have exact column titles on grid', () => {
    cy.get('.grid48')
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

  it('should refresh formula results and suggestions when a custom function changes', () => {
    cy.reload();
    cy.get(cell(0, 8)).should('contain', '$6.22');
    cy.get('[data-test="remove-customsum-btn"]').click();
    cy.get(cell(0, 8)).should('contain', '#NAME?');
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=CUS', { force: true });
    cy.get('.formula-autocomplete').should('not.be.visible');
    cy.get('.formula-editor-input').type('{esc}', { force: true });
    cy.get('[data-test="register-customsum-btn"]').click();
    cy.get(cell(0, 8)).should('contain', '$6.22');
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=CUS', { force: true });
    cy.contains('.formula-autocomplete div', /^CUSTOMSUM$/).should('be.visible');
    cy.get('.formula-editor-input').type('{esc}', { force: true });
    cy.reload();
    cy.get(cell(0, 4)).should('contain', '$8.88');
  });

  it('should calculate with a custom editor and update dependent cells after edits', () => {
    cy.reload();
    cy.get(cell(0, 4)).should('contain', '$8.88');
    cy.get('[data-test="formula-editor-mode"]').select('text');
    cy.get(cell(0, 4)).should('contain', '$8.88').dblclick();
    cy.get('input.editor-subTotal').should('be.visible').clear().type('=D1*2{enter}');
    cy.get(cell(0, 4)).should('contain', '$8.00');
    cy.get(cell(0, 7)).should('contain', '$8.00');
    cy.get(cell(0, 4)).dblclick();
    cy.get('input.editor-subTotal').clear().type('17{enter}');
    cy.get(cell(0, 4)).should('contain', '$17.00');
    cy.get(cell(0, 7)).should('contain', '$17.00');
  });

  it('should calculate a formula column when editing is denied', () => {
    cy.reload();
    cy.get(cell(0, 4)).should('contain', '$8.88');
    cy.get('[data-test="formula-editor-mode"]').select('readonly');
    cy.get(cell(0, 4)).should('contain', '$8.88').dblclick();
    cy.get('.formula-editor-input').should('not.exist');
    cy.get(cell(0, 2)).dblclick();
    cy.get('input.editor-price').clear().type('3{enter}');
    cy.get(cell(0, 4)).should('contain', '$12.00');
    cy.reload();
    cy.get(cell(0, 4)).should('contain', '$8.88');
  });

  it('should edit a formula cell in Formula Editor and persist the updated formula result', () => {
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=C1*D1*2{enter}', { force: true });

    cy.get(cell(0, 4)).contains('$17.76');
    cy.get(cell(0, 7)).contains('$17.76');

    // Re-open editor and verify the entered formula text persisted in store.
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input')
      .should('be.visible')
      .invoke('text')
      .then((text) => text.replace(/\s+/g, ''))
      .should('contain', '=C1*D1*2');
    cy.get('.formula-editor-input').type('{enter}', { force: true });

    // restore baseline formulas for subsequent test steps in this serial run
    cy.get('[data-test="reload-formulas-btn"]').click();
    // In this demo, reloaded formula text can require one editor commit to refresh displayed calculated value.
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').type('{enter}', { force: true });
    cy.get(cell(0, 4)).contains('$8.88');
    cy.get(cell(0, 7)).contains('$8.88');
  });

  it('should preserve quoted references and operators when evaluating a formula', () => {
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=IF("A1 × TRUE"="A1 × TRUE",3,0){enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '$3.00');
    cy.get(cell(0, 7)).should('contain', '$3.00');
    cy.get('[data-test="reload-formulas-btn"]').click();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').type('{enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '$8.88');
  });

  it('should accept stable row and column references and reopen them as A1 references', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input')
      .click()
      .type('{selectall}=REF(COLUMN("price"),ROW("1"))*REF(COLUMN("qty"),ROW("1")){enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '$8.88').dblclick();
    cy.get('.formula-editor-input').should('have.text', '=C1*D1').type('{enter}', { force: true });
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 2 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[1][3]).to.equal('B3*C3');
    });
  });

  it('should show distinct formula errors and export circular references', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUM(1,,2){enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '#PARSE!');
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=RAND(1){enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '#VALUE!');
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=E1{enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '#CIRCREF!');
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 2 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[1][3]).to.equal('D3');
    });
  });

  it('should evaluate and export case-insensitive wildcard criteria', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUMIF(B1:B3,"a*",C1:C3){enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '$1.55');
    cy.get(cell(0, 7)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=COUNTIF(B1:B3,"A*"){enter}', { force: true });
    cy.get(cell(0, 7)).should('contain', '$1.00');
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 2 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[1][3]).to.equal('SUMIF(A3:A5,"a*",B3:B5)');
      expect(xlsx.formulaRows[1][6]).to.equal('COUNTIF(A3:A5,"A*")');
    });
  });

  it('should suggest and calculate the added math functions', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SQR', { force: true });
    cy.contains('.formula-autocomplete div', /^SQRT$/).should('be.visible');
    cy.get('.formula-editor-input').type('{selectall}=ROUND(-1.475,2)+MOD(-3,2)+SQRT(ABS(-16)){enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '$3.52');
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 2 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[1][3]).to.equal('ROUND(-1.475,2)+MOD(-3,2)+SQRT(ABS(-16))');
    });
  });

  it('should evaluate only the selected IF branch', () => {
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=IF(FALSE,1/0,42){enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '$42.00');
    cy.get(cell(0, 7)).should('contain', '$42.00');
    cy.get('[data-test="reload-formulas-btn"]').click();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').type('{enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '$8.88');
  });

  it('should keep first argument and append second reference after operator in function expression', () => {
    // Start formula entry from the Sub-Total formula cell.
    cy.get(cell(0, 4)).dblclick();
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
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').type('{enter}', { force: true });
    cy.get(cell(0, 4)).contains('$8.88');
  });

  it('should keep multi-reference cell colors while typing formula text', () => {
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=C1*SUM(D1:D3)', { force: true });

    // C1 should keep the first reference color.
    cy.get(cell(0, 2)).should('have.class', 'formula-cell-color-1');

    // D1:D3 should keep the second reference color across the full range.
    cy.get(cell(0, 3)).should('have.class', 'formula-cell-color-2');
    cy.get(cell(1, 3)).should('have.class', 'formula-cell-color-2');
    cy.get(cell(2, 3)).should('have.class', 'formula-cell-color-2');
    cy.get(cell(0, 3)).should('have.class', 'formula-ref-top').and('not.have.class', 'formula-ref-bottom');
    cy.get(cell(1, 3)).should('not.have.class', 'formula-ref-top').and('not.have.class', 'formula-ref-bottom');
    cy.get(cell(2, 3)).should('have.class', 'formula-ref-bottom').and('not.have.class', 'formula-ref-top');
    cy.get(cell(1, 3)).find('.editing-field').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
    cy.get('.formula-editor-input').should('have.css', 'font-style', 'normal');

    // Cancel this transient edit to avoid affecting subsequent tests.
    cy.get('.formula-editor-input').type('{esc}', { force: true });
    cy.get(cell(0, 4)).contains('$8.88');
  });

  it('should keep formula-token colors aligned with matching grid cell colors', () => {
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=C1*SUM(D1:D3)', { force: true });

    // Editor token colors.
    cy.contains('.formula-editor-input .formula-token.formula-token-color-1', /^C1$/).should('exist');
    cy.contains('.formula-editor-input .formula-token.formula-token-color-2', /^D1:D3$/).should('exist');

    // Grid cell colors must match token palette assignment.
    cy.get(cell(0, 2)).should('have.class', 'formula-cell-color-1');
    cy.get(cell(0, 3)).should('have.class', 'formula-cell-color-2');
    cy.get(cell(1, 3)).should('have.class', 'formula-cell-color-2');
    cy.get(cell(2, 3)).should('have.class', 'formula-cell-color-2');

    // Commit and reopen: FormulaCellEditor rebuilds grid highlights from the saved formula,
    // and its reference order must stay aligned with the editor token order.
    cy.get('.formula-editor-input').type('{enter}', { force: true });
    cy.get(cell(0, 4)).dblclick();
    cy.contains('.formula-editor-input .formula-token.formula-token-color-1', /^C1$/).should('exist');
    cy.contains('.formula-editor-input .formula-token.formula-token-color-2', /^D1:D3$/).should('exist');
    cy.get(cell(0, 2)).should('have.class', 'formula-cell-color-1');
    cy.get(cell(0, 3)).should('have.class', 'formula-cell-color-2');
    cy.get(cell(1, 3)).should('have.class', 'formula-cell-color-2');
    cy.get(cell(2, 3)).should('have.class', 'formula-cell-color-2');

    cy.get('.formula-editor-input').type('{esc}', { force: true });
    cy.get('[data-test="reload-formulas-btn"]').click();
  });

  it('should preserve reference colors when a range precedes a single-cell reference', () => {
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=SUM(D1:D3)*C1', { force: true });

    // The shared cache must assign colors by textual order, regardless of reference shape.
    cy.contains('.formula-editor-input .formula-token.formula-token-color-1', /^D1:D3$/).should('exist');
    cy.contains('.formula-editor-input .formula-token.formula-token-color-2', /^C1$/).should('exist');
    cy.get(cell(0, 3)).should('have.class', 'formula-cell-color-1');
    cy.get(cell(1, 3)).should('have.class', 'formula-cell-color-1');
    cy.get(cell(2, 3)).should('have.class', 'formula-cell-color-1');
    cy.get(cell(0, 2)).should('have.class', 'formula-cell-color-2');

    // Commit and reopen so FormulaCellEditor initial-load highlighting is exercised.
    cy.get('.formula-editor-input').type('{enter}', { force: true });
    cy.get(cell(0, 4)).dblclick();
    cy.contains('.formula-editor-input .formula-token.formula-token-color-1', /^D1:D3$/).should('exist');
    cy.contains('.formula-editor-input .formula-token.formula-token-color-2', /^C1$/).should('exist');
    cy.get(cell(0, 3)).should('have.class', 'formula-cell-color-1');
    cy.get(cell(1, 3)).should('have.class', 'formula-cell-color-1');
    cy.get(cell(2, 3)).should('have.class', 'formula-cell-color-1');
    cy.get(cell(0, 2)).should('have.class', 'formula-cell-color-2');

    cy.get('.formula-editor-input').type('{esc}', { force: true });
    cy.get('[data-test="reload-formulas-btn"]').click();
  });

  it('should keep stable coloring when formula contains an incomplete range reference', () => {
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=C1*SUM(D1:D)', { force: true });

    // Complete reference keeps color #1.
    cy.contains('.formula-editor-input .formula-token.formula-token-color-1', /^C1$/).should('exist');
    cy.get(cell(0, 2)).should('have.class', 'formula-cell-color-1');

    // Incomplete range keeps its own color #2 and should only color the valid start cell D1.
    cy.contains('.formula-editor-input .formula-token.formula-token-color-2', /^D1:D$/).should('exist');
    cy.get(cell(0, 3)).should('have.class', 'formula-cell-color-2');
    cy.get(cell(1, 3)).should('not.have.class', 'formula-cell-color-2');
    cy.get(cell(2, 3)).should('not.have.class', 'formula-cell-color-2');

    cy.get('.formula-editor-input').type('{esc}', { force: true });
    cy.get(cell(0, 4)).contains('$8.88');
  });

  it('should copy and cut plain text without nbsp/html artifacts from formula editor', () => {
    cy.document()
      .its('defaultView.navigator')
      .then((navigator) => {
        const writeTextStub = cy.stub().resolves();
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: writeTextStub },
          configurable: true,
        });
        cy.wrap(writeTextStub).as('writeTextStub');
      });

    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input')
      .should('be.visible')
      .invoke('text', '=SUM(C1\u00a0+\u00a0D1)')
      .trigger('keydown', { key: 'c', ctrlKey: true, bubbles: true, cancelable: true });

    cy.get('@writeTextStub').should('have.been.calledWithExactly', '=SUM(C1 + D1)');

    cy.get('.formula-editor-input').trigger('keydown', { key: 'x', ctrlKey: true, bubbles: true, cancelable: true });
    cy.get('@writeTextStub').should('have.been.calledWithExactly', '=SUM(C1 + D1)');
    cy.get('.formula-editor-input').invoke('text').should('eq', '');

    // Exit transient edit and restore baseline formulas for later serial tests.
    cy.get('.formula-editor-input').type('{esc}', { force: true });
    cy.get('[data-test="reload-formulas-btn"]').click();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').type('{enter}', { force: true });
    cy.get(cell(0, 4)).contains('$8.88');
  });

  it('should evaluate IF formula correctly for non-taxable and taxable rows', () => {
    // non-taxable row: IF condition should return 0 taxes
    cy.get(cell(0, 6)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=IF(F1=TRUE,E1*0.2,0){enter}', { force: true });
    cy.get(cell(0, 6)).contains('$0.00');
    cy.get(cell(0, 7)).contains('$8.88');

    // taxable row: IF condition should calculate taxes from sub-total
    cy.get(cell(2, 6)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=IF(F3=TRUE,E3*0.2,0){enter}', { force: true });
    cy.get(cell(2, 6)).contains('$1.82');
    cy.get(cell(2, 7)).contains('$10.92');

    // restore baseline formulas for subsequent serial tests
    cy.get('[data-test="reload-formulas-btn"]').click();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').type('{enter}', { force: true });
    cy.get(cell(2, 6)).contains('$0.68');
    cy.get(cell(2, 7)).contains('$9.78');
  });

  it('should support SUM and other built-in functions and keep custom function column editable', () => {
    // verify default custom function exists in editor text for row 1
    cy.get(cell(0, 8)).dblclick();
    cy.get('.formula-editor-input')
      .should('be.visible')
      .invoke('text')
      .then((text) => text.replace(/\s+/g, ''))
      .should('contain', '=CUSTOMSUM(C1:D1)');

    // SUM on row 1 (same expected result)
    cy.get('.formula-editor-input').click().type('{selectall}=SUM(C1:D1){enter}', { force: true });
    cy.get(cell(0, 8)).contains('$6.22');

    // PRODUCT on row 2
    cy.get(cell(1, 8)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=PRODUCT(C2,D2){enter}', { force: true });
    cy.get(cell(1, 8)).contains('$4.65');

    // MAX on row 3
    cy.get(cell(2, 8)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=MAX(C3,D3){enter}', { force: true });
    cy.get(cell(2, 8)).contains('$4.55');

    // restore baseline formulas for subsequent serial tests
    cy.get('[data-test="reload-formulas-btn"]').click();
    cy.get(cell(0, 4)).dblclick();
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
    cy.get(cell(2, 2)).dblclick();
    cy.get(`${cell(2, 2)} input`)
      .clear()
      .type('4.23{enter}');
    cy.get(cell(2, 3)).dblclick();
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

    cy.get('.grid48 .slick-group').should('have.length.at.least', 2);
    cy.get('.grid48 .slick-group').first().should('contain', 'Taxable:');
    cy.get('.grid48 .slick-group-totals').should('have.length.at.least', 1);

    cy.get('[data-test="clear-grouping-btn"]').click();

    cy.get(cell(0, 1)).contains('Oranges');
    cy.get(cell(1, 1)).contains('Apples');
  });

  it('should retain calculated values while grouping and ungrouping', () => {
    cy.reload();
    cy.get('[data-test="group-by-btn"]').click();
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(4).should('contain', '$8.88');
    cy.contains('.grid48 .slick-row', 'Honeycomb Cereals').find('.slick-cell').eq(4).should('contain', '$9.10');
    cy.get('[data-test="clear-grouping-btn"]').click();
    cy.get(cell(0, 4)).should('contain', '$8.88');
    cy.get(cell(2, 4)).should('contain', '$9.10');
  });

  it('should show grouped single-cell references at their displayed row positions', () => {
    cy.reload();
    cy.get('[data-test="group-by-btn"]').click();
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(4).dblclick();
    cy.get('.formula-editor-input').should('have.text', '=C9*D9');
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(2).should('have.class', 'formula-cell-color-1');
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(3).should('have.class', 'formula-cell-color-2');
    cy.get('.formula-editor-input').click().type('{selectall}=C2*2{enter}', { force: true });
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(4).should('contain', '$9.10');
    cy.get('[data-test="clear-grouping-btn"]').click();
    cy.get(cell(0, 4)).should('contain', '$9.10');
  });

  it('should drag-fill grouped formulas using displayed row references', () => {
    cy.reload();
    cy.get('[data-test="group-by-btn"]').click();
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(4).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=C9*2{enter}', { force: true });
    cy.get(cell(8, 4)).click({ force: true });
    cy.get(cell(8, 4)).find('.slick-drag-replace-handle').trigger('mousedown', { which: 1, force: true });
    cy.get(cell(9, 4)).trigger('mousemove', 'bottomRight').trigger('mouseup', 'bottomRight', { which: 1, force: true });
    cy.contains('.grid48 .slick-row', 'Apples').find('.slick-cell').eq(4).should('contain', '$3.10');
    cy.get('[data-test="clear-grouping-btn"]').click();
    cy.get(cell(1, 4)).should('contain', '$3.10');
  });

  it('should preserve grouped range edits across collapse, expand and ungroup', () => {
    cy.reload();
    cy.get('[data-test="group-by-btn"]').click();
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(4).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUM(C2:C10){enter}', { force: true });
    // Six taxable records plus Oranges and Apples; group headers and totals are excluded.
    cy.contains('.grid48 .slick-row', 'Oranges')
      .find('.slick-cell')
      .eq(4)
      .invoke('text')
      .then((value) => {
        cy.get('.grid48 .slick-group-toggle.expanded').first().click();
        cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(4).should('have.text', value).dblclick();
        cy.get('.formula-editor-input').invoke('text').should('contain', 'REFRANGE(');
        cy.get('.formula-editor-input').type('{enter}', { force: true });
        cy.get('.grid48 .slick-group-toggle.collapsed').first().click();
        cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(4).should('have.text', value);
        cy.get('[data-test="clear-grouping-btn"]').click();
        cy.get(cell(0, 4)).should('have.text', value);
      });
  });

  it('should drag-fill grouped range formulas with absolute references', () => {
    cy.reload();
    cy.get('[data-test="group-by-btn"]').click();
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(4).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUM($C$9:C10){enter}', { force: true });
    cy.get(cell(8, 4)).click({ force: true });
    cy.get(cell(8, 4)).find('.slick-drag-replace-handle').trigger('mousedown', { which: 1, force: true });
    cy.get(cell(9, 4)).trigger('mousemove', 'bottomRight').trigger('mouseup', 'bottomRight', { which: 1, force: true });
    cy.contains('.grid48 .slick-row', 'Apples').find('.slick-cell').eq(4).should('contain', '$4.00').dblclick();
    cy.get('.formula-editor-input').should('have.text', '=SUM($C$9:C11)').type('{enter}', { force: true });
    cy.get('[data-test="clear-grouping-btn"]').click();
    cy.get(cell(1, 4)).should('contain', '$4.00');
  });

  it('should refresh grouping formatter totals using edited formula values', () => {
    cy.reload();
    cy.get('[data-test="group-by-btn"]').click();
    cy.get('.grid48 .slick-group-totals')
      .first()
      .find('.slick-cell')
      .eq(4)
      .invoke('text')
      .then((text) => {
        const previous = Number(text.replace(/[^0-9.-]/g, ''));
        cy.contains('.grid48 .slick-row', 'Honeycomb Cereals').find('.slick-cell').eq(4).dblclick();
        cy.get('.formula-editor-input').click().type('{selectall}=100{enter}', { force: true });
        cy.get('.grid48 .slick-group-totals')
          .first()
          .find('.slick-cell')
          .eq(4)
          .should('contain', (previous + 100 - 9.1).toFixed(2));
      });
  });

  it('should infer a numeric series when drag-filling static values in a formula column', () => {
    cy.reload();

    // Replace the first two Sub-Total formulas with the numeric seed values 10 and 20.
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}10{enter}', { force: true });
    cy.get(cell(1, 4)).dblclick();
    cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}20{enter}', { force: true });

    // Select the two seed cells with the cell-range selector, then drag the fill handle down through row 4.
    cy.get(cell(0, 4)).click({ force: true });
    cy.get(cell(0, 4)).trigger('mousedown', { which: 1, force: true });
    cy.get(cell(1, 4)).trigger('mousemove', 'bottomRight').trigger('mouseup', 'bottomRight', { which: 1, force: true });
    cy.get('.grid48 .slick-cell.selected').should('have.length', 2);
    cy.get(cell(1, 4)).find('.slick-drag-replace-handle').trigger('mousedown', { which: 1, force: true });
    cy.get(cell(3, 4)).trigger('mousemove', 'bottomRight').trigger('mouseup', 'bottomRight', { which: 1, force: true });

    cy.get(cell(2, 4)).should('contain', '$30.00');
    cy.get(cell(3, 4)).should('contain', '$40.00');
  });

  it('should preserve formula results after column reorder and hiding a referenced source column', () => {
    cy.reload();

    const reorderedTitles = ['#', 'Name', 'Quantity', 'Sub-Total', 'Price', 'Taxable', 'Taxes', 'Total', 'Custom Sum'];
    cy.get('.grid48 .slick-header-columns .slick-header-column:nth(2)')
      .contains('Price')
      .drag('.grid48 .slick-header-columns .slick-header-column:nth(4)');
    cy.get('.grid48 .slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(reorderedTitles[index]));

    // Price and Quantity moved, but the stable formula still calculates the same Sub-Total.
    cy.get(cell(0, 2)).should('contain', '4');
    cy.get(cell(0, 3)).should('contain', '$8.88');
    cy.get(cell(0, 4)).should('contain', '$2.22');

    // Hide Price through the column picker and verify formulas can still evaluate at runtime.
    cy.get('.grid48 .slick-header-column').contains('Price').trigger('mouseover').trigger('contextmenu').invoke('show');
    cy.get('.slick-column-picker:visible input[data-columnid="price"]').parent('.icon-checkbox-container').click({ force: true });
    cy.get('.slick-column-picker:visible .close').click({ force: true });

    cy.get('.grid48 .slick-header-columns .slick-header-column').should('have.length', 8);
    cy.get(cell(0, 3)).should('contain', '$8.88');
    cy.get(cell(0, 6)).should('contain', '$8.88');

    // Letters keep the hidden Price slot: Quantity is C, Sub-Total is D, and Price remains E.
    cy.get(cell(0, 3)).dblclick();
    cy.get('.formula-editor-input').should('have.text', '=E1*C1');
    cy.get('.grid48 .slick-header-column').contains('Quantity').find('.excel-col-prefix').should('have.text', 'C');
    cy.get('.grid48 .slick-header-column').contains('Sub-Total').find('.excel-col-prefix').should('have.text', 'D');
    cy.get(cell(0, 2)).should('have.class', 'formula-cell-color-2');
    cy.get('.formula-editor-input').click().type('{selectall}=', { force: true });
    cy.get(cell(0, 2)).click();
    cy.get('.formula-editor-input').should('have.text', '=C1').type('{enter}', { force: true });
    cy.get(cell(0, 3)).should('contain', '$4.00');
  });

  it('should restore formula snapshots alongside grid state after recreating the grid', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=$C$1*D1{enter}', { force: true });
    cy.get('.grid48 .slick-header-column').contains('Price').trigger('mouseover').trigger('contextmenu').invoke('show');
    cy.get('.slick-column-picker:visible input[data-columnid="price"]').parent('.icon-checkbox-container').click({ force: true });
    cy.get('.slick-column-picker:visible .close').click({ force: true });
    cy.get('[data-test="save-formula-state-btn"]').click();
    cy.reload();
    cy.get('.grid48 .slick-header-column').should('have.length', 9);
    cy.get('[data-test="restore-formula-state-btn"]').click();
    cy.get('.grid48 .slick-header-column').should('have.length', 8);
    cy.get('[data-test="group-by-btn"]').click();
    cy.contains('.grid48 .slick-row', 'Oranges').find('.slick-cell').eq(3).should('contain', '$8.88').dblclick();
    cy.get('.formula-editor-input').should('have.text', '=$C$9*D9').type('{enter}', { force: true });
    cy.get(cell(8, 3)).click({ force: true });
    cy.get(cell(8, 3)).find('.slick-drag-replace-handle').trigger('mousedown', { which: 1, force: true });
    cy.get(cell(9, 3)).trigger('mousemove', 'bottomRight').trigger('mouseup', 'bottomRight', { which: 1, force: true });
    cy.contains('.grid48 .slick-row', 'Apples').find('.slick-cell').eq(3).should('contain', '$6.66').dblclick();
    cy.get('.formula-editor-input').should('have.text', '=$C$9*D10').type('{enter}', { force: true });
  });

  it('should fill formulas in the correct column after hiding an earlier column', () => {
    cy.reload();
    cy.get('.grid48 .slick-header-column').contains('Price').trigger('mouseover').trigger('contextmenu').invoke('show');
    cy.get('.slick-column-picker:visible input[data-columnid="price"]').parent('.icon-checkbox-container').click({ force: true });
    cy.get('.slick-column-picker:visible .close').click({ force: true });
    cy.get(cell(0, 3)).click({ force: true });
    cy.get(cell(0, 3)).find('.slick-drag-replace-handle').trigger('mousedown', { which: 1, force: true });
    cy.get(cell(1, 3)).trigger('mousemove', 'bottomRight').trigger('mouseup', 'bottomRight', { which: 1, force: true });
    cy.get(cell(1, 3)).should('contain', '$4.65').dblclick();
    cy.get('.formula-editor-input').should('have.text', '=C2*D2').type('{enter}', { force: true });
    cy.get(cell(1, 5)).should('contain', '$0.00');
  });

  it('should export hidden dependencies only when includeHidden is enabled', () => {
    cy.reload();
    cy.get('.grid48 .slick-header-column').contains('Price').trigger('mouseover').trigger('contextmenu').invoke('show');
    cy.get('.slick-column-picker:visible input[data-columnid="price"]').parent('.icon-checkbox-container').click({ force: true });
    cy.get('.slick-column-picker:visible .close').click({ force: true });
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 2 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[1][2]).to.equal('#REF!*B3');
    });
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-hidden-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 2 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[1][3]).to.equal('B3*C3');
      expect(xlsx.dataRows[1].slice(0, 3)).to.deep.equal(['Oranges', '2.22', '4']);
    });
    cy.get('[data-test="group-by-btn"]').click();
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 15 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[2][3]).to.equal('#REF!');
    });
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-hidden-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 15 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[2][4]).to.equal('C4*D4');
      expect(xlsx.dataRows[2].slice(1, 4)).to.deep.equal(['Honeycomb Cereals', '4.55', '2']);
    });
    cy.get('[data-test="clear-grouping-btn"]').click();
    cy.get('.grid48 .slick-header-column').contains('Quantity').trigger('mouseover').trigger('contextmenu').invoke('show');
    cy.get('.slick-column-picker:visible input[data-columnid="price"]').parent('.icon-checkbox-container').click({ force: true });
    cy.get('.slick-column-picker:visible .close').click({ force: true });
    cy.get(cell(0, 4)).should('contain', '$8.88').dblclick();
    cy.get('.formula-editor-input').should('have.text', '=C1*D1').type('{enter}', { force: true });
  });

  it('should export reordered formulas with the correct Excel row offset', () => {
    cy.reload();
    const downloadsFolder = Cypress.config('downloadsFolder');

    cy.get('.grid48 .slick-header-columns .slick-header-column:nth(2)')
      .contains('Price')
      .drag('.grid48 .slick-header-columns .slick-header-column:nth(4)');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();

    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 2 }).then((xlsx: any) => {
      // formulaRows[0] is the header row; the custom title row plus the header place
      // the first dataset row on Excel row 3, which is formulaRows[1].
      // The # column is excluded from Excel, and Price is dropped after
      // Sub-Total by the drag operation. The exported columns are Name (A),
      // Quantity (B), Sub-Total (C), Price (D), Taxable (E), Taxes (F),
      // Total (G), and Custom Sum (H).
      expect(xlsx.formulaRows[1][2]).to.equal('D3*B3');
      expect(xlsx.formulaRows[1][6]).to.equal('C3+F3');
    });
  });

  it('should export grouped single-cell formulas at their worksheet positions', () => {
    cy.reload();
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.get('[data-test="group-by-btn"]').click();
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 15 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[2][4]).to.equal('C4*D4');
      expect(xlsx.formulaRows[9][4]).to.equal('C11*D11');
    });
  });

  it('should export contiguous and disjoint grouped ranges without including structural rows', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUM(C1:C2){enter}', { force: true });
    cy.get(cell(1, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUM(C1:C3){enter}', { force: true });
    cy.get(cell(2, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=COUNTA(C1:C3){enter}', { force: true });
    cy.get('[data-test="group-by-btn"]').click();
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 15 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[9][4]).to.equal('SUM(C11:C12)');
      expect(xlsx.formulaRows[10][4]).to.equal("SUM('Formula References'!$A$1:$A$3)");
      expect(xlsx.formulaRows[2][4]).to.equal("(SUM('Formula References'!$A$4:$A$6))");
      expect(xlsx.additionalSheetFormulaRows[0].slice(0, 3).map((row: string[]) => row[0])).to.deep.equal(
        [11, 12, 4].map((row) => `IF(ISBLANK('Grocery List Formula Service'!C${row}),"",'Grocery List Formula Service'!C${row})`)
      );
      expect(xlsx.additionalSheetFormulaRows[0].slice(3, 6).map((row: string[]) => row[0])).to.deep.equal(
        [11, 12, 4].map((row) => `--NOT(ISBLANK('Grocery List Formula Service'!C${row}))`)
      );
    });
  });

  it('should export grouped COUNTA with blank and empty-formula source cells', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=""{enter}', { force: true });
    cy.get(cell(1, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}{backspace}{enter}', { force: true });
    cy.get(cell(2, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=5{enter}', { force: true });
    cy.get(cell(0, 6)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=COUNTBLANK(E1:E3){enter}', { force: true });
    cy.get(cell(0, 7)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=COUNTA(E1:E3){enter}', { force: true });
    cy.get(cell(0, 8)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=AVERAGE(E1:E3){enter}', { force: true });
    cy.get(cell(0, 6)).should('contain', '$2.00');
    cy.get(cell(0, 7)).should('contain', '$2.00');
    cy.get(cell(0, 8)).should('contain', '$5.00');
    cy.get('[data-test="group-by-btn"]').click();
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 15 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[9][4]).to.equal('""');
      expect(xlsx.formulaRows[10][4]).to.be.oneOf(['', null, undefined]);
      expect(xlsx.formulaRows[2][4]).to.equal('5');
      expect(xlsx.formulaRows[9][6]).to.equal("COUNTBLANK('Formula References'!$A$1:$A$3)");
      expect(xlsx.formulaRows[9][7]).to.equal("(SUM('Formula References'!$A$4:$A$6))");
      expect(xlsx.formulaRows[9][8]).to.equal("AVERAGE('Formula References'!$A$1:$A$3)");
      expect(xlsx.additionalSheetFormulaRows[0].slice(3, 6).map((row: string[]) => row[0])).to.deep.equal(
        [11, 12, 4].map((row) => `--NOT(ISBLANK('Grocery List Formula Service'!E${row}))`)
      );
    });
  });

  it('should preserve wildcard criteria in disjoint grouped Excel ranges', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUMIF(B1:B3,"a*",C1:C3){enter}', { force: true });
    cy.get(cell(0, 7)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=COUNTIF(B1:B3,"A*"){enter}', { force: true });
    cy.get('[data-test="group-by-btn"]').click();
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 15 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[9][4]).to.equal("SUMIF('Formula References'!$A$1:$A$3,\"a*\",'Formula References'!$A$4:$A$6)");
      expect(xlsx.formulaRows[9][7]).to.equal('COUNTIF(\'Formula References\'!$A$1:$A$3,"A*")');
    });
  });

  it('should preserve SUMPRODUCT dimensions in grouped Excel helper ranges', () => {
    cy.reload();
    cy.get(cell(0, 4)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUMPRODUCT(C1:D3,C1:D3){enter}', { force: true });
    cy.get(cell(0, 4)).should('contain', '$57.03');
    cy.get(cell(0, 7)).dblclick();
    cy.get('.formula-editor-input').click().type('{selectall}=SUMPRODUCT(C1:D2,C1:C4){enter}', { force: true });
    cy.get(cell(0, 7)).should('contain', '#VALUE!');
    cy.get('[data-test="group-by-btn"]').click();
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('clearXlsxDownloads', { downloadsFolder });
    cy.get('[data-test="export-excel-btn"]').click();
    cy.task('readLatestXlsxExport', { downloadsFolder, timeoutMs: 15000, maxDataRows: 15 }).then((xlsx: any) => {
      expect(xlsx.formulaRows[9][4]).to.equal("SUMPRODUCT('Formula References'!$A$1:$B$3,'Formula References'!$A$1:$B$3)");
      expect(xlsx.additionalSheetFormulaRows[0].slice(0, 3)).to.deep.equal(
        [11, 12, 4].map((row) =>
          ['C', 'D'].map((col) => `IF(ISBLANK('Grocery List Formula Service'!${col}${row}),"",'Grocery List Formula Service'!${col}${row})`)
        )
      );
    });
  });

  it('should switch formula reference and column-prefix colors with the grid theme', () => {
    cy.reload();

    const checkFormulaColors = (tokenColor: string, cellBackground: string, prefixBackground: string) => {
      cy.get(cell(0, 4)).dblclick();
      cy.get('.formula-editor-input').should('be.visible').click().type('{selectall}=C1*D1', { force: true });
      cy.get('.formula-token-color-1').should('have.css', 'color', tokenColor);
      cy.get(cell(0, 2)).should('have.class', 'formula-cell-color-1').and('have.css', 'background-color', cellBackground);
      cy.get(cell(0, 2)).should('have.css', 'box-shadow').and('contain', tokenColor);
      cy.get('.grid48 .excel-col-prefix').first().should('have.css', 'background-color', prefixBackground);
      cy.get('.formula-editor-input').type('{esc}', { force: true });
    };

    checkFormulaColors('rgb(50, 105, 198)', 'rgba(50, 105, 198, 0.05)', 'rgb(219, 234, 254)');
    cy.get('[data-test="toggle-dark-mode"]').click();
    checkFormulaColors('rgb(138, 180, 255)', 'rgba(138, 180, 255, 0.2)', 'rgb(30, 58, 138)');
    cy.get('[data-test="toggle-dark-mode"]').click();
    checkFormulaColors('rgb(50, 105, 198)', 'rgba(50, 105, 198, 0.05)', 'rgb(219, 234, 254)');
  });
});
