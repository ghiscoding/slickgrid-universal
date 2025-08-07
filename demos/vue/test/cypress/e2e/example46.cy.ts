describe('Example 46 - Tree Data with Lazy Loading', () => {
  const GRID_ROW_HEIGHT = 35;
  const titles = ['', 'Chapter', 'Label', 'Description', 'Page Number', 'Last Date Modified'];
  const defaultGridPreset = ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6', 'Chapter X'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example46`);
    cy.get('h2').should('contain', 'Example 46: Tree Data with Lazy Loading');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('#grid46')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(titles[index]));
  });

  it('should expect all folders to be collapsed and expect 6 initial items (6x chapters with children) in the grid', () => {
    cy.get('.slick-group-toggle.collapsed').should('have.length', 6);

    cy.get('.right-footer .item-count').contains('7');
    cy.get('.right-footer .total-count').contains('7');

    defaultGridPreset.forEach((_colName, rowIdx) => {
      if (rowIdx < defaultGridPreset.length - 1) {
        cy.get(`#grid46 [style="transform: translateY(${GRID_ROW_HEIGHT * rowIdx}px);"] > .slick-cell:nth(1)`).should(
          'contain',
          defaultGridPreset[rowIdx]
        );
      }
    });
  });

  it('should change backend simulation to 20ms', () => {
    cy.get('[data-test="server-delay"]').clear().type('20');
  });

  it('should click on "Chapter 1" and expect 3 sub-chapters underneath and now have 10 items in the grid', () => {
    cy.get('div[data-row="0"] > .slick-cell:nth(1) .slick-tree-title').contains('Chapter 1');
    cy.get('div[data-row="0"] > .slick-cell:nth(1) .slick-group-toggle.collapsed').click();

    cy.get('.slick-group-toggle.collapsed').should('have.length', 8 - 1); // -1 for expanded Chapter
    cy.get('.right-footer .item-count').contains('10');
    cy.get('.right-footer .total-count').contains('10');

    const defaultGridWithSubChapter1 = [
      'Chapter 1',
      'Chapter 1.1',
      'Chapter 1.2',
      'Chapter 1.3',
      'Chapter 2',
      'Chapter 3',
      'Chapter 4',
      'Chapter 5',
      'Chapter 6',
      'Chapter X',
    ];
    defaultGridWithSubChapter1.forEach((_colName, rowIdx) => {
      if (rowIdx < defaultGridWithSubChapter1.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', defaultGridWithSubChapter1[rowIdx]);
      }
    });
  });

  it('should display an error message and keep group collapsed with an error when lazy load fails', () => {
    cy.get('div[data-row="9"] > .slick-cell:nth(1) .slick-tree-title').contains('Chapter X');
    cy.get('div[data-row="9"] > .slick-cell:nth(1) .slick-group-toggle.collapsed').click();
    cy.get('.slick-tree-load-fail').should('exist');
    cy.get('.toast').should('contain', 'Lazy fetching failed');
  });

  it('should display an error message again when clicked multiple times', () => {
    cy.get('div[data-row="9"] > .slick-cell:nth(1) .slick-group-toggle.load-fail').click();
    cy.get('.slick-tree-load-fail').should('exist');
    cy.get('.toast').should('contain', 'Lazy fetching failed');

    cy.get('div[data-row="9"] > .slick-cell:nth(1) .slick-group-toggle.load-fail').click();
    cy.get('.slick-tree-load-fail').should('exist');
    cy.get('.toast').should('contain', 'Lazy fetching failed');
  });

  it('should click on "Chapter 1.2" and expect 3 sub-chapters underneath and now have 10 items in the grid', () => {
    cy.get('div[data-row="2"] > .slick-cell:nth(1) .slick-tree-title').contains('Chapter 1.2');
    cy.get('div[data-row="2"] > .slick-cell:nth(1) .slick-group-toggle.collapsed').click();

    cy.get('.slick-group-toggle.collapsed').should('have.length', 8);
    cy.get('.right-footer .item-count').contains('13');
    cy.get('.right-footer .total-count').contains('13');

    const defaultGridWithSubChapter1 = [
      'Chapter 1',
      'Chapter 1.1',
      'Chapter 1.2',
      'Chapter 1.2.1',
      'Chapter 1.2.2',
      'Chapter 1.2.3',
      'Chapter 1.3',
      'Chapter 2',
      'Chapter 3',
      'Chapter 4',
      'Chapter 5',
      'Chapter 6',
      'Chapter X',
    ];
    defaultGridWithSubChapter1.forEach((_colName, rowIdx) => {
      if (rowIdx < defaultGridWithSubChapter1.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', defaultGridWithSubChapter1[rowIdx]);
      }
    });
  });

  it('should click on "Collapse All", then "Expand All" and expect only the lazily loaded nodes to be expanded', () => {
    cy.get('[data-test="collapse-all-btn"]').click();

    cy.get('.slick-group-toggle.collapsed').should('have.length', 6);
    cy.get('.slick-group-toggle.expanded').should('have.length', 0);
    cy.get('.right-footer .item-count').contains('7');
    cy.get('.right-footer .total-count').contains('13');

    cy.get('[data-test="expand-all-btn"]').click();

    cy.get('.slick-group-toggle.collapsed').should('have.length', 8);
    cy.get('.slick-group-toggle.expanded').should('have.length', 2);
    cy.get('.right-footer .item-count').contains('13');
    cy.get('.right-footer .total-count').contains('13');
  });

  it('should search label with "1.2" and expect 5 of 13 items left in the grid', () => {
    cy.get('[data-test=search-string]').type('1.2');

    cy.get('.right-footer .item-count').contains('5');
    cy.get('.right-footer .total-count').contains('13');

    const filteredItems = ['Chapter 1', 'Chapter 1.2', 'Chapter 1.2.1', 'Chapter 1.2.2', 'Chapter 1.2.3'];
    filteredItems.forEach((_colName, rowIdx) => {
      if (rowIdx < filteredItems.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', filteredItems[rowIdx]);
      }
    });
  });

  it('should clear search filter and expect 20 items back in the grid', () => {
    cy.get('[data-test="clear-search-string"]').click();

    const unfilteredItems = [
      'Chapter 1',
      'Chapter 1.1',
      'Chapter 1.2',
      'Chapter 1.2.1',
      'Chapter 1.2.2',
      'Chapter 1.2.3',
      'Chapter 1.3',
      'Chapter 2',
      'Chapter 3',
      'Chapter 4',
      'Chapter 5',
      'Chapter 6',
      'Chapter X',
    ];
    unfilteredItems.forEach((_colName, rowIdx) => {
      if (rowIdx < unfilteredItems.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', unfilteredItems[rowIdx]);
      }
    });
  });

  it('should sort by "Label" descending and expect all descriptions to show on top by parents then by children', () => {
    cy.get('.slick-header-columns .slick-header-column:nth(2)').click().click();

    const labelSortDesc = [
      'Chapter X',
      'Chapter 2',
      'Chapter 1',
      'Chapter 1.3',
      'Chapter 1.2',
      'Chapter 1.2.3',
      'Chapter 1.2.2',
      'Chapter 1.2.1',
      'Chapter 1.1',
      'Chapter 5',
      'Chapter 3',
      'Chapter 6',
      'Chapter 4',
    ];
    labelSortDesc.forEach((_colName, rowIdx) => {
      if (rowIdx < labelSortDesc.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', labelSortDesc[rowIdx]);
      }
    });
  });

  it('should search "Label = 1.2" & "Page Number <= 6" and expect 4 of 13 items left in the grid', () => {
    cy.get('[data-test=search-string]').type('1.2');

    cy.get('.right-footer .item-count').contains('5');
    cy.get('.right-footer .total-count').contains('13');

    const filteredItems = ['Chapter 1', 'Chapter 1.2', 'Chapter 1.2.3', 'Chapter 1.2.2', 'Chapter 1.2.1'];
    filteredItems.forEach((_colName, rowIdx) => {
      if (rowIdx < filteredItems.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', filteredItems[rowIdx]);
      }
    });

    cy.get('.filter-pageNumber .operator select').select('<=');
    cy.get('input.filter-pageNumber').type('6');

    cy.get('.right-footer .item-count').contains('4');
    cy.get('.right-footer .total-count').contains('13');
  });

  it('should lazily expand "Chapter 1.2.1" and expect 1 more group added', () => {
    cy.get('div[data-row="3"] > .slick-cell:nth(1) .slick-tree-title').contains('Chapter 1.2.1');
    cy.get('div[data-row="3"] > .slick-cell:nth(1) .slick-group-toggle.collapsed').click();

    cy.get('.slick-group-toggle.collapsed').should('have.length', 2);
    cy.get('.slick-group-toggle.expanded').should('have.length', 3);
    cy.get('.right-footer .item-count').contains('5');
    cy.get('.right-footer .total-count').contains('16');

    const defaultGridWithSubChapter1 = ['Chapter 1', 'Chapter 1.2', 'Chapter 1.2.2', 'Chapter 1.2.1', 'Chapter 1.2.1.1'];
    defaultGridWithSubChapter1.forEach((_colName, rowIdx) => {
      if (rowIdx < defaultGridWithSubChapter1.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', defaultGridWithSubChapter1[rowIdx]);
      }
    });
  });

  it('should resort "Label" in ascending order still expect 5 of 16 items being filtered', () => {
    cy.get('.slick-header-columns .slick-header-column:nth(2)').click();

    const defaultGridWithSubChapter1 = ['Chapter 1', 'Chapter 1.2', 'Chapter 1.2.1', 'Chapter 1.2.1.1', 'Chapter 1.2.2'];
    defaultGridWithSubChapter1.forEach((_colName, rowIdx) => {
      if (rowIdx < defaultGridWithSubChapter1.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', defaultGridWithSubChapter1[rowIdx]);
      }
    });
  });

  it('should Clear all Filters and expect all 16 items to be shown in the grid', () => {
    cy.get('[data-test="clear-filters-btn"]').click();

    cy.get('.right-footer .item-count').contains('16');
    cy.get('.right-footer .total-count').contains('16');

    const labelSortDesc = [
      'Chapter 4',
      'Chapter 6',
      'Chapter 3',
      'Chapter 5',
      'Chapter 1',
      'Chapter 1.1',
      'Chapter 1.2',
      'Chapter 1.2.1',
      'Chapter 1.2.1.1',
      'Chapter 1.2.1.2',
      'Chapter 1.2.1.3',
      'Chapter 1.2.2',
      'Chapter 1.2.3',
      'Chapter 1.3',
      'Chapter 2',
      'Chapter X',
    ];
    labelSortDesc.forEach((_colName, rowIdx) => {
      if (rowIdx < labelSortDesc.length - 1) {
        cy.get(`div[data-row="${rowIdx}"] > .slick-cell:nth(1)`).should('contain', labelSortDesc[rowIdx]);
      }
    });
  });

  it('should click again on "Collapse All", then "Expand All" and still expect 16 of 16 items to be lazily loaded nodes to be expanded', () => {
    cy.get('[data-test="collapse-all-btn"]').click();

    cy.get('.slick-group-toggle.collapsed').should('have.length', 6);
    cy.get('.slick-group-toggle.expanded').should('have.length', 0);
    cy.get('.right-footer .item-count').contains('7');
    cy.get('.right-footer .total-count').contains('16');

    cy.get('[data-test="expand-all-btn"]').click();

    cy.get('.slick-group-toggle.collapsed').should('have.length', 9);
    cy.get('.slick-group-toggle.expanded').should('have.length', 3);
    cy.get('.right-footer .item-count').contains('16');
    cy.get('.right-footer .total-count').contains('16');
  });
});
