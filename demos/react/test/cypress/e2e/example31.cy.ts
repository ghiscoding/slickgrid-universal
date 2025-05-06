describe('Example 31 - OData Grid using RxJS', () => {
  const GRID_ROW_HEIGHT = 33;

  beforeEach(() => {
    // create a console.log spy for later use
    cy.window().then((win) => cy.spy(win.console, 'log'));
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example31`);
    cy.get('h2').should('contain', 'Example 31: Grid with OData Backend Service using RxJS Observables');
  });

  describe('when "enableCount" is set', () => {
    it('should have default OData query', () => {
      cy.get('[data-test=alert-odata-query]').should('exist');
      cy.get('[data-test=alert-odata-query]').should('contain', 'OData Query');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=20&$skip=20&$orderby=Name asc&$filter=(Gender eq 'male')`);
      });
    });

    it('should change Pagination to next page', () => {
      cy.get('.icon-seek-next').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('3'));

      cy.get('[data-test=page-count]').contains('3');

      cy.get('[data-test=item-from]').contains('41');

      cy.get('[data-test=item-to]').contains('50');

      cy.get('[data-test=total-items]').contains('50');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=20&$skip=40&$orderby=Name asc&$filter=(Gender eq 'male')`);
      });

      cy.window().then((win) => {
        expect(win.console.log).to.have.callCount(1);
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', {
          newValues: { pageNumber: 3, pageSize: 20 },
          type: 'pagination',
        });
      });
    });

    it('should change Pagination to first page with 10 items', () => {
      cy.get('#items-per-page-label').select('10');

      // wait for the query to start and finish
      cy.get('[data-test=status]').should('contain', 'loading...');
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('1'));

      cy.get('[data-test=page-count]').contains('5');

      cy.get('[data-test=item-from]').contains('1');

      cy.get('[data-test=item-to]').contains('10');

      cy.get('[data-test=total-items]').contains('50');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=10&$orderby=Name asc&$filter=(Gender eq 'male')`);
      });

      cy.window().then((win) => {
        expect(win.console.log).to.have.callCount(1);
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', {
          newValues: { pageNumber: 1, pageSize: 10 },
          type: 'pagination',
        });
      });
    });

    it('should change Pagination to last page', () => {
      cy.get('.icon-seek-end').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('5'));

      cy.get('[data-test=page-count]').contains('5');

      cy.get('[data-test=item-from]').contains('41');

      cy.get('[data-test=item-to]').contains('50');

      cy.get('[data-test=total-items]').contains('50');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=10&$skip=40&$orderby=Name asc&$filter=(Gender eq 'male')`);
      });

      cy.window().then((win) => {
        expect(win.console.log).to.have.callCount(1);
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', {
          newValues: { pageNumber: 5, pageSize: 10 },
          type: 'pagination',
        });
      });
    });

    it('should change Pagination to first page using the external button', () => {
      cy.get('[data-test=goto-first-page').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('1'));

      cy.get('[data-test=page-count]').contains('5');

      cy.get('[data-test=item-from]').contains('1');

      cy.get('[data-test=item-to]').contains('10');

      cy.get('[data-test=total-items]').contains('50');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=10&$orderby=Name asc&$filter=(Gender eq 'male')`);
      });

      cy.window().then((win) => {
        expect(win.console.log).to.have.callCount(1);
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', {
          newValues: { pageNumber: 1, pageSize: 10 },
          type: 'pagination',
        });
      });
    });

    it('should change Pagination to last page using the external button', () => {
      cy.get('[data-test=goto-last-page').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('5'));

      cy.get('[data-test=page-count]').contains('5');

      cy.get('[data-test=item-from]').contains('41');

      cy.get('[data-test=item-to]').contains('50');

      cy.get('[data-test=total-items]').contains('50');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=10&$skip=40&$orderby=Name asc&$filter=(Gender eq 'male')`);
      });

      cy.window().then((win) => {
        expect(win.console.log).to.have.callCount(1);
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', {
          newValues: { pageNumber: 5, pageSize: 10 },
          type: 'pagination',
        });
      });
    });

    it('should Clear all Filters and expect to go back to first page', () => {
      cy.get('#grid31').find('button.slick-grid-menu-button').trigger('click').click({ force: true });

      cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item').first().find('span').contains('Clear all Filters').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('1'));

      cy.get('[data-test=page-count]').contains('10');

      cy.get('[data-test=item-from]').contains('1');

      cy.get('[data-test=item-to]').contains('10');

      cy.get('[data-test=total-items]').contains('100');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=10&$orderby=Name asc`);
      });

      cy.window().then((win) => {
        // TODO look into, this should be called 2x times not 3x times
        // expect(win.console.log).to.have.callCount(2);
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', { newValues: [], type: 'filter' });
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', {
          newValues: { pageNumber: 1, pageSize: 10 },
          type: 'pagination',
        });
      });
    });

    it('should Clear all Sorting', () => {
      cy.get('#grid31').find('button.slick-grid-menu-button').trigger('click').click();

      cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item:nth(1)').find('span').contains('Clear all Sorting').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=10`);
      });

      cy.window().then((win) => {
        expect(win.console.log).to.have.callCount(1);
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', { newValues: [], type: 'sorter' });
      });
    });

    it('should use "substringof" when OData version is set to 2', () => {
      cy.get('.search-filter.filter-name').find('input').type('John');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$inlinecount=allpages&$top=10&$filter=(substringof('John', Name))`);
      });

      cy.get('#grid31').find('.slick-row').should('have.length', 1);
    });

    it('should use "contains" when OData version is set to 4', () => {
      cy.get('[data-test=version4]').click();

      cy.get('.search-filter.filter-name').find('input').type('John');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$count=true&$top=10&$filter=(contains(Name, 'John'))`);
      });

      cy.get('#grid31').find('.slick-row').should('have.length', 1);
    });

    it('should click on Set Dynamic Filter and expect query and filters to be changed', () => {
      cy.get('[data-test=set-dynamic-filter]').click();

      cy.get('.search-filter.filter-name select').should('have.value', 'a*');

      cy.get('.search-filter.filter-name')
        .find('input')
        .invoke('val')
        .then((text) => expect(text).to.eq('A'));

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$count=true&$top=10&$filter=(startswith(Name, 'A'))`);
      });

      cy.get('#grid31').find('.slick-row').should('have.length', 5);
    });
  });

  describe('when "enableCount" is unchecked (not set)', () => {
    it('should Clear all Filters, set 20 items per page & uncheck "enableCount"', () => {
      cy.get('#grid31').find('button.slick-grid-menu-button').trigger('click').click();

      cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item').first().find('span').contains('Clear all Filters').click();

      cy.get('#items-per-page-label').select('20');

      cy.get('[data-test=enable-count]').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=20`);
      });
    });

    it('should change Pagination to next page', () => {
      cy.get('.icon-seek-next').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=20&$skip=20`);
      });
    });

    it('should change Pagination to first page with 10 items', () => {
      cy.get('#items-per-page-label').select('10');

      // wait for the query to start and finish
      cy.get('[data-test=status]').should('contain', 'loading...');
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10`);
      });
    });

    it('should change Pagination to last page', () => {
      cy.get('.icon-seek-end').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$skip=90`);
      });
    });

    it('should click on "Name" column to sort it Ascending', () => {
      cy.get('.slick-header-columns').children('.slick-header-column:nth(1)').click();

      cy.get('.slick-header-columns')
        .children('.slick-header-column:nth(1)')
        .find('.slick-sort-indicator.slick-sort-indicator-asc')
        .should('be.visible');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$skip=90&$orderby=Name asc`);
      });
    });

    it('should Clear all Sorting', () => {
      cy.get('#grid31').find('button.slick-grid-menu-button').trigger('click').click();

      cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item:nth(1)').find('span').contains('Clear all Sorting').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$skip=90`);
      });
    });

    it('should click on Set Dynamic Filter and expect query and filters to be changed', () => {
      cy.get('[data-test=set-dynamic-filter]').click();

      cy.get('.search-filter.filter-name select').should('have.value', 'a*');

      cy.get('.search-filter.filter-name')
        .find('input')
        .invoke('val')
        .then((text) => expect(text).to.eq('A'));

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$filter=(startswith(Name, 'A'))`);
      });

      cy.get('#grid31').find('.slick-row').should('have.length', 5);
    });

    it('should use "substringof" when OData version is set to 2', () => {
      cy.get('[data-test=version2]').click();

      cy.get('.search-filter.filter-name').find('input').type('John');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$filter=(substringof('John', Name))`);
      });

      cy.get('#grid31').find('.slick-row').should('have.length', 1);
    });

    it('should use "contains" when OData version is set to 4', () => {
      cy.get('[data-test=version4]').click();

      cy.get('.search-filter.filter-name').find('input').type('John');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$filter=(contains(Name, 'John'))`);
      });

      cy.get('#grid31').find('.slick-row').should('have.length', 1);
    });
  });

  describe('General Pagination Behaviors', () => {
    it('should type a filter which returns an empty dataset', () => {
      cy.get('.search-filter.filter-name').find('input').clear().type('xy');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$filter=(contains(Name, 'xy'))`);
      });

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('.slick-empty-data-warning:visible').contains('No data to display.');
    });

    it('should display page 0 of 0 but hide pagination from/to numbers when filtered data "xy" returns an empty dataset', () => {
      cy.get('[data-test=page-count]').contains('0');

      cy.get('[data-test=item-from]').should('not.be.visible');

      cy.get('[data-test=item-to]').should('not.be.visible');

      cy.get('[data-test=total-items]').contains('0');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$filter=(contains(Name, 'xy'))`);
      });

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('0'));
    });

    it('should erase part of the filter so that it filters with "x"', () => {
      cy.get('.search-filter.filter-name').find('input').type('{backspace}');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$filter=(contains(Name, 'x'))`);
      });

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('.slick-empty-data-warning').contains('No data to display.').should('not.be.visible');

      cy.window().then((win) => {
        expect(win.console.log).to.have.callCount(2);
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', {
          newValues: [
            {
              columnId: 'name',
              operator: 'Contains',
              searchTerms: ['x'],
              targetSelector: 'input.form-control.filter-name.compound-input.filled',
            },
          ],
          type: 'filter',
        });
        expect(win.console.log).to.be.calledWith('Client sample, Grid State changed:: ', {
          newValues: { pageNumber: 1, pageSize: 10 },
          type: 'pagination',
        });
      });
    });

    it('should display page 1 of 1 with 2 items after erasing part of the filter to be "x" which should return 1 page', () => {
      cy.wait(50);

      cy.get('[data-test=page-count]').contains('1');

      cy.get('[data-test=item-from]').contains('1');

      cy.get('[data-test=item-to]').contains('2');

      cy.get('[data-test=total-items]').contains('2');

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('1'));
    });
  });

  describe('Set Dynamic Sorting', () => {
    it('should click on "Set Filters Dynamically" then on "Set Sorting Dynamically"', () => {
      cy.get('[data-test=set-dynamic-filter]').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'loading...');
      cy.get('[data-test=status]').should('contain', 'finished!!');

      cy.get('[data-test=set-dynamic-sorting]').click();

      cy.get('[data-test=status]').should('contain', 'loading...');
      cy.get('[data-test=status]').should('contain', 'finished!!');
    });

    it('should expect the grid to be sorted by "Name" descending', () => {
      cy.get('#grid31').get('.slick-header-column:nth(1)').find('.slick-sort-indicator-desc').should('have.length', 1);

      cy.get('.slick-row').first().children('.slick-cell:nth(1)').should('contain', 'Ayers Hood');

      cy.get('.slick-row').last().children('.slick-cell:nth(1)').should('contain', 'Alexander Foley');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$orderby=Name desc&$filter=(startswith(Name, 'A'))`);
      });
    });
  });

  describe('Editors & Filters with RxJS Observable', () => {
    it('should open the "Gender" filter and expect to find 3 options in its list ([blank], male, female)', () => {
      const expectedOptions = ['', 'male', 'female'];
      cy.get('.ms-filter.filter-gender:visible').click();

      cy.get('[data-name="filter-gender"].ms-drop').find('li:visible').should('have.length', 3);

      cy.get('[data-name="filter-gender"].ms-drop')
        .find('li:visible span')
        .each(($li, index) => expect($li.text()).to.eq(expectedOptions[index]));

      cy.get('#grid31').find('.slick-row').should('have.length', 5);
    });

    it('should select "male" Gender and expect only 4 rows left in the grid', () => {
      cy.get('[data-name="filter-gender"].ms-drop').find('li:visible:nth(1)').contains('male').click();

      cy.get('#grid31').find('.slick-row').should('have.length', 4);
    });

    it('should be able to open "Gender" on the first row and expect to find 2 options the editor list (male, female) and expect male to be selected', () => {
      const expectedOptions = ['male', 'female'];

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0)`).click();

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`)
        .should('contain', 'male')
        .click()
        .type('{enter}');

      cy.get('[data-name="editor-gender"].ms-drop').find('li:visible').should('have.length', 2);

      cy.get('[data-name="editor-gender"].ms-drop')
        .find('li:visible span')
        .each(($li, index) => expect($li.text()).to.eq(expectedOptions[index]));

      cy.get('[data-name="editor-gender"]')
        .find('li.selected')
        .find('input[data-name=selectItemeditor-gender][value=male]')
        .should('exist');
    });

    it('should click on "Add Other Gender via RxJS" button', () => {
      cy.get('[data-test="add-gender-button"]').should('not.be.disabled');
      cy.get('[data-test="add-gender-button"]').click();
      cy.get('[data-test="add-gender-button"]').should('be.disabled');
    });

    it('should select 1st row', () => {
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0)`).click();

      cy.get('#grid31').find('.slick-row').children().filter('.slick-cell-checkboxsel.selected').should('have.length', 1);
    });

    it('should open the "Gender" editor on the first row and expect to find 1 more option the editor list (male, female, other)', () => {
      const expectedOptions = ['male', 'female', 'other'];

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`)
        .should('contain', 'male')
        .click();

      cy.get('[data-name="editor-gender"].ms-drop').find('li:visible').should('have.length', 3);

      cy.get('[data-name="editor-gender"].ms-drop')
        .find('li:visible span')
        .each(($li, index) => expect($li.text()).to.eq(expectedOptions[index]));

      cy.get('[data-name="editor-gender"]')
        .find('li.selected')
        .find('input[data-name=selectItemeditor-gender][value=male]')
        .should('exist');
    });

    it('should be able to change the Gender editor on the first row to the new option "other"', () => {
      cy.get('[data-name="editor-gender"].ms-drop').find('li:visible:nth(2)').contains('other').click();
    });

    it('should open Gender filter and now expect to see 1 more option in its list ([blank], male, female, other)', () => {
      const expectedOptions = ['', 'male', 'female', 'other'];
      cy.get('.ms-filter.filter-gender:visible').click();

      cy.get('[data-name="filter-gender"].ms-drop').find('li:visible').should('have.length', 4);

      cy.get('[data-name="filter-gender"].ms-drop')
        .find('li:visible span')
        .each(($li, index) => expect($li.text()).to.eq(expectedOptions[index]));
    });

    it('should choose "other" form the Gender filter and expect 1 row left in the grid', () => {
      cy.get('[data-name="filter-gender"].ms-drop').find('li:visible:nth(3)').contains('other').click();

      cy.get('#grid31').find('.slick-row').should('have.length', 0);
    });
  });

  describe('Select and Expand Behaviors', () => {
    it('should enable "enableSelect" and "enableExpand" and expect the query to select/expand all fields', () => {
      cy.get('[data-test=enable-expand]').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$orderby=Name desc&$expand=category`);
      });

      cy.get('[data-test=enable-select]').click();

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$orderby=Name desc&$select=id,name,gender,company&$expand=category($select=name)`);
      });
    });

    it('should try to sort and filter on "Category" and expect the query to be succesful', () => {
      cy.get('[data-test=clear-filters-sorting]').click();

      cy.get('.slick-header-columns').children('.slick-header-column:nth(4)').click();

      cy.get('.slick-header-columns')
        .children('.slick-header-column:nth(4)')
        .find('.slick-sort-indicator.slick-sort-indicator-asc')
        .should('exist');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(`$top=10&$orderby=Category/name asc&$select=id,name,gender,company&$expand=category($select=name)`);
      });

      cy.get('input.search-filter.filter-category_name').type('Silver');

      // wait for the query to finish
      cy.get('[data-test=status]').should('contain', 'finished');

      cy.get('[data-test=odata-query-result]').should(($span) => {
        expect($span.text()).to.eq(
          `$top=10&$orderby=Category/name asc&$filter=(contains(Category/name, 'Silver'))&$select=id,name,gender,company&$expand=category($select=name)`
        );
      });

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('1'));

      cy.get('[data-test=page-count]').contains('4');

      cy.get('[data-test=item-from]').contains('1');

      cy.get('[data-test=item-to]').contains('10');

      cy.get('[data-test=total-items]').contains('32');
    });
  });
});
