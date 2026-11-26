describe('Example 24 - Cell Menu & Context Menu Plugins', () => {
  const GRID_ROW_HEIGHT = 35;
  const fullEnglishTitles = ['#', 'Title', '% Complete', 'Start', 'Finish', 'Priority', 'Completed', 'Action'];
  const fullFrenchTitles = ['#', 'Titre', '% Achevée', 'Début', 'Fin', 'Priorité', 'Terminé', 'Action'];

  const getTaskRow = (title: string) => cy.contains('#grid24 .slick-row .slick-cell.l1', new RegExp(`^${title}$`)).closest('.slick-row');
  const getTaskCell = (title: string, column: number) => getTaskRow(title).find(`.slick-cell.l${column}`);
  const scrollToRow = (row: number) => {
    const scrollTop = GRID_ROW_HEIGHT * row;
    cy.get('#grid24 .slick-vertical-scroller').scrollTo(0, scrollTop).should('have.prop', 'scrollTop', scrollTop);
  };
  const openCellMenu = (title: string) => {
    getTaskRow(title).find('.cell-menu-dropdown-outline').should('not.have.class', 'disabled').click({ scrollBehavior: false });
    cy.get('.slick-cell-menu.slick-menu-level-0').should('be.visible');
  };
  const openContextMenu = (title: string, column = 1) => {
    getTaskCell(title, column).rightclick({ scrollBehavior: false });
    cy.get('.slick-context-menu.slick-menu-level-0').should('be.visible');
  };

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example24`);
    cy.get('h2').should('contain', 'Example 24: Cell Menu & Context Menu Plugins');
    cy.get('[data-test="toggle-subtitle"]').click();
  });

  describe('English Locale', () => {
    it('should have exact Column Titles in the grid', () => {
      cy.get('#grid24')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.contain(fullEnglishTitles[index]));
    });

    it('should have first row with "Task 0" and a Priority set to a Yellow Star (low) with the Action cell disabled and not clickable', () => {
      getTaskCell('Task 0', 1).contains('Task 0');

      getTaskCell('Task 0', 5).find('.mdi-star.yellow');

      getTaskCell('Task 0', 6).find('.mdi-check.checkmark-icon');

      getTaskCell('Task 0', 7).find('.disabled').contains('Action');

      cy.get('.slick-cell-menu').should('not.exist');
    });

    it('should expect the Context Menu to not have the "Help" menu when there is Completed set to True', () => {
      const commands = ['Copy', 'Export to Excel', '', 'Delete Row', '', 'Disabled Command', '', 'Exports', 'Feedback'];

      getTaskCell('Task 0', 1).contains('Task 0');

      openContextMenu('Task 0', 1);

      cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
        .find('.slick-menu-item')
        .each(($command, index) => {
          expect($command.text()).to.contain(commands[index]);
          expect($command.text()).not.include('Help');
        });
    });

    it('should be able to click on the Context Menu (x) close button, on top right corner, to close the menu', () => {
      cy.get('.slick-context-menu.slick-menu-level-0').should('exist');

      cy.get('.slick-context-menu button.close').click();
    });

    it('should expect a "Command 2" to be disabled and not clickable (menu will remain open), in that same Action menu', () => {
      scrollToRow(12);
      openCellMenu('Task 12');

      cy.get('.slick-cell-menu .slick-menu-item.slick-menu-item-disabled').contains('Command 2').click({ force: true });

      cy.get('.slick-cell-menu.slick-menu-level-0').should('exist');
    });

    it('should expect the Context Menu now have the "Help" menu when Completed is set to False', () => {
      cy.get('.slick-cell-menu button.close').click();
      scrollToRow(0);
      const commands = ['Copy', 'Export to Excel', '', 'Delete Row', '', 'Help', 'Disabled Command', '', 'Exports', 'Feedback'];

      getTaskCell('Task 1', 1).contains('Task 1');

      openContextMenu('Task 1', 6);

      cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(commands[index]));

      cy.get('.slick-context-menu button.close').click();
    });

    it('should be able to click on the Action Cell Menu (x) close button, on top right corner, to close the menu', () => {
      openCellMenu('Task 3');

      cy.get('.slick-cell-menu.slick-menu-level-0').should('exist');

      cy.get('.slick-cell-menu button.close').click();

      cy.get('.slick-cell-menu.slick-menu-level-0').should('not.exist');
    });

    it('should be able to delete first row by using the "Delete Row" command from the Context Menu', () => {
      cy.window().then((win) => cy.stub(win, 'confirm').returns(true));

      getTaskCell('Task 0', 1).contains('Task 0');

      openContextMenu('Task 0', 1);

      cy.get('.slick-context-menu .slick-menu-command-list')
        .find('.slick-menu-item.red')
        .find('.slick-menu-content.bold')
        .should('exist')
        .contains('Delete Row')
        .click();

      cy.contains('#grid24 .slick-row .slick-cell.l1', /^Task 0$/).should('not.exist');
    });

    it('should be able to delete the 3rd row "Task 3" by using the "Delete Row" command from the Action Cell Menu', () => {
      cy.window().then((win) => cy.stub(win, 'confirm').returns(true));

      getTaskCell('Task 3', 1).contains('Task 3');

      openCellMenu('Task 3');

      cy.get('.slick-cell-menu .slick-menu-command-list')
        .find('.slick-menu-item.red')
        .find('.slick-menu-content.bold')
        .should('exist')
        .contains('Delete Row')
        .click();

      cy.contains('#grid24 .slick-row .slick-cell.l1', /^Task 3$/).should('not.exist');
    });

    it('should check Context Menu "menuUsabilityOverride" condition and expect to not be able to open Context Menu from rows than are >= to Task 21', () => {
      scrollToRow(25);

      // Two rows were deleted above, so Task 27 is now at row index 25.
      getTaskCell('Task 27', 1).rightclick({ scrollBehavior: false });

      cy.get('.slick-context-menu .slick-menu-command-list').should('not.exist');
    });

    it('should scroll back to top row and be able to open Context Menu', () => {
      scrollToRow(0);

      openContextMenu('Task 1', 1);

      cy.get('.slick-context-menu .slick-menu-command-list').should('exist');

      cy.get('.slick-context-menu button.close').click();
    });
  });

  describe('French Locale', () => {
    it('should switch locale to French', () => {
      cy.get('[data-test=selected-locale]').should('contain', 'en.json');
      cy.get('[data-test=language-button]').click();
      cy.get('[data-test=selected-locale]').should('contain', 'fr.json');
    });

    it('should have exact Column Titles in the grid', () => {
      cy.get('#grid24')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.contain(fullFrenchTitles[index]));
    });

    it('should have first row with "Tâche 1" and a Priority set to a Orange Star (medium) with the Action cell disabled and not clickable', () => {
      getTaskCell('Tâche 1', 1).contains('Tâche 1');

      getTaskCell('Tâche 1', 5).find('.mdi-star.orange');

      getTaskCell('Tâche 1', 7).find('.disabled').contains('Action');

      cy.get('.slick-cell-menu').should('not.exist');
    });

    it('should expect the Context Menu to not have the "Aide" menu when there is Completed set to False', () => {
      const commands = [
        'Copier',
        'Exporter vers Excel',
        '',
        'Supprimer la ligne',
        '',
        'Aide',
        'Commande désactivée',
        '',
        'Exports',
        'Feedback',
      ];

      getTaskCell('Tâche 1', 1).contains('Tâche 1');

      openContextMenu('Tâche 1', 1);

      cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(commands[index]));
    });

    it('should be able to click on the Context Menu (x) close button, on top right corner, to close the menu', () => {
      cy.get('.slick-context-menu.slick-menu-level-0').should('exist');

      cy.get('.slick-context-menu button.close').click();
    });

    it('should expect a "Command 2" to be enabled and clickable in that same Action menu', () => {
      const stub = cy.stub();
      cy.window().then((win) => cy.stub(win, 'alert').callsFake(stub));

      openCellMenu('Tâche 6');

      cy.get('.slick-cell-menu .slick-menu-item')
        .contains('Command 2')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Command 2'));
    });

    it('should expect the Context Menu now have the "Aide" menu when Completed is set to False', () => {
      const commands = [
        'Copier',
        'Exporter vers Excel',
        '',
        'Supprimer la ligne',
        '',
        'Aide',
        'Commande désactivée',
        '',
        'Exports',
        'Feedback',
      ];

      getTaskCell('Tâche 1', 1).contains('Tâche 1');

      openContextMenu('Tâche 1', 6);

      cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(commands[index]));

      cy.get('.slick-context-menu button.close').click();
    });

    it('should be able to click on the Action Cell Menu (x) close button, on top right corner, to close the menu', () => {
      openCellMenu('Tâche 6');

      cy.get('.slick-cell-menu.slick-menu-level-0').should('exist');

      cy.get('.slick-cell-menu button.close').click();

      cy.get('.slick-cell-menu.slick-menu-level-0').should('not.exist');
    });

    it('should be able to delete first row by using the "Supprimer la ligne" command from the Context Menu', () => {
      cy.window().then((win) => cy.stub(win, 'confirm').returns(true));

      getTaskCell('Tâche 1', 1).contains('Tâche 1');

      openContextMenu('Tâche 1', 1);

      cy.get('.slick-context-menu .slick-menu-command-list')
        .find('.slick-menu-item.red')
        .find('.slick-menu-content.bold')
        .should('exist')
        .contains('Supprimer la ligne')
        .click();

      cy.contains('#grid24 .slick-row .slick-cell.l1', /^Tâche 1$/).should('not.exist');
    });

    it('should be able to delete the 4th row "Tâche 6" by using the "Supprimer la ligne" command from the Action Cell Menu', () => {
      cy.window().then((win) => cy.stub(win, 'confirm').returns(true));

      getTaskCell('Tâche 6', 1).contains('Tâche 6');

      openCellMenu('Tâche 6');

      cy.get('.slick-cell-menu .slick-menu-command-list')
        .find('.slick-menu-item.red')
        .find('.slick-menu-content.bold')
        .should('exist')
        .contains('Supprimer la ligne')
        .click();

      cy.contains('#grid24 .slick-row .slick-cell.l1', /^Tâche 6$/).should('not.exist');
    });

    it('should switch back locale to English before leaving', () => {
      cy.get('[data-test=selected-locale]').should('contain', 'fr.json');
      cy.get('[data-test=language-button]').click();
      cy.get('[data-test=selected-locale]').should('contain', 'en.json');
    });
  });

  describe('with sub-menus', () => {
    it('should be able to open Context Menu from any other cell and click on Export->Text and expect alert triggered with Text Export', () => {
      const subCommands1 = ['Text', 'Excel'];
      const stub = cy.stub();
      cy.window().then((win) => cy.stub(win, 'alert').callsFake(stub));

      getTaskCell('Task 2', 1).should('contain', 'Task 2');
      openContextMenu('Task 2', 1);

      cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
        .find('.slick-menu-item .slick-menu-content')
        .contains(/^Exports$/)
        .click();

      cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

      cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
        .find('.slick-menu-item')
        .contains('Text')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Exporting as Text (tab delimited)'));
    });

    it('should be able to open Context Menu and click on Export->Excel-> sub-commands to see 1 context menu + 1 sub-menu then clicking on Text should call alert action', () => {
      const subCommands1 = ['Text', 'Excel'];
      const subCommands2 = ['Excel (csv)', 'Excel (xlsx)'];
      const stub = cy.stub();
      cy.window().then((win) => cy.stub(win, 'alert').callsFake(stub));

      getTaskCell('Task 2', 1).should('contain', 'Task 2');
      openContextMenu('Task 2', 1);

      cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
        .find('.slick-menu-item .slick-menu-content')
        .contains(/^Exports$/)
        .click();

      cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
        .should('exist')
        .find('.slick-menu-item .slick-menu-content')
        .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

      cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
        .find('.slick-menu-item .slick-menu-content')
        .contains('Excel')
        .click();

      cy.get('.slick-context-menu.slick-menu-level-2 .slick-menu-command-list').as('subMenuList2');

      cy.get('@subMenuList2').find('.slick-menu-title').contains('available formats');

      cy.get('@subMenuList2')
        .should('exist')
        .find('.slick-menu-item .slick-menu-content')
        .each(($command, index) => expect($command.text()).to.contain(subCommands2[index]));

      cy.get('.slick-context-menu.slick-menu-level-2 .slick-menu-command-list')
        .find('.slick-menu-item .slick-menu-content')
        .contains('Excel (xlsx)')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Exporting as Excel (xlsx)'));
    });

    it('should open Export->Excel context sub-menu then open Feedback->ContactUs sub-menus and expect previous Export menu to no longer exists', () => {
      const subCommands1 = ['Text', 'Excel'];
      const subCommands2 = ['Request update from supplier', '', 'Contact Us'];
      const subCommands2_1 = ['Email us', 'Chat with us', 'Book an appointment'];

      const stub = cy.stub();
      cy.window().then((win) => cy.stub(win, 'alert').callsFake(stub));

      openContextMenu('Task 2', 6);

      cy.get('.slick-context-menu').should('be.visible');
      cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
        .find('.slick-menu-item .slick-menu-content')
        .contains(/^Exports$/)
        .click();

      cy.get('.slick-context-menu').should('be.visible');
      cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
        .should('exist')
        .find('.slick-menu-item .slick-menu-content')
        .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

      // click different sub-menu
      cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
        .find('.slick-menu-item .slick-menu-content')
        .contains('Feedback')
        .should('exist')
        .click();

      cy.get('.slick-submenu').should('have.length', 1);
      cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
        .should('exist')
        .find('.slick-menu-item .slick-menu-content')
        .each(($command, index) => expect($command.text()).to.contain(subCommands2[index]));

      // click on Feedback->ContactUs
      cy.get('.slick-context-menu').should('be.visible');
      cy.get('.slick-context-menu.slick-menu-level-1')
        .find('.slick-menu-item .slick-menu-content')
        .contains('Contact Us')
        .should('exist')
        .trigger('mouseover'); // mouseover or click should work

      cy.get('.slick-context-menu').should('be.visible');
      cy.get('.slick-submenu').should('have.length', 2);
      cy.get('.slick-context-menu.slick-menu-level-2')
        .should('exist')
        .find('.slick-menu-item .slick-menu-content')
        .each(($command, index) => expect($command.text()).to.eq(subCommands2_1[index]));

      cy.get('.slick-context-menu.slick-menu-level-2').should('be.visible');

      cy.get('.slick-context-menu.slick-menu-level-2 .slick-menu-command-list')
        .find('.slick-menu-item .slick-menu-content')
        .contains('Chat with us')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Command: contact-chat'));

      cy.get('.slick-submenu').should('have.length', 0);
    });
  });
});
