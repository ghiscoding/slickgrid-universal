import { format, addDay } from '@formkit/tempo';

// eslint-disable-next-line n/file-extension-in-import
import { changeTimezone, zeroPadding } from '../plugins/utilities';

describe('Example 12 - Composite Editor Modal', () => {
  const fullPreTitles = ['', 'Common Factor', 'Analysis', 'Period', 'Item', ''];
  const fullTitles = [
    '',
    ' Title ',
    'Duration',
    'Cost',
    '% Complete',
    'Complexity',
    'Start',
    'Completed',
    'Finish',
    'Product',
    'Country of Origin',
    'Action',
  ];

  const GRID_ROW_HEIGHT = 33;
  const UNSAVED_RGB_COLOR = 'rgb(221, 219, 218)';

  beforeEach(() => {
    // create a console.log spy for later use
    cy.window().then((win) => {
      cy.spy(win.console, 'log');
    });
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example12`);
    cy.get('h3').should('contain', 'Example 12 - Composite Editor Modal');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid', () => {
    cy.get('.grid12')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('.grid12')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should display 2 different tooltips when hovering icons on "Title" column', () => {
    cy.get('.slick-column-name').as('title-column');
    cy.get('@title-column').find('.mdi-alert-outline').trigger('mouseover');

    cy.get('.slick-custom-tooltip').should('be.visible');
    cy.get('.slick-custom-tooltip .tooltip-body').contains('Task must always be followed by a number');

    cy.get('@title-column').find('.mdi-information-outline').trigger('mouseover');

    cy.get('.slick-custom-tooltip').should('be.visible');
    cy.get('.slick-custom-tooltip .tooltip-body').contains('Title is always rendered as UPPERCASE');
  });

  it('should have "TASK 0" (uppercase) incremented by 1 after each row', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`)
      .contains('TASK 0', { matchCase: false })
      .should('have.css', 'text-transform', 'uppercase');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).contains('TASK 1', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).contains('TASK 2', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).contains('TASK 3', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(1)`).contains('TASK 4', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 5}px);"] > .slick-cell:nth(1)`).contains('TASK 5', { matchCase: false });
  });

  it('should be able to change "Duration" values of first 4 rows', () => {
    // change duration
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`)
      .should('contain', 'days')
      .click();
    cy.get('.editor-duration').type('0{enter}');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`)
      .should('contain', '0 day')
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(2)`)
      .click()
      .type('1{enter}');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(2)`)
      .should('contain', '1 day')
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(2)`)
      .click()
      .type('2{enter}');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(2)`)
      .should('contain', '2 days')
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should be able to change "Title" values of row indexes 1-3', () => {
    // change title
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`)
      .contains('TASK 1', { matchCase: false })
      .click();
    cy.get('.editor-title').type('task 1111');
    cy.get('.editor-title .editor-footer .btn-save').click();
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`)
      .contains('TASK 1111', { matchCase: false })
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`)
      .contains('TASK 2', { matchCase: false })
      .click();
    cy.get('.editor-title').type('task 2222');
    cy.get('.editor-title .editor-footer .btn-save').click();
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`)
      .contains('TASK 2222', { matchCase: false })
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should be able to change "% Complete" values of row indexes 2-4', () => {
    // change % complete
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 5).trigger('change', { force: true });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(4)`)
      .should('contain', '5')
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 6).trigger('change', { force: true });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(4)`)
      .should('contain', '6')
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should not be able to change the "Finish" dates on first 2 rows', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`)
      .should('contain', '')
      .click({ force: true }); // this date should also always be initially empty
    cy.get('[data-vc-date-today]:visible button').should('not.exist');

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`)
      .should('contain', '')
      .click({ force: true }); // this date should also always be initially empty
    cy.get('[data-vc-date-today]:visible button').should('not.exist');
  });

  it('should be able to change "Completed" values of row indexes 2-4', () => {
    // change Completed
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`).click();
    cy.get('.editor-completed').check();
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(7)`).click();
    cy.get('.editor-completed').check();
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(7)`).click();
    cy.get('.editor-completed').check();
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
  });

  it('should be able to change "Finish" values of row indexes 0-2', () => {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = changeTimezone(now, tz);

    const currentDate = today.getDate();
    let currentMonth: number | string = today.getMonth() + 1; // month is zero based, let's add 1 to it
    if (currentMonth < 10) {
      currentMonth = `0${currentMonth}`; // add zero padding
    }
    const currentYear = today.getFullYear();

    // get yesterday/today dates
    const yesterdayDate = format(addDay(new Date(), -1), 'YYYY-MM-DD');
    const todayDate = format(new Date(), 'YYYY-MM-DD');

    // change Finish date to today's date
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`)
      .should('contain', '')
      .click(); // this date should also always be initially empty
    // any dates lower than today should be disabled
    cy.get(`[data-vc-date=${yesterdayDate}]`).should('have.attr', 'data-vc-date-disabled');
    cy.get(`[data-vc-date=${todayDate}]`).should('not.have.attr', 'data-vc-date-disabled');
    cy.get('[data-vc-date-today]:visible button').click('bottom', { force: true });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`)
      .should('contain', `${zeroPadding(currentMonth)}/${zeroPadding(currentDate)}/${currentYear}`)
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`).click();
    cy.get('[data-vc-date-today]:visible button').click('bottom', { force: true });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`)
      .should('contain', `${zeroPadding(currentMonth)}/${zeroPadding(currentDate)}/${currentYear}`)
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`).click();
    cy.get('[data-vc-date-today]:visible button').click('bottom', { force: true });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`)
      .should('contain', `${zeroPadding(currentMonth)}/${zeroPadding(currentDate)}/${currentYear}`)
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);

    cy.get('.unsaved-editable-field').should('have.length', 13);
  });

  it('should undo last edit and expect the date editor to be opened as well when clicking the associated last undo with editor button', () => {
    cy.get('[data-test=undo-open-editor-btn]').click();

    cy.get('.vc').should('exist');

    cy.get('.unsaved-editable-field').should('have.length', 12);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`)
      .should('contain', '')
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should undo last edit and expect the date editor to NOT be opened when clicking undo last edit button', () => {
    cy.get('[data-test=undo-last-edit-btn]').click();

    cy.get('.vc:visible').should('not.exist');

    cy.get('.unsaved-editable-field').should('have.length', 11);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`)
      .should('contain', '')
      .get('.editing-field')
      .should('have.css', 'border')
      .and('contain', `solid ${UNSAVED_RGB_COLOR}`);
  });

  it('should click on the "Save" button and expect 2 console log calls with the queued items & also expect no more unsaved cells', () => {
    cy.get('[data-test=save-all-btn]').click();

    cy.get('.unsaved-editable-field').should('have.length', 0);

    cy.window().then((win) => {
      expect(win.console.log).to.have.callCount(2);
    });
  });

  it('should be able to toggle the grid to readonly', () => {
    cy.get('[data-test=toggle-readonly-btn]').click();

    cy.get('.editing-field').should('have.length', 0);
  });

  it('should be able to toggle back the grid to editable', () => {
    cy.get('[data-test=toggle-readonly-btn]').click();

    cy.get('.editing-field').should('not.have.length', 0);
  });

  it('should open the Composite Editor (Create Item) and expect all form inputs to be empty', () => {
    cy.get('[data-test="open-modal-create-btn"]').click();

    cy.get('.slick-editor-modal-title').contains('Inserting New Task');

    cy.get('textarea').should('be.empty');
    cy.get('.item-details-editor-container .input-group-text').contains('0');
    cy.get('.editor-checkbox').should('be.not.checked');
    cy.get('.item-details-container.editor-product .autocomplete').should('be.empty');
    cy.get('.item-details-container.editor-duration .editor-text').should('be.empty');
    cy.get('.item-details-container.editor-start input.date-picker').invoke('val').should('be.empty');
    cy.get('.item-details-container.editor-finish input.date-picker').invoke('val').should('be.empty');
    cy.get('.item-details-container.editor-finish input.date-picker').should('be.disabled');
    cy.get('.item-details-container.editor-origin .autocomplete').should('be.empty');
  });

  it('should not be able to save, neither expect the modal window to close when having invalid fields', () => {
    cy.get('.btn-save').contains('Save').click();

    cy.get('.slick-editor-modal').should('exist');
    cy.get('.item-details-container.editor-title .item-details-validation').contains('* This is a required field.');
  });

  it('should fill in the (Create Item) as Task 7777 and expect a new row in the grid', () => {
    cy.get('textarea').type('Task 7777');
    cy.get('.item-details-container.editor-title .item-details-validation').should('be.empty');
    cy.get('.item-details-container.editor-title .modified').should('have.length', 1);

    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 44)
      .trigger('change', { force: true });
    cy.get('.item-details-editor-container .input-group-text').contains('44');
    cy.get('.item-details-container.editor-percentComplete .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-product .autocomplete').type('sleek');
    cy.get('.slick-autocomplete.autocomplete-custom-four-corners').should('be.visible');
    cy.get('.slick-autocomplete.autocomplete-custom-four-corners').find('div:nth(0)').click();
    cy.get('.item-details-container.editor-product .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-duration .editor-text').type('33');
    cy.get('.item-details-container.editor-duration .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-origin .autocomplete').type('au');
    cy.get('.slick-autocomplete:visible').find('div:nth(1)').click();
    cy.get('.item-details-container.editor-origin .autocomplete')
      .invoke('val')
      .then((text) => expect(text).to.eq('Austria'));
    cy.get('.item-details-container.editor-origin .modified').should('have.length', 1);

    cy.get('.btn-save').contains('Save').click();
    cy.get('.slick-editor-modal').should('not.exist');

    cy.window().then((win) => {
      expect(win.console.log).to.be.calledWithMatch('create item data context', {
        id: 501,
        title: 'Task 7777',
        completed: false,
        complexity: '',
        duration: 33,
        finish: '',
        percentComplete: 44,
        start: '',
        origin: { name: 'Austria', code: 'AT' },
        product: { id: 0, icon: 'mdi-arrow-collapse', itemName: 'Sleek Metal Computer', itemTypeName: 'I', listPrice: 2100.23 },
      });
    });
  });

  it('should have new TASK 7777 displayed on first row', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).contains('TASK 7777', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '33 days');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '44');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(5)`)
      .find('.editing-field')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 0);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`).should('be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(9)`).should('contain', 'Sleek Metal Computer');

    // next few rows Title should be unchanged
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).contains('TASK 0', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).contains('TASK 1111', { matchCase: false });
  });

  it('should fill in the (Create Item) form inputs with Task 8888 and expect a new row in the grid', () => {
    cy.get('[data-test="open-modal-create-btn"]').click();
    cy.get('.slick-editor-modal-title').contains('Inserting New Task');

    cy.get('textarea').type('Task');
    cy.get('.item-details-container.editor-title .item-details-validation').contains(
      '* Your title is invalid, it must start with "Task" followed by a number.'
    );
    cy.get('textarea').type(' 8888');
    cy.get('.item-details-container.editor-title .item-details-validation').should('be.empty');
    cy.get('.item-details-container.editor-title .modified').should('have.length', 1);

    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 5)
      .trigger('change', { force: true });
    cy.get('.item-details-editor-container .input-group-text').contains('5');
    cy.get('.item-details-container.editor-percentComplete .modified').should('have.length', 1);

    cy.get('.editor-completed .editor-checkbox').check();
    cy.get('.item-details-container.editor-completed .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-product .autocomplete').type('granite');
    cy.get('.slick-autocomplete.autocomplete-custom-four-corners').should('be.visible');
    cy.get('.slick-autocomplete.autocomplete-custom-four-corners').find('div:nth(0)').click();
    cy.get('.item-details-container.editor-product .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-duration .editor-text').type('22');
    cy.get('.item-details-container.editor-duration .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-finish > .item-details-validation').contains(
      '* You must provide a "Finish" date when "Completed" is checked.'
    );
    cy.get('.item-details-container.editor-finish input.date-picker').click({ force: true });
    cy.get('[data-vc-date-today]:visible button').click('bottom', { force: true });
    cy.get('.item-details-container.editor-finish .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-origin .autocomplete').type('c');
    cy.get('.slick-autocomplete:visible').find('div:nth(1)').click();
    cy.get('.item-details-container.editor-origin .autocomplete')
      .invoke('val')
      .then((text) => expect(text).to.eq('Antarctica'));
    cy.get('.item-details-container.editor-origin .modified').should('have.length', 1);

    cy.get('.btn-save').contains('Save').click();
    cy.get('.slick-editor-modal').should('not.exist');

    cy.window().then((win) => {
      expect(win.console.log).to.be.calledWithMatch('create item data context', {
        id: 502,
        title: 'Task 8888',
        completed: true,
        complexity: '',
        duration: 22,
        percentComplete: 5,
        start: '',
        origin: { name: 'Antarctica', code: 'AQ' },
        product: { id: 1, icon: 'mdi-arrow-expand', itemName: 'Tasty Granite Table', itemTypeName: 'I', listPrice: 3200.12 },
      });
    });
  });

  it('should have new TASK 8888 displayed on first row', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).contains('TASK 8888', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '22 days');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '5');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(5)`)
      .find('.editing-field')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(9)`).should('contain', 'Tasty Granite Table');

    // next few rows Title should be unchanged
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).contains('TASK 8888', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).contains('TASK 7777', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).contains('TASK 0', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).contains('TASK 1111', { matchCase: false });
  });

  it('should open the Composite Editor (Edit Item) and expect all form inputs to be filled with TASK 8888 data of previously created item', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('[data-test="open-modal-edit-btn"]').click();
    cy.get('.slick-editor-modal-title').contains('Editing - Task 8888 (id: 502)');

    cy.get('textarea').contains('Task 8888').type('Task 8899');
    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 7)
      .trigger('change', { force: true });
    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 17)
      .trigger('change', { force: true });
    cy.get('.item-details-container.editor-percentComplete .modified').should('have.length', 1);

    cy.get('.item-details-editor-container .editor-checkbox').uncheck();
    cy.get('.item-details-container.editor-duration input.editor-text').type('33');
    cy.get('.item-details-container.editor-duration .modified').should('have.length', 1);

    cy.get('.modified').should('have.length.greaterThan', 1);

    cy.get('.btn-save').contains('Save').click();
    cy.get('.slick-editor-modal').should('not.exist');
  });

  it('should have new TASK 8899 displayed on first row', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).contains('TASK 8899', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '33 days');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '17');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(5)`)
      .find('.editing-field')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('not.exist');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`).should('be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(9)`).should('contain', 'Tasty Granite Table');

    // next few rows Title should be unchanged
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).contains('TASK 7777', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).contains('TASK 0', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).contains('TASK 1111', { matchCase: false });
  });

  it('should open the Composite Editor (Mass Update) and be able to change some of the inputs in the form', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(3)`).click();
    cy.get('[data-test="open-modal-mass-update-btn"]').wait(200).click();
    cy.get('.slick-editor-modal-title').should('contain', 'Mass Update All Records');
    cy.get('.footer-status-text').should('contain', 'All 502 records selected');

    cy.get('.item-details-editor-container .editor-checkbox').check();
    cy.get('.item-details-container.editor-completed .modified').should('have.length', 1);

    cy.get('.item-details-editor-container div.editor-complexity').click();
    cy.get('[data-name=editor-complexity].ms-drop > ul > li > label:nth(2)').contains('Straightforward').click();
    cy.get('.item-details-container.editor-complexity .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-finish > .item-details-validation').contains(
      '* You must provide a "Finish" date when "Completed" is checked.'
    );
    cy.get('.item-details-container.editor-finish .date-picker').click().click();
    cy.get('[data-vc-date-today]:visible button').click();
    cy.get('.item-details-container.editor-finish .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-origin .autocomplete').type('bel');
    cy.get('.slick-autocomplete:visible').find('div:nth(1)').click();
    cy.get('.item-details-container.editor-origin .modified').should('have.length', 1);
    cy.get('.item-details-container.editor-origin .autocomplete')
      .invoke('val')
      .then((text) => expect(text).to.eq('Belgium'));

    cy.get('.btn-save').contains('Apply Mass Update').click();
    cy.get('.validation-summary').contains('Unfortunately we only accept a minimum of 50% Completion...');

    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 5)
      .trigger('change', { force: true });
    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 51)
      .trigger('change', { force: true });
    cy.get('.item-details-editor-container .input-group-text').contains('51');

    cy.get('.btn-save').contains('Apply Mass Update').click();
    cy.get('.slick-editor-modal').should('not.exist');
  });

  it('should have updated values in the entire grid', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
  });

  it('should open the Composite Editor (Mass Update) change some inputs', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(3)`).click();
    cy.get('[data-test="open-modal-mass-update-btn"]').wait(200).click();
    cy.get('.slick-editor-modal-title').should('contain', 'Mass Update All Records');
    cy.get('.footer-status-text').should('contain', 'All 502 records selected');

    cy.get('.item-details-editor-container .editor-checkbox').check();
    cy.get('.item-details-container.editor-completed .modified').should('have.length', 1);

    cy.get('.item-details-editor-container div.editor-complexity').click();
    cy.get('[data-name=editor-complexity].ms-drop > ul > li > label:nth(2)').contains('Straightforward').click();
    cy.get('.item-details-container.editor-complexity .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-finish > .item-details-validation').contains(
      '* You must provide a "Finish" date when "Completed" is checked.'
    );
    cy.get('.item-details-container.editor-finish .date-picker').click().click();
    cy.get('[data-vc-date-today]:visible button').click();
    cy.get('.item-details-container.editor-finish .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-origin .autocomplete').type('bel');
    cy.get('.slick-autocomplete:visible').find('div:nth(1)').click();
    cy.get('.item-details-container.editor-origin .modified').should('have.length', 1);
    cy.get('.item-details-container.editor-origin .autocomplete')
      .invoke('val')
      .then((text) => expect(text).to.eq('Belgium'));
  });

  it('should be able to clear the "Country of Origin" autocomplete field in the modal form via the Clear button from the editor', () => {
    cy.get('.item-details-container.editor-origin .modified').should('have.length', 1);
    cy.get('.item-details-container.editor-origin .autocomplete-container button.btn-clear').click();
    cy.get('.item-details-container.editor-origin .modified').should('have.length', 1);
    cy.get('.item-details-container.editor-origin .autocomplete')
      .invoke('val')
      .then((text) => expect(text).to.eq(''));
  });

  it('should be able to click on the "Reset Form" button from the (Mass Update) and expect the form to be empty and not be able to Save', () => {
    const alertStub = cy.stub();
    cy.on('window:alert', alertStub);

    cy.get('.item-details-container .modified').should('have.length', 4);
    cy.get('.reset-form').contains('Reset Form').click();
    cy.get('.item-details-container .modified').should('have.length', 0);

    cy.get('.btn-save')
      .click()
      .then(() => expect(alertStub.getCall(0)).to.be.calledWith('Sorry we could not detect any changes.'));

    cy.get('.btn-cancel').click();
  });

  it('should have the "Mass Selection" button disabled when no rows are selected', () => {
    cy.get('[data-test="open-modal-mass-selection-btn"]').should('be.disabled');
  });

  it('should select row 1 and 2', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0)`).click();
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(0)`).click();
    cy.get('[data-test="open-modal-mass-selection-btn"]').should('not.be.disabled');
    cy.get('[data-test="open-modal-mass-selection-btn"]').wait(50).click();
  });

  it('should be able to open the Composite Editor (Mass Selection) and be able to change some of the inputs in the form', () => {
    cy.get('.slick-editor-modal-title').should('contain', 'Update Selected Records');
    cy.get('.footer-status-text').should('contain', '2 of 502 selected');

    cy.get('.item-details-editor-container .editor-checkbox').check();
    cy.get('.item-details-container.editor-completed .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-finish > .item-details-validation').contains(
      '* You must provide a "Finish" date when "Completed" is checked.'
    );
    cy.get('.item-details-container.editor-finish input.date-picker').click({ force: true });
    cy.get('[data-vc-date-today]:visible button').click('bottom', { force: true });
    cy.get('.item-details-container.editor-finish .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-origin .autocomplete').type('ze');
    cy.get('.slick-autocomplete:visible').find('div:nth(1)').click();
    cy.get('.item-details-container.editor-origin .modified').should('have.length', 1);
    cy.get('.item-details-container.editor-origin .autocomplete')
      .invoke('val')
      .then((text) => expect(text).to.eq('Belize'));

    cy.get('.btn-save').contains('Update Selection').click();
    cy.get('.validation-summary').contains('Unfortunately we only accept a minimum of 50% Completion...');

    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 77)
      .trigger('change', { force: true });
    cy.get('.item-details-editor-container .input-group-text').contains('77');
    cy.get('.btn-save').contains('Update Selection').click();

    cy.get('.slick-editor-modal').should('not.exist');
  });

  it('should have updated all the changed values BUT only on the 2 selected rows', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(4)`).should('contain', '77');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(10)`).should('contain', 'Belize');

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(4)`).should('contain', '77');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(10)`).should('contain', 'Belize');

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
  });

  it(`should open the Composite Editor (Mass Update) change "Percent Complete" to 100% and expect "Completed" to become checked and "Finish" date to be today's date`, () => {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = changeTimezone(now, tz);

    const currentDate = today.getDate();
    let currentMonth: number | string = today.getMonth() + 1; // month is zero based, let's add 1 to it
    if (currentMonth < 10) {
      currentMonth = `0${currentMonth}`; // add zero padding
    }
    const currentYear = today.getFullYear();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(3)`).click();
    cy.get('[data-test="open-modal-mass-update-btn"]').click();
    cy.get('.slick-editor-modal-title').contains('Mass Update All Records');

    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 100)
      .trigger('change', { force: true });
    cy.get('.item-details-container.editor-percentComplete .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-completed input.editor-checkbox:checked').should('have.length', 1);
    cy.get('.item-details-container.editor-completed .modified').should('have.length', 1);

    cy.get('.item-details-container.editor-finish input.date-picker').should(
      'contain.value',
      `${zeroPadding(currentMonth)}/${zeroPadding(currentDate)}/${currentYear}`
    );
    cy.get('.item-details-container.editor-finish .modified').should('have.length', 1);

    cy.get('.btn-cancel').click();
  });

  it('should not have any row selected after the mass-update save is over', () => {
    cy.get('.slick-row').children().filter('.slick-cell-checkboxsel.selected.true').should('have.length', 0);
  });

  it('should focus on first row and open the Composite Editor (Clone Item) and expect all form inputs to be filled with first row data', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('[data-test="open-modal-clone-btn"]').click();
    cy.get('.slick-editor-modal-title').contains('Clone - Task 8899');

    cy.get('textarea').contains('Task 8899');
    cy.get('.item-details-editor-container .slider-editor .input-group-text').contains('51');
    cy.get('.item-details-container.editor-completed input.editor-checkbox:checked').should('have.length', 1);
    cy.get('.item-details-container.editor-duration input.editor-text')
      .invoke('val')
      .then((text) => expect(text).to.eq('33.00'));
  });

  it('should change the "Title" & "Duration" from the Clone form, then click on "Cancel" button and expect no changes in the grid', () => {
    cy.get('.slick-editor-modal-title').contains('Clone - Task 8899');

    cy.get('textarea').contains('Task 8899').type('Task 9999');
    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 7)
      .trigger('change', { force: true });
    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 17)
      .trigger('change', { force: true });
    cy.get('.item-details-container.editor-percentComplete .modified').should('have.length', 1);

    cy.get('.item-details-editor-container .editor-checkbox').uncheck();

    cy.get('.btn-cancel').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).contains('TASK 8899', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '33 days');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
  });

  it('should focus again on first row and open the Composite Editor (Clone Item) and expect all form inputs to be filled with first row data', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('[data-test="open-modal-clone-btn"]').click();
    cy.get('.slick-editor-modal-title').contains('Clone - Task 8899');

    cy.get('textarea').contains('Task 8899');
    cy.get('.item-details-editor-container .slider-editor .input-group-text').contains('51');
    cy.get('.item-details-container.editor-completed input.editor-checkbox:checked').should('have.length', 1);
    cy.get('.item-details-container.editor-duration input.editor-text')
      .invoke('val')
      .then((text) => expect(text).to.eq('33.00'));
  });

  it('should change the "Title" & "Duration" from the Clone form, then click on "Clone" button and expect a new row to show up on top of the grid', () => {
    cy.get('.slick-editor-modal-title').contains('Clone - Task 8899');

    cy.get('textarea').contains('Task 8899').type('Task 9999');
    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 7)
      .trigger('change', { force: true });
    cy.get('.item-details-editor-container .slider-editor-input.editor-percentComplete')
      .as('range')
      .invoke('val', 17)
      .trigger('change', { force: true });
    cy.get('.item-details-container.editor-percentComplete .modified').should('have.length', 1);

    cy.get('.item-details-editor-container .editor-checkbox').uncheck();

    cy.get('.item-details-container.editor-duration input.editor-text').type('44');
    cy.get('.item-details-container.editor-duration .modified').should('have.length', 1);

    cy.get('.btn-save').contains('Clone').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).contains('TASK 9999', { matchCase: false });
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '44 days');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '17');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 0);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`).should('be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
  });

  it('should expect original, that was originally used to clone, to now be exist as that 2nd row in the grid', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', '8899');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(2)`).should('contain', '33 days');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(4)`).should('contain', '51');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(7)`)
      .find('.mdi-check')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`).should('not.be.empty');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
  });

  it('should be able to clear the "Country of Origin" autocomplete field in the grid via the Clear button from the editor', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(10)`).should('contain', 'Belgium');

    // clear Country
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(10)`).click();
    cy.get('.autocomplete-container button.btn-clear').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(10)`).should('contain', '');
  });

  it('should open Edit Composite Editor from Cell Menu and expect Task 3 on 6th row', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 6}px);"] > .slick-cell:nth(11)`).click();

    cy.get('.slick-menu-item .slick-menu-content').first().should('contain', 'Edit Row').click();

    cy.get('.slick-editor-modal-title').should('contain', 'Editing - Task 3');
  });

  it('should change Start date and reset to previous value when resetting the form', () => {
    cy.get('.editor-start .vanilla-picker input').invoke('val').should('not.be.empty');
    cy.get('.editor-start .vanilla-picker [data-clear] button.btn-clear').click();
    cy.get('.editor-start .vanilla-picker input').invoke('val').should('be.empty');

    cy.get('.item-details-container .modified').should('have.length', 1);
    cy.get('.reset-form').contains('Reset Form').click();
    cy.get('.item-details-container .modified').should('have.length', 0);
    cy.get('.editor-start .vanilla-picker input').invoke('val').should('not.be.empty');

    cy.get('.slick-editor-modal-footer .btn-cancel').click();
  });

  it('should open Clone Composite Editor from Cell Menu and expect Task 3 on 6th row', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 6}px);"] > .slick-cell:nth(11)`).click();

    cy.get('.slick-menu-item .slick-menu-content:nth(1)').should('contain', 'Clone Row').click();

    cy.get('.slick-editor-modal-title').should('contain', 'Clone - Task 3');

    // start date shouldn't be today's month/year
    const today = new Date();
    cy.get('.editor-start .vanilla-picker input').click();

    cy.get('.vc:visible .vc-year').should('have.attr', 'data-vc-year').should('not.contain', today.getFullYear());

    // clear start date
    cy.get('.editor-start .vanilla-picker .btn-clear').click();

    // reopen start date and expect today's year
    cy.get('.editor-start .vanilla-picker input').click();

    cy.get('.vc:visible .vc-year').should('have.attr', 'data-vc-year').should('contain', today.getFullYear());

    cy.get('.slick-editor-modal-footer .btn-cancel').click();
  });
});
