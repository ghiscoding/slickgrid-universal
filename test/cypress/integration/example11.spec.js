/// <reference types="Cypress" />
import moment from 'moment-mini';
import { changeTimezone, zeroPadding } from '../plugins/utilities';

describe('Example 11 - Batch Editing', () => {
  const LOCAL_STORAGE_KEY = 'gridFilterPreset';
  const GRID_ROW_HEIGHT = 33;
  const EDITABLE_CELL_RGB_COLOR = 'rgba(227, 240, 251, 0.57)';
  const UNSAVED_RGB_COLOR = 'rgb(251, 253, 209)';
  const fullTitles = ['', 'Title', 'Duration', 'Cost', '% Complete', 'Start', 'Finish', 'Completed', 'Product', 'Country of Origin', 'Action'];
  const currentYear = moment().year();

  beforeEach(() => {
    // create a console.log spy for later use
    cy.window().then((win) => {
      cy.spy(win.console, 'log');
    });
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example11`);
    cy.get('h3').should('contain', 'Example 11 - Batch Editing');
  });


  it('should have exact Column Titles in the grid', () => {
    cy.get('.grid11')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should have "TASK 0" (uppercase) incremented by 1 after each row', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 1');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 2');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 3');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 5}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 5');
  });

  it('should be able to change "Duration" values of first 4 rows', () => {
    // change duration
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'days').click();
    cy.get('.editor-duration').type('0').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`)
      .should('contain', '0 day')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get('.editor-duration').type('1').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', '1 day')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get('.editor-duration').type('2').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', '2 days')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get('.editor-duration').type('3').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(2)`).should('contain', '3 days')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);
    cy.get('.editor-duration').type('{esc}');
    cy.get('.editor-duration').should('not.exist');

    cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');
  });

  it('should be able to change "Title" values of row indexes 1-3', () => {
    // change title
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 1').click();
    cy.get('.editor-title').type('task 1111').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 1111')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get('.editor-title').type('task 2222').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 2222')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get('.editor-title').type('task 3333').type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1)`).should('contain', 'TASK 3333')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);
    cy.get('.editor-title').type('{esc}');
    cy.get('.editor-title').should('not.exist');

    cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');
  });

  it('should be able to change "% Complete" values of row indexes 2-4', () => {
    // change % complete
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 5).trigger('change');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '5')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 6).trigger('change');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(4)`).should('contain', '6')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 7).trigger('change');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(4)`).should('contain', '7')
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');
  });

  it('should be able to change "Finish" values of row indexes 0-2', () => {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = changeTimezone(now, tz);

    const currentDate = today.getDate();
    let currentMonth = today.getMonth() + 1; // month is zero based, let's add 1 to it
    if (currentMonth < 10) {
      currentMonth = `0${currentMonth}`; // add zero padding
    }
    const currentYear = today.getFullYear();

    // change Finish date to today's date
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).should('contain', '').click(); // this date should also always be initially empty
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).should('contain', `${currentYear}-${zeroPadding(currentMonth)}-${zeroPadding(currentDate)}`)
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(6)`).click();
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(6)`).should('contain', `${currentYear}-${zeroPadding(currentMonth)}-${zeroPadding(currentDate)}`)
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).click();
    cy.get(`.flatpickr-day.today:visible`).click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', `${currentYear}-${zeroPadding(currentMonth)}-${zeroPadding(currentDate)}`)
      .should('have.css', 'background-color').and('eq', UNSAVED_RGB_COLOR);

    cy.get('.unsaved-editable-field')
      .should('have.length', 13);

    cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');
  });

  it('should undo last edit and expect the date editor to be opened as well when clicking the associated last undo with editor button', () => {
    cy.get('[data-test=undo-open-editor-btn]').click();

    cy.get('.flatpickr-calendar.open')
      .should('exist');

    cy.get('.unsaved-editable-field')
      .should('have.length', 12);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '')
      .should('have.css', 'background-color').and('eq', EDITABLE_CELL_RGB_COLOR);
  });

  it('should undo last edit and expect the date editor to NOT be opened when clicking undo last edit button', () => {
    cy.get('[data-test=undo-last-edit-btn]').click();

    cy.get('.flatpickr-calendar.open')
      .should('not.exist');

    cy.get('.unsaved-editable-field')
      .should('have.length', 11);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '')
      .should('have.css', 'background-color').and('eq', EDITABLE_CELL_RGB_COLOR);
  });

  it('should click on the "Save" button and expect 2 console log calls with the queued items & also expect no more unsaved cells', () => {
    cy.get('[data-test=save-all-btn]').click();

    cy.get('.unsaved-editable-field')
      .should('have.length', 0);

    cy.window().then((win) => {
      expect(win.console.log).to.have.callCount(2);
      // expect(win.console.log).to.be.calledWith(Array[11]);
    });
  });

  it('should be able to toggle the grid to readonly', () => {
    cy.get('[data-test=toggle-readonly-btn]').click();

    cy.get('.editable-field')
      .should('have.length', 0);
  });

  it('should be able to toggle back the grid to editable', () => {
    cy.get('[data-test=toggle-readonly-btn]').click();

    cy.get('.editable-field')
      .should('not.have.length', 0);
  });

  it('should not have filters set', () => {
    cy.get('.selected-filter').should('contain', '');

    cy.get('.rangeInput_percentComplete')
      .invoke('val')
      .then(text => expect(text).to.eq('0'));

    cy.get('.search-filter.filter-finish .flatpickr-input')
      .invoke('val')
      .then(text => expect(text).to.eq(''));

    cy.get('.search-filter.filter-completed .ms-choice').should('contain', '')
  });

  it('should change pre-defined filter to "Tasks Finished in Previous Years" and expect data to be filtered accordingly', () => {
    cy.get('.selected-filter').select('previousYears');
    cy.get('.selected-filter').should('have.value', 'previousYears');

    cy.get('.rangeInput_percentComplete')
      .invoke('val')
      .then(text => expect(text).to.eq('50'));

    cy.get('.search-filter.filter-finish .operator .form-control')
      .should('have.value', '<=');

    cy.get('.search-filter.filter-finish .flatpickr-input')
      .invoke('val')
      .then(text => expect(text).to.eq(`${currentYear}-01-01`));

    cy.get('.search-filter.filter-completed .ms-choice').should('contain', 'True');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 1);
  });

  it('should create a new Filter based on "Tasks Finished in Previous Years" that was already selected', () => {
    const filterName = "Custom Filter Test"
    const winPromptStub = () => filterName;

    cy.window().then(win => {
      cy.stub(win, 'prompt').callsFake(winPromptStub).as('winPromptStubReturnNonNull')
    });

    cy.get('input.search-filter.filter-title')
      .type('*0');

    cy.get('.action.dropdown')
      .click();

    cy.get('.action.dropdown .dropdown-item')
      .contains('Save Filter')
      .click();

    cy.get('@winPromptStubReturnNonNull').should('be.calledOnce')
      .and('be.calledWith', 'Please provide a name for the new Filter.')

    cy.should(() => {
      const savedDefinedFilters = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      expect(Object.keys(savedDefinedFilters)).to.have.lengthOf(3);
    });

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', '0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', '0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', '0');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));

    cy.get('.selected-filter').should('have.value', 'CustomFilterTest');
  });

  it('should change pre-defined filter to "Tasks Finishing in Future Years" and expect data to be filtered accordingly', () => {
    cy.get('.selected-filter').select('greaterCurrentYear');
    cy.get('.selected-filter').should('have.value', 'greaterCurrentYear');

    cy.get('.rangeInput_percentComplete')
      .invoke('val')
      .then(text => expect(text).to.eq('0'));

    cy.get('.search-filter.filter-finish .operator .form-control')
      .should('have.value', '>=');

    cy.get('.search-filter.filter-finish .flatpickr-input')
      .invoke('val')
      .then(text => expect(text).to.eq(`${currentYear + 1}-01-01`));

    cy.get('.search-filter.filter-completed .ms-choice').should('contain', '');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).should($elm => expect($elm.text()).to.not.eq, '');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).should($elm => expect($elm.text()).to.not.contain, currentYear);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(6)`).should($elm => expect($elm.text()).to.not.eq, '');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(6)`).should($elm => expect($elm.text()).to.not.contain, currentYear);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should($elm => expect($elm.text()).to.not.eq, '');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should($elm => expect($elm.text()).to.not.contain, currentYear);
  });

  it('should NOT be able to Delete/Update a System Defined Filter', () => {
    cy.get('.action.dropdown')
      .click();

    cy.get('.action.dropdown .dropdown-item:nth(1)')
      .then($elm => {
        expect($elm.text()).to.contain('Update Filter');
        expect($elm.hasClass('dropdown-item-disabled')).to.be.true;
      });

    cy.get('.action.dropdown .dropdown-item:nth(2)')
      .then($elm => {
        expect($elm.text()).to.contain('Delete Filter');
        expect($elm.hasClass('dropdown-item-disabled')).to.be.true;
      });

    cy.get('.selected-filter').should('have.value', 'greaterCurrentYear');
  });

  it('should reload the page and expect the Custom Filter to be reloaded from Local Storage and expect filtered data as well', () => {
    cy.get('.selected-filter').select('CustomFilterTest');

    cy.reload();
    cy.wait(50);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', '0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', '0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', '0');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should($elm => expect(+$elm.text()).to.be.greaterThan(50));

    cy.should(() => {
      const savedDefinedFilters = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      expect(Object.keys(savedDefinedFilters)).to.have.lengthOf(3);
    });

    cy.get('.selected-filter').should('have.value', 'CustomFilterTest');
  });

  it('should be able to Update the Custom Filter that we created earlier', () => {
    const filterName = "Custom Updated Filter Test"
    const winPromptStub = () => filterName;

    cy.window().then(win => {
      cy.stub(win, 'prompt').callsFake(winPromptStub).as('winPromptStubReturnNonNull')
    });

    cy.get('.selected-filter').select('CustomFilterTest');

    cy.get('.action.dropdown')
      .click();

    cy.get('.action.dropdown .dropdown-item')
      .contains('Update Filter')
      .click();

    cy.get('.action.dropdown .dropdown-item:nth(1)')
      .then($elm => {
        expect($elm.text()).to.contain('Update Filter');
        expect($elm.hasClass('dropdown-item-disabled')).to.be.false;
      });

    cy.get('.action.dropdown')
      .click();

    cy.get('@winPromptStubReturnNonNull').should('be.calledOnce')
      .and('be.calledWith', 'Update Filter name or click on OK to continue.', 'Custom Filter Test')

    cy.should(() => {
      const savedDefinedFilters = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      expect(Object.keys(savedDefinedFilters)).to.have.lengthOf(3);
    });

    // select should have new name
    cy.get('.selected-filter').should('have.value', 'CustomUpdatedFilterTest');
  });

  it('should be able to Delete the Custom Filter that we created earlier and also expect all Filters to be cleared', () => {
    cy.get('.selected-filter').select('CustomUpdatedFilterTest');

    cy.get('.action.dropdown')
      .click();

    cy.get('.action.dropdown .dropdown-item:nth(2)')
      .then($elm => {
        expect($elm.text()).to.contain('Delete Filter');
        expect($elm.hasClass('dropdown-item-disabled')).to.be.false;
      });

    cy.get('.action.dropdown .dropdown-item')
      .contains('Delete Filter')
      .click();

    cy.get('.selected-filter').should('not.have.value', 'CustomUpdatedFilterTest');

    cy.get('.rangeInput_percentComplete')
      .invoke('val')
      .then(text => expect(text).to.eq('0'));

    cy.get('.search-filter.filter-finish .flatpickr-input')
      .invoke('val')
      .then(text => expect(text).to.eq(''));

    cy.get('.search-filter.filter-completed .ms-choice').should('contain', '')
  });
});
