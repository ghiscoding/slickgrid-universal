describe('Example 14 - Column Span & Header Grouping', () => {
  // NOTE:  everywhere there's a * 2 is because we have a top+bottom (frozen rows) containers even after Unfreeze Columns/Rows
  const fullPreTitles = ['', 'Common Factor', 'Period', 'Analysis'];
  const fullTitles = ['#', 'Title', 'Duration', 'Start', 'Finish', '% Complete', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example14`);
    cy.get('h2').should('contain', 'Example 14: Column Span & Header Grouping');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid', () => {
    cy.get('#grid2')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('#grid2')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should have a frozen grid on page load with 3 columns on the left and 4 columns on the right', () => {
    cy.get('#grid2').find(`[data-row=0]`).should('have.length', 2);
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0]`).children().should('have.length', 3);
    cy.get('#grid2').find(`.grid-canvas-right > [data-row=0]`).children().should('have.length', 4);

    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0]> .slick-cell:nth(0)`).should('contain', '0');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0]> .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0]> .slick-cell:nth(2)`).should('contain', '5 days');

    cy.get('#grid2').find(`.grid-canvas-right > [data-row=0]> .slick-cell:nth(0)`).should('contain', '01/01/2009');
    cy.get('#grid2').find(`.grid-canvas-right > [data-row=0]> .slick-cell:nth(1)`).should('contain', '01/05/2009');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid again', () => {
    cy.get('#grid2')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('#grid2')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the "Remove Frozen Columns" button to switch to a regular grid without frozen columns and expect 7 columns on the left container', () => {
    cy.get('[data-test="remove-frozen-column-button"]').click();

    cy.get('#grid2').find(`[data-row=0]`).should('have.length', 1);
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0]`).children().should('have.length', 7);

    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(0)`).should('contain', '0');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(2)`).should('contain', '5 days');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(3)`).should('contain', '01/01/2009');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(4)`).should('contain', '01/05/2009');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid once again', () => {
    cy.get('#grid2')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('#grid2')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the "Set 3 Frozen Columns" button to switch frozen columns grid and expect 3 frozen columns on the left and 4 columns on the right', () => {
    cy.contains('Set 3 Frozen Columns').click({ force: true });

    cy.get('#grid2').find(`[data-row=0]`).should('have.length', 2);
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0]`).children().should('have.length', 3);
    cy.get('#grid2').find(`.grid-canvas-right > [data-row=0]`).children().should('have.length', 4);

    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(0)`).should('contain', '0');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(2)`).should('contain', '5 days');

    cy.get('#grid2').find(`.grid-canvas-right > [data-row=0] > .slick-cell:nth(0)`).should('contain', '01/01/2009');
    cy.get('#grid2').find(`.grid-canvas-right > [data-row=0] > .slick-cell:nth(1)`).should('contain', '01/05/2009');
  });

  it('should have still exact Column Pre-Header & Column Header Titles in the grid', () => {
    cy.get('#grid2')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('#grid2')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the Grid Menu command "Unfreeze Columns/Rows" to switch to a regular grid without frozen columns and expect 7 columns on the left container', () => {
    cy.get('#grid2').find('button.slick-grid-menu-button').click({ force: true });

    cy.contains('Unfreeze Columns/Rows').click({ force: true });

    cy.get('#grid2').find(`[data-row=0]`).should('have.length', 1);
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0]`).children().should('have.length', 7);

    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(0)`).should('contain', '0');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(2)`).should('contain', '5 days');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(3)`).should('contain', '01/01/2009');
    cy.get('#grid2').find(`.grid-canvas-left > [data-row=0] > .slick-cell:nth(4)`).should('contain', '01/05/2009');
  });

  it('should reapply 3 frozen columns on 2nd grid', () => {
    cy.contains('Set 3 Frozen Columns').click({ force: true });

    cy.get('#grid2')
      .find('.slick-pane-left .slick-header.slick-header-left .slick-header-columns .slick-header-column')
      .should('have.length', 3);

    cy.get('#grid2')
      .find('.slick-pane-right .slick-header.slick-header-right .slick-header-columns .slick-header-column')
      .should('have.length', 4);
  });

  it('should be able to "Unfreeze Columns" from header menu', () => {
    cy.get('#grid2')
      .find('.slick-pane-left .slick-header-columns .slick-header-column[role="columnheader"]:nth(2)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();

    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(1)')
      .children('.slick-menu-content')
      .should('contain', 'Unfreeze Columns')
      .click();

    cy.get('#grid2')
      .find('.slick-pane-left .slick-header.slick-header-left .slick-header-columns .slick-header-column')
      .should('have.length', 7);
  });

  it('should be able to "Freeze Columns" back from header menu', () => {
    cy.get('#grid2')
      .find('.slick-pane-left .slick-header-columns .slick-header-column[role="columnheader"]:nth(2)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();

    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(1)')
      .children('.slick-menu-content')
      .should('contain', 'Freeze Columns')
      .click();

    cy.get('#grid2')
      .find('.slick-pane-left .slick-header.slick-header-left .slick-header-columns .slick-header-column')
      .should('have.length', 3);

    cy.get('#grid2')
      .find('.slick-pane-right .slick-header.slick-header-right .slick-header-columns .slick-header-column')
      .should('have.length', 4);
  });

  describe('Basic Key Navigations', () => {
    it('should remove any freezing', () => {
      cy.get('[data-test="remove-frozen-column-button"]').click();

      cy.get('#grid2')
        .find('.slick-pane-left .slick-header.slick-header-left .slick-header-columns .slick-header-column')
        .should('have.length', 7);
    });

    it('should start at Task 2 on Duration colspan 5 days and type "PageDown" key 2x times and "PageUp" twice and be back to Task 1 with colspan of 3', () => {
      cy.get('[data-row=1] > .slick-cell.l1.r3').as('active_cell').click();
      cy.get('@active_cell').type('{pagedown}{pagedown}{pageup}{pageup}');
      cy.get('[data-row=1] > .slick-cell.l1.r3.active').should('have.length', 1);
    });

    it('should start at Task 2 on Duration colspan 5 days and type "PageDown" key 2x times and "PageUp" 3x times and be on Task 0 with full colspan', () => {
      cy.get('[data-row=1] > .slick-cell.l1.r3').as('active_cell').click();
      cy.get('@active_cell').type('{pagedown}{pagedown}{pageup}{pageup}{pageup}');
      cy.get('[data-row=0] > .slick-cell.l0.r5.active').should('have.length', 1);
    });

    it('should start at Task 1 on Duration colspan 5 days and type "ArrowDown" key once and be on Task 2 with full colspan', () => {
      cy.get('[data-row=1] > .slick-cell.l1.r3').as('active_cell').click();
      cy.get('@active_cell').type('{downarrow}');
      cy.get('[data-row=2] > .slick-cell.l0.r5.active').should('have.length', 1);
    });

    it('should start at Task 1 on Duration colspan 5 days and type "ArrowDown" key 2x times and be on Task 1 with colspan of 3', () => {
      cy.get('[data-row=1] > .slick-cell.l1.r3').as('active_cell').click();
      cy.get('@active_cell').type('{downarrow}{downarrow}');
      cy.get('[data-row=3] > .slick-cell.l1.r3.active').should('have.length', 1);
    });

    it('should start at Task 1 on Duration colspan 5 days and type "ArrowDown" key 2x times, then "ArrowUp" key 2x times and be back on Task 1 with colspan of 3', () => {
      cy.get('[data-row=1] > .slick-cell.l1.r3').as('active_cell').click();
      cy.get('@active_cell').type('{downarrow}{downarrow}{uparrow}{uparrow}');
      cy.get('[data-row=1] > .slick-cell.l1.r3.active').should('have.length', 1);
    });
  });

  describe('Colspan checks on 1st grid', () => {
    it('should hide Finish column and still expect "5 days" to spread accross 3 column', () => {
      cy.get('#grid1').find('[data-row=1] .slick-cell.l0.r0').should('contain', 'Task 1');
      cy.get('#grid1').find('[data-row=2] .slick-cell.l0.r5').should('contain', 'Task 2');
      cy.get('#grid1').find('[data-row=1] .slick-cell.l1.r3').should('contain', '5 days');
      cy.get('#grid1').find('[data-row=1] .slick-cell.l4.r4').contains(/\d+$/);
      cy.get('#grid1')
        .find('[data-row=1] .slick-cell.l5.r5')
        .contains(/(true|false)+$/);

      cy.get('#grid1')
        .find('.slick-pane-left .slick-header-columns .slick-header-column[role="columnheader"]:nth(3)')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();

      cy.get('.slick-header-menu .slick-menu-command-list')
        .should('be.visible')
        .children('.slick-menu-item:nth-of-type(3)')
        .children('.slick-menu-content')
        .should('contain', 'Hide Column')
        .click();

      cy.get('#grid1').find('[data-row=1] .slick-cell.l0.r0').should('contain', 'Task 1');
      cy.get('#grid1').find('[data-row=2] .slick-cell.l0.r4').should('contain', 'Task 2');
      cy.get('#grid1').find('[data-row=1] .slick-cell.l1.r3').should('contain', '5 days');
      cy.get('#grid1')
        .find('[data-row=1] .slick-cell.l4.r4')
        .contains(/(true|false)+$/);
    });

    it('should have Column Pre-Header & Column Header Titles without the Finish column in the 1st grid', () => {
      const newPreTitles = ['Common Factor', 'Period', 'Analysis'];
      const newHeaderTitles = ['Title', 'Duration', 'Start', '% Complete', 'Effort Driven'];
      cy.get('#grid1')
        .find('.slick-header-columns:nth(0)')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(newPreTitles[index]));

      cy.get('#grid1')
        .find('.slick-header-columns:nth(1)')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(newHeaderTitles[index]));
    });

    it('should open Grid Menu and show again Finish column', () => {
      cy.get('#grid1').find('button.slick-grid-menu-button').click({ force: true });
      cy.get('#grid1')
        .get('.slick-grid-menu:visible')
        .find('.slick-column-picker-list')
        .children('li:visible:nth(3)')
        .children('label')
        .should('contain', 'Period - Finish')
        .click({ force: true });

      cy.get('#grid1').find('[data-row=1] .slick-cell.l0.r0').should('contain', 'Task 1');
      cy.get('#grid1').find('[data-row=2] .slick-cell.l0.r5').should('contain', 'Task 2');
      cy.get('#grid1').find('[data-row=1] .slick-cell.l1.r3').should('contain', '5 days');
      cy.get('#grid1').find('[data-row=1] .slick-cell.l4.r4').contains(/\d+$/);
      cy.get('#grid1')
        .find('[data-row=1] .slick-cell.l5.r5')
        .contains(/(true|false)+$/);
      cy.get('#grid1').get('.slick-grid-menu:visible').find('.close').click({ force: true });
    });

    it('should have back original Column Pre-Header & Column Header Titles without the Finish column in the 1st grid', () => {
      const newPreTitles = ['Common Factor', 'Period', 'Analysis'];
      const newHeaderTitles = ['Title', 'Duration', 'Start', 'Finish', '% Complete', 'Effort Driven'];
      cy.get('#grid1')
        .find('.slick-header-columns:nth(0)')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(newPreTitles[index]));

      cy.get('#grid1')
        .find('.slick-header-columns:nth(1)')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(newHeaderTitles[index]));
    });
  });

  describe('First Grid - Key Navigation', () => {
    it('should start at Task 1 and expect "Duration" to have colspan of 3 and show "% Complete" and "Effort Driven"', () => {
      cy.get('#grid1 [data-row=1] > .slick-cell.l0.r0').should('contain', 'Task 1').click().type('{rightArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l1.r3').should('have.class', 'active').should('contain', '5 days').type('{rightArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l4.r4').should('have.class', 'active').contains(/\d+$/).type('{rightArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l5.r5')
        .should('have.class', 'active')
        .contains(/(true|false)+$/);

      cy.get('#grid1 [data-row=1] > .slick-cell.l5.r5.active').type('{leftArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l4.r4').should('have.class', 'active').contains(/\d+$/).type('{leftArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l1.r3').should('have.class', 'active').should('contain', '5 days');
      cy.get('#grid1 [data-row=1] > .slick-cell.l0.r0').should('contain', 'Task 1');
    });

    it('should hide "Finish" column and start at Task 1 and expect "Duration" to have colspan of 3 and show "% Complete" and "Effort Driven"', () => {
      cy.get('#grid1').find('.slick-header-column').first().trigger('mouseover').trigger('contextmenu').invoke('show');
      cy.get('.slick-column-picker')
        .find('.slick-column-picker-list')
        .children('li:nth-of-type(4)')
        .children('label')
        .should('contain', 'Period - Finish')
        .click();

      cy.get('#grid1 [data-row=1] > .slick-cell.l0.r0').should('contain', 'Task 1').click().type('{rightArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l1.r3').should('have.class', 'active').should('contain', '5 days').type('{rightArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l4.r4')
        .should('have.class', 'active')
        .contains(/(true|false)+$/);

      cy.get('#grid1 [data-row=1] > .slick-cell.l4.r4.active').type('{leftArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l1.r3').should('have.class', 'active').should('contain', '5 days').type('{leftArrow}');
      cy.get('#grid1 [data-row=1] > .slick-cell.l0.r0').should('have.class', 'active');
      cy.get('#grid1 [data-row=1] > .slick-cell.l0.r0').should('contain', 'Task 1');
    });
  });
});
