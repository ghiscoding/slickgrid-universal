describe('Example 18 - Draggable Grouping & Aggregators', () => {
  const preHeaders = ['', 'Common Factor', 'Period', 'Analysis', ''];
  const originalTitles = ['', 'Duration', 'Start', 'Finish', 'Cost', '% Complete', 'Effort-Driven', 'Action'];
  const fullTitles = ['', 'Title', 'Duration', 'Start', 'Finish', 'Cost', '% Complete', 'Effort-Driven', 'Action'];
  const columnPickerTitles = [
    'Common Factor - Title',
    'Common Factor - Duration',
    'Period - Start',
    'Period - Finish',
    'Analysis - Cost',
    'Analysis - % Complete',
    'Analysis - Effort-Driven',
    'Action',
  ];
  const expectColumnPickerTitles = (menuSelector: string) => {
    cy.get(menuSelector)
      .find('.slick-column-picker-list')
      .children('li:not(.hidden)')
      .then(($items) => {
        const actual = Array.from($items, (item) => item.textContent || '').slice(0, columnPickerTitles.length);
        expect(actual).to.deep.eq(columnPickerTitles);
      });
  };
  const expectPreHeadersInOrder = (expected: string[]) => {
    cy.get('#grid18 .slick-preheader-panel .slick-header-columns')
      .children()
      .then(($children) => {
        const actual = Array.from($children, (child) => child.textContent || '');
        expect(actual.every((title) => expected.includes(title))).to.eq(true);

        let actualIndex = 0;
        expected.forEach((title) => {
          const titleIndex = actual.indexOf(title, actualIndex);
          expect(titleIndex, `missing pre-header title: ${title}`).to.be.gte(0);
          actualIndex = titleIndex + 1;
        });
      });
  };

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example18`);
    cy.get('h2').should('contain', 'Example 18: Draggable Grouping & Aggregators');
  });

  it('should hide sub-title to provide more space for the grid', () => {
    cy.get('[data-test="toggle-subtitle"]').click();
  });

  it('should have exact column (pre-header) grouping titles in grid', () => {
    cy.get('#grid18')
      .find('.slick-preheader-panel .slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(preHeaders[index]));
  });

  it('should have exact column titles in grid', () => {
    cy.get('#grid18')
      .find('.slick-header:not(.slick-preheader-panel) .slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(originalTitles[index]));
  });

  it('should initially be grouped by "Duration" when loading the grid', () => {
    cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').contains(/Duration: [0-9]/);
    cy.get('[data-row=1] > .slick-cell:nth(2)').should('contain', '0');
  });

  it('should open Grid Menu and be able to unhide "Title" column', () => {
    cy.get('button.slick-grid-menu-button').click({ force: true });
    cy.get('.slick-grid-menu:visible')
      .find('.slick-column-picker-list')
      .children('li:visible:nth(0)')
      .children('label')
      .should('contain', 'Common Factor - Title');
    // .click({ force: true });

    cy.get('.slick-column-picker-list input[data-columnid="title"]')
      .parent('.icon-checkbox-container')
      .find('.sgi')
      .should('have.class', 'sgi-icon-picker-uncheck');

    expectColumnPickerTitles('.slick-grid-menu:visible');

    cy.get('.slick-grid-menu:visible')
      .find('.slick-column-picker-list')
      .children('li:visible:nth(0)')
      .children('label')
      .should('contain', 'Common Factor - Title')
      .click();

    cy.get('.slick-column-picker-list input[data-columnid="title"]')
      .parent('.icon-checkbox-container')
      .find('.sgi')
      .should('have.class', 'sgi-icon-picker-check');

    cy.get('#grid18')
      .find('.slick-header:not(.slick-preheader-panel) .slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should still be grouped by "Duration"', () => {
    cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').contains(/Duration: [0-9]/);
    cy.get('[data-row=1] > .slick-cell:nth(2)').should('contain', '0');
  });

  it('should clear all groups with "Clear all Grouping" and no longer expect any grouping', () => {
    cy.get('[data-test="clear-grouping-btn"]').click();
    cy.get('#grid18').find('.slick-group-toggle-all').should('be.hidden');

    cy.get('#grid18')
      .find('.slick-draggable-dropzone-placeholder')
      .should('be.visible')
      .should('have.text', 'Drop a column header here to group by the column');
  });

  it('should have a draggable dropzone on top of the grid in the top-header section', () => {
    cy.get('#grid18').find('.slick-topheader-panel .slick-dropzone:visible').contains('Drop a column header here to group by the column');
  });

  it('should open the Cell Menu on 2nd and 3rd row and change the Effort-Driven to "True" and expect the cell to be updated and have checkmark to be enabled', () => {
    cy.get('[data-row=1] > .slick-cell:nth(1)').should('contain', 'Task 1');
    cy.get('[data-row=1] > .slick-cell:nth(8)').find('.checkmark-icon').should('have.length', 0);
    cy.get('[data-row=2] > .slick-cell:nth(1)').should('contain', 'Task 2');
    cy.get('[data-row=2] > .slick-cell:nth(8)').find('.checkmark-icon').should('have.length', 0);

    cy.get('#grid18').find('[data-row=1] > .slick-cell:nth(8)').contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('True').click();
    cy.get('#grid18').find('[data-row=2] > .slick-cell:nth(8)').contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('True').click();

    cy.get('[data-row=1] > .slick-cell:nth(7)').find('.checkmark-icon').should('have.length', 1);
    cy.get('[data-row=2] > .slick-cell:nth(7)').find('.checkmark-icon').should('have.length', 1);
  });

  it('should be able to change Start date and expect same date when reopening date picker', () => {
    let pickerMonth = '';
    let selectedDate = '';
    const currentYear = new Date().getFullYear();
    const firstRowStartYear = currentYear - 2;
    // change Finish date to today's date
    cy.get('[data-row=0] > .slick-cell:nth(3)').should('contain', '').click();
    cy.get('[data-vc="year"]').should('have.text', firstRowStartYear);
    cy.get('[data-vc="month"]').should(($button) => {
      pickerMonth = $button.text();
      expect(pickerMonth).not.to.eq('');
    });
    cy.get('[data-vc-date-selected]').should(($button) => {
      selectedDate = $button.text();
      expect(pickerMonth).not.to.eq('');
    });
    cy.get('[data-vc-date-selected]').click(); // reselect it to close the picker

    // reopen date picker should have same date
    cy.get('[data-row=0] > .slick-cell:nth(3)').should('contain', '').click();
    cy.get('[data-vc="year"]').should('have.text', firstRowStartYear);

    cy.get('[data-vc="month"]').should(($button) => {
      expect($button.text()).to.eq(pickerMonth);
    });
    cy.get('[data-vc-date-selected]').should(($button) => {
      expect($button.text()).to.eq(selectedDate);
    });

    cy.get('[data-vc-date-selected]').click(); // reselect it to close the picker
  });

  describe('Grouping tests', () => {
    it('should "Group by Duration & sort groups by value" then Collapse All and expect only group titles', () => {
      cy.get('[data-test="add-500k-rows-btn"]').click();
      cy.get('[data-test="group-duration-sort-value-btn"]').click();
      cy.get('[data-test="collapse-all-btn"]').click();

      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.collapsed').should('have.length', 1);
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 0');

      cy.get('[data-row=1] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 1');
      cy.get('[data-row=2] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 2');
      cy.get('[data-row=3] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 3');
      cy.get('[data-row=4] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 4');
    });

    it('should click on the group by Duration sort icon and expect data to become sorted as descending order with all rows being expanded', () => {
      cy.get('.mdi-arrow-up:nth(0)').click();
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.expanded').should('have.length', 1);
    });

    it('should collapse all rows and make sure Duration group is sorted in descending order', () => {
      cy.get('.slick-topheader-panel .slick-group-toggle-all').click();
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.collapsed').should('have.length', 1);
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 100');
      cy.get('[data-row=1] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 99');
      cy.get('[data-row=2] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 98');
    });

    it('should click on the group by Duration sort icon and now expect data to become sorted as ascending order with all rows being expanded', () => {
      cy.get('.mdi-arrow-down:nth(0)').click();
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.expanded').should('have.length', 1);
    });

    it('should collapse all rows again and make sure Duration group is sorted in descending order', () => {
      cy.get('.slick-topheader-panel .slick-group-toggle-all').click();
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.collapsed').should('have.length', 1);
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 0');
      cy.get('[data-row=1] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 1');
      cy.get('[data-row=2] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 2');
    });

    it('should click on Expand All columns and expect 1st row as grouping title and 2nd row as a regular row', () => {
      cy.get('[data-test="add-500k-rows-btn"]').click();
      cy.get('[data-test="group-duration-sort-value-btn"]').click();
      cy.get('[data-test="expand-all-btn"]').click();

      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.expanded').should('have.length', 1);
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 0');

      cy.get('[data-row=1] > .slick-cell:nth(1)').should('contain', 'Task');
      cy.get('[data-row=1] > .slick-cell:nth(2)').should('contain', '0');
    });

    it('should show 1 column title (Duration) shown in the pre-header section', () => {
      cy.get('.slick-dropped-grouping:nth(0) div').contains('Duration');
    });

    it('should "Group by Duration then Effort-Driven" and expect 1st row to be expanded, 2nd row to be expanded and 3rd row to be a regular row', () => {
      cy.get('[data-test="group-duration-effort-btn"]').click();

      cy.get('[data-row=0].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded').should('have.length', 1);
      cy.get('[data-row=0].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 0');

      cy.get('[data-row=1].slick-group-level-1 .slick-group-toggle.expanded').should('have.length', 1);
      cy.get('[data-row=1].slick-group-level-1 .slick-group-title').should('contain', 'Effort-Driven: False');

      cy.get('[data-row=2] > .slick-cell:nth(1)').should('contain', 'Task');
      cy.get('[data-row=2] > .slick-cell:nth(2)').should('contain', '0');
    });

    it('should show 2 column titles (Duration, Effort-Driven) shown in the pre-header section', () => {
      cy.get('.slick-dropped-grouping:nth(0) div').contains('Duration');
      cy.get('.slick-dropped-grouping:nth(1) div').contains('Effort-Driven');
    });

    it('should be able to drag and swap pre-header grouped column titles (Effort-Driven, Duration)', () => {
      cy.get('.slick-dropped-grouping:nth(0) div').contains('Duration').drag('.slick-dropped-grouping:nth(1) div');

      cy.get('.slick-dropped-grouping:nth(0) div').contains('Effort-Driven');
      cy.get('.slick-dropped-grouping:nth(1) div').contains('Duration');
    });

    it('should expect the grouping to be swapped as well in the grid', () => {
      cy.get('[data-row=0].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded').should('have.length', 1);
      cy.get('[data-row=0].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title').should('contain', 'Effort-Driven: False');

      cy.get('[data-row=1].slick-group-level-1 .slick-group-toggle.expanded').should('have.length', 1);
      cy.get('[data-row=1].slick-group-level-1 .slick-group-title').should('contain', 'Duration: 0');

      cy.get('[data-row=2] > .slick-cell:nth(1)').should('contain', 'Task');
      cy.get('[data-row=2] > .slick-cell:nth(2)').should('contain', '0');
    });

    it('should use the topheader Toggle All button and expect all groups to now be collapsed', () => {
      cy.get('.slick-topheader-panel .slick-group-toggle-all').click();

      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.collapsed').should('have.length', 1);
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Effort-Driven: False');
      cy.get('[data-row=1] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Effort-Driven: True');
    });

    it('should expand all rows with "Expand All" from context menu and expect all the Groups to be expanded and the Toogle All icon to be collapsed', () => {
      cy.get('#grid18').find('.slick-row .slick-cell:nth(1)').rightclick({ force: true });

      cy.get('.slick-context-menu .slick-menu-command-list').find('.slick-menu-content').contains('Export in CSV format');
      cy.get('.slick-context-menu .slick-menu-command-list').find('.slick-menu-content').contains('Export to Excel');
      cy.get('.slick-context-menu .slick-menu-command-list').find('.slick-menu-content').contains('Export to PDF');
      cy.get('.slick-context-menu .slick-menu-command-list').find('.slick-menu-content').contains('Expand all Groups').click();

      cy.get('#grid18').find('.slick-group-toggle.collapsed').should('have.length', 0);

      cy.get('#grid18')
        .find('.slick-group-toggle.expanded')
        .should(($rows) => expect($rows).to.have.length.greaterThan(0));

      cy.get('.slick-group-toggle-all-icon.expanded').should('exist');
    });

    it('should collapse all rows with "Collapse All" from context menu and expect all the Groups to be collapsed and the Toogle All icon to be collapsed', () => {
      cy.get('#grid18').find('.slick-row .slick-cell:nth(1)').rightclick({ force: true });

      cy.get('.slick-context-menu:visible .slick-menu-command-list')
        .find('.slick-menu-item')
        .find('.slick-menu-content')
        .contains('Collapse all Groups')
        .click();

      cy.get('#grid18').find('.slick-group-toggle.expanded').should('have.length', 0);

      cy.get('#grid18')
        .find('.slick-group-toggle.collapsed')
        .should(($rows) => expect($rows).to.have.length.greaterThan(0));

      cy.get('.slick-group-toggle-all-icon.collapsed').should('exist');
    });

    it('should use the topheader Toggle All button and expect all groups to now be expanded', () => {
      cy.get('.slick-topheader-panel .slick-group-toggle-all').click();

      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.expanded').should('have.length', 1);
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Effort-Driven: False');
      cy.get('[data-row=1] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 0');
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.expanded').should('have.css', 'marginLeft').and('eq', '0px');
      cy.get('[data-row=1] > .slick-cell:nth(0) .slick-group-toggle.expanded').should('have.css', 'marginLeft').and('eq', '15px');
    });

    it('should use the topheader Toggle All button again and expect all groups to now be collapsed', () => {
      cy.get('.slick-topheader-panel .slick-group-toggle-all').click();

      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-toggle.collapsed').should('have.length', 1);
      cy.get('[data-row=0] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Effort-Driven: False');
      cy.get('[data-row=1] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Effort-Driven: True');
    });

    it('should clear all groups with "Clear all Grouping" from context menu and expect all the Groups to be collapsed and the Toogle All icon to be collapsed', () => {
      cy.get('#grid18').find('.slick-row .slick-cell:nth(1)').rightclick({ force: true });

      cy.get('.slick-context-menu:visible .slick-menu-command-list')
        .find('.slick-menu-item')
        .find('.slick-menu-content')
        .contains('Clear all Grouping')
        .click();

      cy.get('#grid18').find('.slick-group-toggle-all').should('be.hidden');

      cy.get('#grid18')
        .find('.slick-draggable-dropzone-placeholder')
        .should('be.visible')
        .should('have.text', 'Drop a column header here to group by the column');
    });

    it('should add 5000 items and expect 5000 of 5000 items displayed', () => {
      cy.get('[data-test="add-5k-rows-btn"]').click();

      cy.get('.right-footer').contains('5000 of 5000 items');
    });

    it('should click on Select All checkbox in filter header row and expect all 5000 items to be selected and full selection count show in left footer', () => {
      cy.get('#filter-checkbox-selectall-container').click();

      cy.get('#filter-checkbox-selectall-container').find('input[type=checkbox]').should('be.checked');

      cy.get('.left-footer').contains('5000 items selected');
    });

    it('should uncheck 2 first rows and expect the Select All checkbox to become unchecked', () => {
      cy.get('[data-row=0] > .slick-cell:nth(0)').find('label').click();

      cy.get('[data-row=1] > .slick-cell:nth(0)').find('label').click();

      cy.get('#filter-checkbox-selectall-container').find('input[type=checkbox]').should('not.be.checked');
    });

    it('should recheck the 2 first rows and expect the Select All checkbox to become unchecked', () => {
      cy.get('[data-row=0] > .slick-cell:nth(0)').find('label').click();

      cy.get('#filter-checkbox-selectall-container').find('input[type=checkbox]').should('not.be.checked');

      cy.get('[data-row=1] > .slick-cell:nth(0)').find('label').click();

      cy.get('#filter-checkbox-selectall-container').find('input').should('be.checked');
    });

    it('should be able to toggle draggable grouping row (top-header panel)', () => {
      cy.get('.slick-topheader-panel').should('be.visible');

      cy.get('[data-test="toggle-draggable-grouping-row"]').click();

      cy.get('.slick-topheader-panel').should('be.hidden');

      cy.get('[data-test="toggle-draggable-grouping-row"]').click();

      cy.get('.slick-topheader-panel').should('be.visible');
    });
  });

  describe('Column Picker tests', () => {
    it('should open Column Picker from 2nd header column and hide Title & Duration which will hide Common Factor Group as well', () => {
      cy.get('#grid18').find('.slick-header-column:nth(1)').trigger('mouseover').trigger('contextmenu').invoke('show');

      expectColumnPickerTitles('.slick-column-picker');

      cy.get('.slick-column-picker')
        .find('.slick-column-picker-list')
        .children('li:nth-child(2)')
        .children('label')
        .should('contain', 'Title')
        .click();

      cy.get('.slick-column-picker .close').click();
    });

    it('should open Column Picker from 2nd header column name and hide Duration which will hide Common Factor Group as well', () => {
      cy.get('#grid18').find('.slick-header-column:nth(1) .slick-column-name').trigger('mouseover').trigger('contextmenu').invoke('show');

      expectColumnPickerTitles('.slick-column-picker');

      cy.get('.slick-column-picker')
        .find('.slick-column-picker-list')
        .children('li:nth-child(3)')
        .children('label')
        .should('contain', 'Duration')
        .click();

      cy.get('.slick-column-picker .close').click();
    });

    it('should expect headers to be without Title/Duration and pre-headers without Common Factor Group header titles', () => {
      const preHeadersWithoutFactor = ['', 'Period', 'Analysis', ''];
      const titlesWithoutTitleDuration = ['', 'Start', 'Finish', 'Cost', '% Complete', 'Effort-Driven', 'Action'];

      // Column Pre-Headers without Common Factor group
      cy.get('#grid18')
        .find('.slick-header:not(.slick-preheader-panel) .slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(titlesWithoutTitleDuration[index]));

      // Column Headers without Title & Duration
      cy.get('#grid18')
        .find('.slick-preheader-panel .slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(preHeadersWithoutFactor[index]));
    });

    it('should open Column Picker from Pre-Header column and show again Title column', () => {
      cy.get('#grid18')
        .find('.slick-preheader-panel .slick-header-column:nth(1)')
        .trigger('mouseover')
        .trigger('contextmenu')
        .invoke('show');

      expectColumnPickerTitles('.slick-column-picker');

      cy.get('.slick-column-picker')
        .find('.slick-column-picker-list')
        .children('li:nth-child(2)')
        .children('label')
        .should('contain', 'Title')
        .click();

      // close picker & reopen from a pre-header column name instead
      cy.get('.slick-column-picker .close').click();
    });

    it('should open Column Picker from Pre-Header column name and show again Duration column', () => {
      cy.get('#grid18')
        .find('.slick-preheader-panel .slick-header-column:nth(1)')
        .trigger('mouseover')
        .trigger('contextmenu')
        .invoke('show');

      expectColumnPickerTitles('.slick-column-picker');

      cy.get('.slick-column-picker')
        .find('.slick-column-picker-list')
        .children('li:nth-child(3)')
        .children('label')
        .should('contain', 'Duration')
        .click();

      cy.get('.slick-column-picker .close').click();
    });

    it('should expect header titles to show again Title/Duration and pre-headers with Common Factor Group header titles', () => {
      const preHeadersWithFactor = ['', 'Common Factor', 'Period', 'Analysis', ''];
      const titlesWithTitleDuration = ['', 'Title', 'Duration', 'Start', 'Finish', 'Cost', '% Complete', 'Effort-Driven', 'Action'];

      // Column Pre-Headers without Common Factor group
      cy.get('#grid18')
        .find('.slick-preheader-panel .slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(preHeadersWithFactor[index]));

      // Column Headers without Title & Duration
      cy.get('#grid18')
        .find('.slick-header:not(.slick-preheader-panel) .slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(titlesWithTitleDuration[index]));
    });

    it('should open Header Menu on Duration column and pin columns through it', () => {
      cy.get('.slick-header:not(.slick-preheader-panel) .slick-header-columns')
        .find('.slick-header-column:nth(2)')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();

      cy.get('.slick-header-menu .slick-menu-command-list')
        .should('be.visible')
        .find('[data-command="pin-column"]')
        .should('contain', 'Column Pinning')
        .click();

      cy.get('.slick-submenu [data-command="pin-columns"]').should('be.visible').and('contain', 'Pin Through Here').click();
    });

    it('should keep grouping, pinning, pre-header bands, and row styling aligned', () => {
      // Split the Period pre-header across the center/right docking bands, then
      // verify that a center column can still be dragged into the dropzone.
      cy.get('#grid18 .slick-header-columns-center .slick-header-column[data-id="finish"]')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();
      cy.get('.slick-header-menu:visible [data-command="pin-column"]').click();
      cy.get('.slick-submenu:visible [data-command="pin-right"]').click();

      cy.get('#grid18 .slick-header-columns-right .slick-header-column[data-id="finish"]').should('be.visible');
      cy.get('#grid18 .slick-preheader-panel .slick-header-column[data-group="Period"]')
        .should('have.length', 2)
        .then(($periodHeaders) => {
          expect($periodHeaders[0].classList.contains('slick-column-pinned-right')).to.eq(false);
          expect($periodHeaders[1].classList.contains('slick-column-pinned-right')).to.eq(true);
        });

      cy.get('#grid18 .slick-header-columns-center .slick-header-column[data-id="start"]').drag('.slick-dropzone', { force: true });
      cy.get('.slick-dropped-grouping').should('contain', 'Start');

      cy.get('#grid18 .slick-row.slick-group')
        .first()
        .should('have.class', 'slick-row-full-width-group')
        .then(($groupRow) => {
          expect($groupRow[0].querySelector('.slick-pinned-left-cells .slick-cell')).to.be.null;
          expect($groupRow[0].querySelector('.slick-pinned-right-cells .slick-cell')).to.be.null;
        })
        .children('.slick-cell-full-width-group')
        .should('contain', 'Start:')
        .click('center', { force: true })
        .should('have.class', 'active')
        .and('have.css', 'z-index', '21')
        .then(($groupCell) => {
          const groupCellRect = $groupCell[0].getBoundingClientRect();
          const viewport = Cypress.$('#grid18 .slick-viewport')[0];
          expect(groupCellRect.left).to.be.closeTo(viewport.getBoundingClientRect().left, 1);
          expect(groupCellRect.width).to.be.closeTo(viewport.clientWidth, 1);
        });

      cy.get('#grid18 .slick-row.slick-row-docked:not(.slick-group)')
        .filter('.odd')
        .first()
        .then(($row) => {
          const row = $row[0];
          const leftRegion = row.querySelector('.slick-pinned-left-cells') as HTMLElement;
          const centerRegion = row.querySelector('.slick-scrolling-cells') as HTMLElement;
          const rightRegion = row.querySelector('.slick-pinned-right-cells') as HTMLElement;
          const leftBoundary = leftRegion.querySelector('.slick-cell:last-child') as HTMLElement;
          const rightBoundary = rightRegion.querySelector('.slick-cell:first-child') as HTMLElement;

          expect(getComputedStyle(leftRegion).backgroundColor).to.eq(getComputedStyle(centerRegion).backgroundColor);
          expect(getComputedStyle(rightRegion).backgroundColor).to.eq(getComputedStyle(centerRegion).backgroundColor);
          expect(getComputedStyle(leftBoundary, '::after').boxShadow).not.to.eq('none');
          expect(getComputedStyle(rightBoundary, '::after').boxShadow).not.to.eq('none');
        });

      cy.get('[data-test="clear-grouping-btn"]').click();
      cy.get('.slick-draggable-dropzone-placeholder').should('be.visible');

      cy.get('#grid18 .slick-header-columns-right .slick-header-column[data-id="finish"]')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();
      cy.get('.slick-header-menu:visible [data-command="pin-column"]').click();
      cy.get('.slick-submenu:visible [data-command="unpin-column"]').click();
      cy.get('#grid18 .slick-header-columns-right .slick-header-column[data-id="finish"]').should('not.exist');
      cy.get('#grid18 .slick-header-columns-center .slick-header-column[data-id="finish"]').should('be.visible');
    });

    it('should open Cost column Header Menu then click on "Hide Column" and still expect all headers shown', () => {
      // Finish was temporarily pinned right by the previous test. Once it is
      // unpinned it remains last in the current column order, but is no longer
      // part of the right docking region.
      const headerTitles = ['', 'Title', 'Duration', 'Start', '% Complete', 'Effort-Driven', 'Action', 'Finish'];

      // Pinning now uses one live header row instead of the legacy right header
      // pane. Locate Cost by its column content so this test follows the
      // single-viewport DOM contract.
      cy.get('#grid18')
        .find('.slick-header:not(.slick-preheader-panel) .slick-header-columns')
        .contains('.slick-header-column', 'Cost')
        .should('contain', 'Cost')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();

      cy.get('.slick-header-menu .slick-menu-command-list')
        .should('be.visible')
        .children('.slick-menu-item:nth-of-type(9)')
        .children('.slick-menu-content')
        .contains('Hide Column')
        .click();

      expectPreHeadersInOrder(preHeaders);

      cy.get('#grid18')
        .find('.slick-header:not(.slick-preheader-panel) .slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(headerTitles[index]));

      cy.get('#grid18 .slick-header-column[data-id="action"]').then(($header) => {
        const headerRect = $header[0].getBoundingClientRect();
        cy.get('#grid18 .slick-row.slick-row-docked:not(.slick-group) .slick-cell.l7')
          .first()
          .then(($cell) => {
            const cellRect = $cell[0].getBoundingClientRect();
            expect(cellRect.left).to.be.closeTo(headerRect.left, 1);
            expect(cellRect.width).to.be.closeTo(headerRect.width, 1);
          });
      });
    });

    it('should open Column Picker then hide "Finish" column and still expect all headers shown', () => {
      const headerTitles = ['', 'Title', 'Duration', 'Start', '% Complete', 'Effort-Driven', 'Action'];

      cy.get('#grid18')
        .find('.slick-header:not(.slick-preheader-panel) .slick-header-columns .slick-header-column')
        .first()
        .trigger('mouseover')
        .trigger('contextmenu')
        .invoke('show');

      cy.get('.slick-column-picker')
        .find('.slick-column-picker-list input[data-columnid="finish"]')
        .closest('li')
        .children('label')
        .should('contain', 'Period - Finish')
        .click();

      cy.get('.slick-column-picker .close').click();

      expectPreHeadersInOrder(preHeaders);

      cy.get('#grid18')
        .find('.slick-header:not(.slick-preheader-panel) .slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(headerTitles[index]));
    });
  });
});
