describe('Example 01 - Basic Grids', () => {
  const GRID_ROW_HEIGHT = 33;
  const fullTitles = ['Title', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];

  beforeEach(() => {
    // add a serve mode to avoid adding the GitHub Stars link since that can slowdown Cypress considerably
    // because it keeps waiting for it to load, we also preserve the cookie for all other tests
    cy.setCookie('serve-mode', 'cypress');

    // create a console.log spy for later use
    cy.window().then((win) => cy.spy(win.console, 'log'));
  });

  it('should display Example title', () => {
    cy.visit(Cypress.config('baseUrl') as string, { timeout: 200000 });
    cy.get('h3').should('contain', 'Example 01 - Basic Grids');
    cy.get('h3 span.subtitle').should('contain', '(with Salesforce Theme)');
    cy.getCookie('serve-mode').its('value').should('eq', 'cypress');
  });

  it('should have 2 grids of size 800 * 225px and 800 * 255px', () => {
    cy.get('.grid1').should('have.css', 'width', '800px');
    cy.get('.grid1 > .slickgrid-container').should(($el) => expect(parseInt(`${$el.height()}`, 10)).to.eq(225));

    cy.get('.grid2').should('have.css', 'width', '800px');
    cy.get('.grid2 > .slickgrid-container').should(($el) => expect(parseInt(`${$el.height()}`, 10)).to.eq(255));
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should hover over the "Title" column header menu of 1st grid and click on "Sort Descending" command', () => {
    cy.get('.grid1').find('.slick-header-column').first().trigger('mouseover').children('.slick-header-menu-button').invoke('show').click();

    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(4)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Descending')
      .click();

    cy.get('.slick-row').first().children('.slick-cell').first().should('contain', 'Task 994');
  });

  it('should have a Grid Preset Filter on 1st Title column and expect all rows to be filtered as well', () => {
    cy.get('.grid2 input.search-filter.filter-title')
      .invoke('val')
      .then((text) => expect(text).to.eq('2'));

    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 122');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 123');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 124');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 125');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 126');
  });

  it('should focus on "Title" column filter and expect the grid to stay on Page 2', () => {
    cy.get('.grid2 input.search-filter.filter-title')
      .invoke('val')
      .then((text) => expect(text).to.eq('2'));

    cy.get('.grid2 input.search-filter.filter-title').focus().blur();

    cy.get('[data-test=page-number-input]')
      .invoke('val')
      .then((pageNumber) => expect(pageNumber).to.eq('2'));

    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 122');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 123');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 124');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 125');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 126');
  });

  it('should hover over the "Title" column of 2nd grid and click on "Sort Ascending" command', () => {
    cy.get('.grid2').find('.slick-header-column').first().trigger('mouseover').children('.slick-header-menu-button').invoke('show').click();

    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(3)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Ascending')
      .click();

    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 122');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 123');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 124');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 125');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 126');
  });

  it('should hover over the "Duration" column of 2nd grid, Sort Ascending and have 2 sorts', () => {
    cy.get('.grid2')
      .find('.slick-header-column:nth-of-type(2)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();

    cy.get('.grid2')
      .find('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(4)')
      .click();

    cy.get('.grid2').find('.slick-sort-indicator-asc').should('have.length', 1).siblings('.slick-sort-indicator-numbered').contains('1');

    cy.get('.grid2').find('.slick-sort-indicator-desc').should('have.length', 1).siblings('.slick-sort-indicator-numbered').contains('2');
  });

  it('should clear sorting of grid2 using the Grid Menu "Clear all Sorting" command', () => {
    cy.get('.grid2').find('button.slick-grid-menu-button').click();

    let gridUid = '';

    cy.get('.grid2 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find((className) => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-grid-menu.${gridUid}.dropleft`).find('.slick-menu-item:nth(1)').find('span').contains('Clear all Sorting').click();
      });

    cy.window().then((win) => {
      expect(win.console.log).to.have.callCount(4);
      expect(win.console.log).to.be.calledWith('onGridMenuBeforeMenuShow');
      expect(win.console.log).to.be.calledWith('onGridMenuAfterMenuShow');
      expect(win.console.log).to.be.calledWith('onGridMenuCommand', 'clear-sorting');
      expect(win.console.log).to.be.calledWith('onGridMenuMenuClose - visible columns count', 6);
    });
  });

  it('should have no sorting in 2nd grid (back to default sorted by id)', () => {
    cy.get('.grid2').find('.slick-sort-indicator-asc').should('have.length', 0);

    cy.get('.grid2').find('.slick-sort-indicator-desc').should('have.length', 0);

    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 23');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 24');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 25');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 26');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 27');
  });

  it('should retain sorting in 1st grid', () => {
    cy.get('.grid1').find('.slick-sort-indicator-desc').should('have.length', 1);
  });

  it('should have Pagination displayed and set on Grid2', () => {
    cy.get('[data-test=page-number-input]')
      .invoke('val')
      .then((pageNumber) => expect(pageNumber).to.eq('2'));

    cy.get('[data-test=page-count]').contains('55');
    cy.get('[data-test=item-from]').contains('6');
    cy.get('[data-test=item-to]').contains('10');
    cy.get('[data-test=total-items]').contains('271');
  });

  it('should clear filters of grid2 using the Grid Menu "Clear all Filters" command', () => {
    cy.get('[data-test="external-gridmenu2-btn"]').click();

    let gridUid = '';

    cy.get('.grid2 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find((className) => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-grid-menu.${gridUid}.dropright`).find('.slick-menu-item:nth(0)').find('span').contains('Clear all Filters').click();
      });

    cy.window().then((win) => {
      expect(win.console.log).to.have.callCount(4);
      expect(win.console.log).to.be.calledWith('onGridMenuBeforeMenuShow');
      expect(win.console.log).to.be.calledWith('onGridMenuAfterMenuShow');
      expect(win.console.log).to.be.calledWith('onGridMenuCommand', 'clear-filter');
      expect(win.console.log).to.be.calledWith('onGridMenuMenuClose - visible columns count', 6);
    });
  });

  it('should change Page Number 52 and expect the Pagination to have correct values', () => {
    cy.get('[data-test=page-number-input]').clear().type('52').type('{enter}');

    cy.get('[data-test=page-count]').contains('199');

    cy.get('[data-test=item-from]').contains('256');

    cy.get('[data-test=item-to]').contains('260');

    cy.get('[data-test=total-items]').contains('995');
  });

  it('should open the Grid Menu on 1st Grid and expect all Columns to be checked', () => {
    let gridUid = '';
    cy.get('.grid1').find('button.slick-grid-menu-button').click({ force: true });

    cy.get('.grid1 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find((className) => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-grid-menu.${gridUid}`)
          .find('.slick-column-picker-list')
          .children('li')
          .each(($child, index) => {
            if (index <= 5) {
              const $input = $child.find('input');
              const $label = $child.find('span.checkbox-label');
              expect($input.prop('checked')).to.eq(true);
              expect($label.text()).to.eq(fullTitles[index]);
            }
          });
      });
  });

  it('should then hide "Title" column from same 1st Grid and expect the column to be removed from 1st Grid', () => {
    const newColumnList = ['Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];
    cy.get('.grid1')
      .get('.slick-grid-menu:visible')
      .find('.slick-column-picker-list')
      .children('li:visible:nth(0)')
      .children('label')
      .should('contain', 'Title')
      .click({ force: true });

    cy.get('.grid1').get('.slick-grid-menu:visible').find('.close').click({ force: true });

    cy.get('.grid1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));
  });

  it('should open the Grid Menu off 2nd Grid and expect all Columns to still be all checked', () => {
    let gridUid = '';
    cy.get('.grid2').find('button.slick-grid-menu-button').click({ force: true });

    cy.get('.grid2 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find((className) => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-grid-menu.${gridUid}`)
          .find('.slick-column-picker-list')
          .children('li')
          .each(($li, index) => {
            if (index <= 5) {
              const $input = $li.find('input');
              const $label = $li.find('label');
              expect($input.prop('checked')).to.eq(true);
              expect($label.text()).to.eq(fullTitles[index]);
            }
          });
      });
  });

  it('should then hide "% Complete" column from this same 2nd Grid and expect the column to be removed from 2nd Grid', () => {
    const newColumnList = ['Title', 'Duration (days)', 'Start', 'Finish', 'Effort Driven'];
    cy.get('.grid2')
      .get('.slick-grid-menu:visible')
      .find('.slick-column-picker-list')
      .children('li:visible:nth(2)')
      .children('label')
      .should('contain', '% Complete')
      .click({ force: true });

    cy.get('.grid2').get('.slick-grid-menu:visible').find('.close').click({ force: true });

    cy.get('.grid2')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));
  });

  it('should go back to 1st Grid and open its Grid Menu and we expect this grid to stil have the "Title" column be hidden (unchecked)', () => {
    cy.get('.grid1').find('button.slick-grid-menu-button').click({ force: true });

    cy.get('.slick-column-picker-list')
      .children('li')
      .each(($li, index) => {
        if (index <= 5) {
          const $input = $li.find('input');
          const $label = $li.find('label');
          if ($label.text() === 'Title') {
            expect($input.prop('checked')).to.eq(false);
          } else {
            expect($input.prop('checked')).to.eq(true);
          }
          expect($label.text()).to.eq(fullTitles[index]);
        }
      });
  });

  it('should hide "Start" column from 1st Grid and expect to have 2 hidden columns (Title, Start)', () => {
    const newColumnList = ['Duration (days)', '% Complete', 'Finish', 'Effort Driven'];
    cy.get('.grid1')
      .get('.slick-grid-menu:visible')
      .find('.slick-column-picker-list')
      .children('li:visible:nth(3)')
      .children('label')
      .should('contain', 'Start')
      .click({ force: true });

    cy.get('.grid1').get('.slick-grid-menu:visible').find('.close').click({ force: true });

    cy.get('.grid1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));
  });

  it('should open Column Picker of 2nd Grid and show the "% Complete" column back to visible', () => {
    cy.get('.grid2').find('.slick-header-column').first().trigger('mouseover').trigger('contextmenu').invoke('show');

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children()
      .each(($child, index) => {
        if (index <= 5) {
          expect($child.text()).to.eq(fullTitles[index]);
        }
      });

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children('li:nth-of-type(3)')
      .children('label')
      .should('contain', '% Complete')
      .click();

    cy.get('.grid2').get('.slick-column-picker:visible').find('.close').click();

    cy.get('.grid2')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => {
        if (index <= 5) {
          expect($child.text()).to.eq(fullTitles[index]);
        }
      });

    cy.window().then((win) => {
      expect(win.console.log).to.have.callCount(1);
      expect(win.console.log).to.be.calledWith('onColumnPickerColumnsChanged - visible columns count', 6);
    });
  });

  it('should open the Grid Menu on 2nd Grid and expect all Columns to be checked', () => {
    let gridUid = '';
    cy.get('.grid2').find('button.slick-grid-menu-button').click({ force: true });

    cy.get('.grid2 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find((className) => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-grid-menu.${gridUid}`)
          .find('.slick-column-picker-list')
          .children('li')
          .each(($li, index) => {
            if (index <= 5) {
              const $input = $li.find('input');
              const $label = $li.find('label');
              expect($input.prop('checked')).to.eq(true);
              expect($label.text()).to.eq(fullTitles[index]);
            }
          });
      });
  });

  it('should still expect 1st Grid to be unchanged from previous state and still have only 4 columns shown', () => {
    const newColumnList = ['Duration (days)', '% Complete', 'Finish', 'Effort Driven'];

    cy.get('.grid1')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));
  });

  it('should open the Grid Menu on 1st Grid and also expect to only have 4 columns checked (visible)', () => {
    let gridUid = '';
    cy.get('.grid1').find('button.slick-grid-menu-button').click({ force: true });

    cy.get('.grid1 .slickgrid-container')
      .should(($grid) => {
        const classes = $grid.prop('className').split(' ');
        gridUid = classes.find((className) => /slickgrid_.*/.test(className));
        expect(gridUid).to.not.be.null;
      })
      .then(() => {
        cy.get(`.slick-grid-menu.${gridUid}`)
          .find('.slick-column-picker-list')
          .children('li')
          .each(($li, index) => {
            if (index <= 5) {
              const $input = $li.find('input');
              const $label = $li.find('label');
              if ($label.text() === 'Title' || $label.text() === 'Start') {
                expect($input.prop('checked')).to.eq(false);
              } else {
                expect($input.prop('checked')).to.eq(true);
              }
              expect($label.text()).to.eq(fullTitles[index]);
            }
          });
      });

    cy.get('.grid1').get('.slick-grid-menu:visible').find('.close').click({ force: true });
  });

  it('should toggle (remove) Pagination from 2nd grid and not expect any Pagination DOM element', () => {
    // sort by Title
    cy.get('.grid2 .slick-header-column:nth(0)').click();

    cy.get('.grid2 .slick-pagination').should('exist');

    cy.get('[data-text="toggle-pagination-btn"]').click();

    cy.get('.grid2 .slick-pagination').should('not.exist');

    cy.get('.search-filter.filter-title').clear().type('44');

    cy.get('.grid2').find('.slick-viewport-top.slick-viewport-left').scrollTo('bottom').wait(10);

    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 14}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 544');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 15}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 644');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 16}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 744');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 17}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 844');
    cy.get(`.grid2 [style="transform: translateY(${GRID_ROW_HEIGHT * 18}px);"] > .slick-cell:nth(0)`).should('contain', 'Task 944');
  });

  it('should toggle again (show) the Pagination and expect to see it show it again below the grid at Page 1', () => {
    cy.get('[data-text="toggle-pagination-btn"]').click();

    cy.get('.grid2 .slick-pagination').should('exist');

    cy.get('.grid2')
      .find('[data-test=page-number-input]')
      .invoke('val')
      .then((pageNumber) => expect(pageNumber).to.eq('1'));
    cy.get('.grid2').find('[data-test=page-number-input]').click();
    cy.get('.grid2').find('[data-test=page-count]').contains('4');
    cy.get('.grid2').find('[data-test=item-from]').contains('1');
    cy.get('.grid2').find('[data-test=item-to]').contains('5');
    cy.get('.grid2').find('[data-test=total-items]').contains('19');
  });

  describe('Grid Menu with sub-menus', () => {
    it('should be able to open Grid Menu and click on Export->Text and expect alert triggered with Text Export', () => {
      const subCommands1 = ['Text', 'Excel'];
      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.get('.grid2').find('button.slick-grid-menu-button').click({ force: true });

      cy.get('.slick-grid-menu.slick-menu-level-0 .slick-menu-command-list').find('.slick-menu-item').contains('Exports').click();

      cy.get('.slick-grid-menu.slick-menu-level-1 .slick-menu-command-list')
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

      cy.get('.slick-grid-menu.slick-menu-level-1 .slick-menu-command-list')
        .find('.slick-menu-item')
        .contains('Text (tab delimited)')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Exporting as Text (tab delimited)'));
    });

    it('should be able to open Grid Menu and click on Export->Excel->xlsx and expect alert triggered with Excel (xlsx) Export', () => {
      const subCommands1 = ['Text', 'Excel'];
      const subCommands2 = ['Excel (csv)', 'Excel (xlsx)'];
      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.get('.grid2').find('button.slick-grid-menu-button').click({ force: true });

      cy.get('.slick-grid-menu.slick-menu-level-0 .slick-menu-command-list').find('.slick-menu-item').contains('Exports').click();

      cy.get('.slick-grid-menu.slick-menu-level-1 .slick-menu-command-list')
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

      cy.get('.slick-submenu').should('have.length', 1);
      cy.get('.slick-grid-menu.slick-menu-level-1 .slick-menu-command-list').find('.slick-menu-item').contains('Excel').click();

      cy.get('.slick-grid-menu.slick-menu-level-2 .slick-menu-command-list').as('subMenuList2');

      cy.get('@subMenuList2').find('.slick-menu-title').contains('available formats');

      cy.get('@subMenuList2')
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands2[index]));
      cy.get('.slick-submenu').should('have.length', 2);

      cy.get('.slick-grid-menu.slick-menu-level-2 .slick-menu-command-list')
        .find('.slick-menu-item')
        .contains('Excel (xlsx)')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Exporting as Excel (xlsx)'));
      cy.get('.slick-submenu').should('have.length', 0);
    });

    it('should open Export->Excel context sub-menu then open Feedback->ContactUs sub-menus and expect previous Export menu to no longer exists', () => {
      const subCommands1 = ['Text', 'Excel'];
      const subCommands2 = ['Request update from supplier', '', 'Contact Us'];
      const subCommands2_1 = ['Email us', 'Chat with us', 'Book an appointment'];

      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.get('[data-test="external-gridmenu2-btn"]').click();

      cy.get('.slick-grid-menu.slick-menu-level-0 .slick-menu-command-list').find('.slick-menu-item').contains('Export').click();

      cy.get('.slick-grid-menu.slick-menu-level-1 .slick-menu-command-list')
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

      // click different sub-menu
      cy.get('.slick-grid-menu.slick-menu-level-0').find('.slick-menu-item').contains('Feedback').should('exist').trigger('mouseover'); // mouseover or click should work

      cy.get('.slick-submenu').should('have.length', 1);
      cy.get('.slick-grid-menu.slick-menu-level-1')
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands2[index]));

      // click on Feedback->ContactUs
      cy.get('.slick-grid-menu.slick-menu-level-1.dropright') // right align
        .find('.slick-menu-item')
        .contains('Contact Us')
        .should('exist')
        .click();

      cy.get('.slick-submenu').should('have.length', 2);
      cy.get('.slick-grid-menu.slick-menu-level-2.dropright') // right align
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.eq(subCommands2_1[index]));

      cy.get('.slick-grid-menu.slick-menu-level-2');

      cy.get('.slick-grid-menu.slick-menu-level-2 .slick-menu-command-list')
        .find('.slick-menu-item')
        .contains('Chat with us')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Command: contact-chat'));

      cy.get('.slick-submenu').should('have.length', 0);
    });
  });

  describe('Change 2nd grid dataset', () => {
    it('should change dataset of 2nd grid and expect 285 total items with 5 visible items', () => {
      cy.get('[data-test="change-data2"]').click();

      cy.get('[data-test=page-number-input]')
        .invoke('val')
        .then((pageNumber) => expect(pageNumber).to.eq('1'));
      cy.get('[data-test=page-count]').contains('4');
      cy.get('[data-test=item-from]').contains('1');
      cy.get('[data-test=item-to]').contains('5');
      cy.get('[data-test=total-items]').contains('20');
    });

    it('should display all rows that ends with 44', () => {
      cy.get('.grid2 [data-row="0"] > .slick-cell:nth(0)').should('contain', 'Task 1044');
      cy.get('.grid2 [data-row="1"] > .slick-cell:nth(0)').should('contain', 'Task 144');
      cy.get('.grid2 [data-row="2"] > .slick-cell:nth(0)').should('contain', 'Task 244');
      cy.get('.grid2 [data-row="3"] > .slick-cell:nth(0)').should('contain', 'Task 344');
      cy.get('.grid2 [data-row="4"] > .slick-cell:nth(0)').should('contain', 'Task 44');
    });

    it('should not be able to uncheck all columns', () => {
      cy.get('.grid2').find('.slick-header-columns .slick-header-column').should('have.length', fullTitles.length);

      cy.get('.grid2')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));

      cy.get('.grid2').find('.slick-header-column').first().trigger('mouseover').trigger('contextmenu').invoke('show');
      cy.get('.slick-column-picker')
        .find('.slick-column-picker-list')
        .children()
        .each(($child, index) => {
          if (index < fullTitles.length) {
            cy.wrap($child).children('label').click();
          }
        });

      cy.get('.grid2').find('.slick-header-columns .slick-header-column').should('have.length', 1);
    });
  });
});
