describe('Example 49 - Spreadsheet Drag-Fill', () => {
  const titles = [
    '',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'AA',
    'AB',
    'AC',
    'AD',
    'AE',
    'AF',
    'AG',
    'AH',
    'AI',
    'AJ',
    'AK',
  ];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example49`);
    cy.get('h2').should('contain', 'Example 49: Spreadsheet Drag-Fill');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.slick-header-columns')
      .children()
      .each(($child, index) => {
        if (index > 0 && index < titles.length) {
          expect($child.text()).to.eq(titles[index]);
        }
      });
  });

  it('should click on B1 cell, type "1" and then replicate the same on C1 and D1 by increasing the value by +1 (1,2,3)', () => {
    cy.get('.slick-row[data-row="1"] .slick-cell.l2.r2').as('cellB1');
    cy.get('@cellB1').click().type('1').type('{enter}');
    cy.get('@cellB1').should('contain', '1');

    cy.get('.slick-row[data-row="1"] .slick-cell.l3.r3').as('cellC1');
    cy.get('@cellC1').click().type('2').type('{enter}');
    cy.get('@cellC1').should('contain', '2');

    cy.get('.slick-row[data-row="1"] .slick-cell.l4.r4').as('cellD1');
    cy.get('@cellD1').click().type('3').type('{enter}');
    cy.get('@cellD1').should('contain', '3');
  });

  it('should click on B2 cell, type "4" and then replicate the same on C2 and D2 by increasing the value by +1 again (4,5,6)', () => {
    cy.get('.slick-row[data-row="2"] .slick-cell.l2.r2').as('cellB2');
    cy.get('@cellB2').click().type('4').type('{enter}');
    cy.get('@cellB2').should('contain', '4');

    cy.get('.slick-row[data-row="2"] .slick-cell.l3.r3').as('cellC2');
    cy.get('@cellC2').click().type('5').type('{enter}');
    cy.get('@cellC2').should('contain', '5');

    cy.get('.slick-row[data-row="2"] .slick-cell.l4.r4').as('cellD2');
    cy.get('@cellD2').click().type('6').type('{enter}');
    cy.get('@cellD2').should('contain', '6');
  });

  it('should click back on B1 cell and expand the cell selections to include all 6 modified cells', () => {
    cy.get('.slick-row[data-row="1"] .slick-cell.l2.r2').as('B1');
    cy.get('@B1').should('contain', '1');
    cy.get('@B1')
      .click()
      .type('{esc}') // make sure to click Escape to allow dragging
      .should('have.class', 'selected');
    cy.get('.slick-cell.selected').should('have.length', 1);

    cy.get('@B1').trigger('mousedown', { which: 1, force: true }).trigger('mousemove', 'bottomRight');

    cy.get('.slick-row[data-row="2"] .slick-cell.l4.r4')
      .trigger('mousemove', 'bottomRight')
      .trigger('mouseup', 'bottomRight', { which: 1, force: true });

    cy.get('.slick-cell.selected').should('have.length', 6);
  });

  it('should now be able to drag from bottom right corner to expand the cell selections to include an extra row and an extra column', () => {
    cy.get('.slick-row[data-row="2"] .slick-cell.l4.r4').as('D2');
    cy.get('@D2').find('.slick-drag-replace-handle').trigger('mousedown', { which: 1, force: true });

    cy.get('.slick-row[data-row="4"] .slick-cell.l6.r6')
      .trigger('mousemove', 'bottomRight')
      .trigger('mouseup', 'bottomRight', { which: 1, force: true });

    cy.get('.slick-cell.selected').should('have.length', 20);
  });

  it('should expect new cell selections with replicated values', () => {
    cy.get('.slick-cell.selected').should('have.length', 20);

    const filledValues = [
      [1, 2, 3, 1, 2],
      [4, 5, 6, 4, 5],
      [1, 2, 3, 1, 2],
      [4, 5, 6, 4, 5],
    ];

    for (let i = 0; i < filledValues.length; i++) {
      for (let j = 0; j < filledValues[i].length; j++) {
        cy.get(`.slick-row[data-row="${i + 1}"] .slick-cell.l${j + 2}.r${j + 2}`).should('contain', filledValues[i][j]);
      }
    }
  });
});
