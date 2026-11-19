describe('Example 48 - Pivot Table', () => {
  const pivotTable = '.grid48';
  const grid = `${pivotTable} .grid48-grid`;
  const panel = `${pivotTable} .slick-pivot-layout-fields`;
  const status = `${pivotTable} .slick-pivot-layout-status`;
  const toolbarItem = (item: string) => `${pivotTable} .slick-pivot-toolbar [data-item="${item}"]`;
  const details = 'dialog.slick-pivot-details';
  const cell = (row: number, column: number) => `${grid} .slick-row[data-row="${row}"] .slick-cell.l${column}`;
  const areaList = (area: string) => `${panel} .slick-pivot-area-list[data-area="${area}"]`;
  const pill = (area: string, field: string) => `${areaList(area)} .slick-pivot-pill[data-field="${field}"]`;
  const fieldItem = (field: string) => `${panel} .slick-pivot-field[data-field="${field}"]`;

  function expectAreaFields(area: string, fields: string[]) {
    cy.get(areaList(area)).should(($list) => {
      expect(Array.from($list.find('.slick-pivot-pill')).map((elm) => elm.getAttribute('data-field'))).to.deep.equal(fields);
    });
  }

  function expectHeaderNames(names: string[]) {
    cy.get(`${grid} .slick-header-column .slick-column-name`).should(($names) => {
      expect(Array.from($names).map((name) => name.textContent)).to.deep.equal(names);
    });
  }

  /** Drag with pointer events (the panel uses them for the mouse, pens and touch screens alike) */
  function dragTo(sourceSelector: string, targetSelector: string, position: 'top' | 'bottom' = 'bottom') {
    cy.get(sourceSelector).then(($source) => {
      const source = $source[0].getBoundingClientRect();
      cy.get(targetSelector).then(($target) => {
        const target = $target[0].getBoundingClientRect();
        const x = target.left + Math.min(40, target.width / 2);
        const y = position === 'top' ? target.top + 4 : target.bottom - 6;
        const pointer = { eventConstructor: 'PointerEvent', pointerId: 1, button: 0 };
        cy.wrap($source).trigger('pointerdown', { ...pointer, clientX: source.left + 12, clientY: source.top + 6 });
        cy.document().trigger('pointermove', { ...pointer, clientX: source.left + 30, clientY: source.top + 20 });
        cy.document().trigger('pointermove', { ...pointer, clientX: x, clientY: y });
        cy.document().trigger('pointerup', { ...pointer, clientX: x, clientY: y });
      });
    });
  }

  /** Dispatch a real KeyboardEvent (with its modifier keys) from the application window */
  function pressKey(subject: Cypress.Chainable<JQuery<HTMLElement>>, key: string, init: KeyboardEventInit = {}) {
    subject.then(($elm) => {
      const win = $elm[0].ownerDocument.defaultView as any;
      $elm[0].dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
    });
  }

  function openPillMenu(area: string, field: string) {
    cy.get(`${pill(area, field)} .slick-pivot-pill-menu-button`).click();
    cy.get(`${panel} .slick-pivot-menu`).should('be.visible');
  }

  function clickMenuItem(label: string) {
    cy.get(`${panel} .slick-pivot-menu .slick-pivot-menu-item`).contains(label).click();
  }

  /** The group header cells of the pinned and sticky columns are drawn exactly above the header cells of their columns */
  function expectDockedGroupsAligned() {
    cy.window().should((win: any) => {
      const cells = Array.from<HTMLElement>(win.document.querySelectorAll(`${grid} .slick-pivot-header-group-docked`));
      expect(cells.length).to.be.greaterThan(0);
      cells.forEach((cell) => {
        const first = win.grid.getHeaderColumn(cell.dataset.firstColumn).getBoundingClientRect();
        const last = win.grid.getHeaderColumn(cell.dataset.lastColumn).getBoundingClientRect();
        const rect = cell.getBoundingClientRect();
        expect(Math.abs(rect.left - Math.min(first.left, last.left)), `left of "${cell.textContent}"`).to.be.lessThan(1.5);
        expect(Math.abs(rect.right - Math.max(first.right, last.right)), `right of "${cell.textContent}"`).to.be.lessThan(1.5);
      });
    });
  }

  /** Every column whose header is in view has its cell rendered in a row */
  function expectVisibleCellsRendered(row = 1) {
    cy.window().should((win: any) => {
      const viewport = win.document.querySelector(`${grid} .slick-viewport`).getBoundingClientRect();
      const inView = (elm: Element) => {
        const rect = elm.getBoundingClientRect();
        return rect.right > viewport.left + 2 && rect.left < viewport.right - 2;
      };
      const columns = win.grid.getColumns();
      const headerIds = Array.from<HTMLElement>(win.document.querySelectorAll(`${grid} .slick-header-column`))
        .filter(inView)
        .map((header) => header.dataset.id);
      const cellIds = Array.from<HTMLElement>(win.document.querySelectorAll(`${grid} .slick-row[data-row="${row}"] .slick-cell`))
        .filter(inView)
        .map((cell) => columns[Number(/\bl(\d+)\b/.exec(cell.className)![1])].id);
      expect(headerIds.length).to.be.greaterThan(2);
      expect(headerIds.filter((id) => !cellIds.includes(id))).to.deep.equal([]);
    });
  }

  function scrollHorizontally(fraction: number) {
    cy.get(`${grid} .slick-horizontal-scroller`).then(($scroller) => {
      const scroller = $scroller[0];
      const direction = scroller.closest('.slick-rtl') ? -1 : 1;
      scroller.scrollLeft = direction * Math.round((scroller.scrollWidth - scroller.clientWidth) * fraction);
    });
  }

  // a test failing with the details dialog open would leave the page behind it out of reach
  afterEach(() => {
    cy.window().then((win: any) => win.fieldList?.getDetails()?.close());
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example48`);
    cy.get('h3').should('contain', 'Example 48 - Pivot Table');
    cy.get(`${panel} .slick-pivot-panel-title`).should('have.text', 'PivotTable Fields');
  });

  it('should build the pivot table from its parts: a toolbar, the grid, the field list and a status bar', () => {
    cy.get(`${pivotTable} > .grid48-slot .grid48-grid`).should('exist');
    cy.get(`${pivotTable} > .slick-pivot-layout-toolbar`).should('exist');
    cy.get(`${pivotTable} > .slick-pivot-layout-fields`).should('exist');
    cy.get(`${pivotTable} > .slick-pivot-layout-status`).should('exist');
    cy.get(`${pivotTable} .slick-pivot-toolbar`).should('have.attr', 'role', 'group').and('have.attr', 'aria-label', 'PivotTable options');
    cy.get(`${pivotTable} .slick-pivot-toolbar [data-item]`).should(($items) => {
      expect(Array.from($items).map((item) => item.getAttribute('data-item'))).to.deep.equal([
        'layout',
        'subtotals',
        'grandTotals',
        'expandAll',
        'collapseAll',
        'undo',
        'redo',
        'fieldList',
      ]);
    });
    cy.get(`${toolbarItem('layout')} select`).should('have.value', 'compact');
    cy.get(`${toolbarItem('subtotals')} select`).should('have.value', 'top');
    cy.get(`${toolbarItem('grandTotals')} select`).should('have.value', 'both');
    // Undo and Redo are only shown while values can be edited
    cy.get(toolbarItem('undo')).should('not.be.visible');
    cy.get(toolbarItem('fieldList')).should('have.attr', 'aria-pressed', 'true');
    // the field list can be closed because the toolbar can open it again
    cy.get(`${panel} .slick-pivot-panel-close`).should('exist');
  });

  it('keeps the grid inside its allocated area beside the field list', () => {
    cy.get(panel).should('be.visible');
    cy.window().should((win: any) => {
      const gridRect = win.grid.getContainerNode().getBoundingClientRect();
      const slotRect = win.document.querySelector('.grid48-slot').getBoundingClientRect();
      const paneRect = win.document.querySelector(panel).getBoundingClientRect();
      expect(gridRect.right).to.be.at.most(slotRect.right + 1);
      expect(slotRect.right).to.be.at.most(paneRect.left + 1);
    });
  });

  it('should list the fields, checking the ones used by the pivot', () => {
    cy.get(`${fieldItem('region')} .slick-pivot-field-checkbox`).should('be.checked');
    cy.get(`${fieldItem('amount')} .slick-pivot-field-checkbox`).should('be.checked');
    cy.get(`${fieldItem('product')} .slick-pivot-field-checkbox`).should('not.be.checked');
    cy.get(`${panel} .slick-pivot-field-group`).then(($groups) => {
      expect(Array.from($groups).map((group) => group.textContent)).to.deep.equal(['Customer', 'Product', 'Order', 'Measures']);
    });
    expectAreaFields('filters', ['channel']);
    expectAreaFields('columns', ['orderDate.year']);
    expectAreaFields('rows', ['region', 'country']);
    cy.get(`${areaList('values')} .slick-pivot-pill-label`).should('have.text', 'Sum of amount');
    cy.get(`${pill('filters', 'channel')} .slick-pivot-pill-summary`).should('have.text', '(All)');
  });

  it('switches pivot mode on the same host grid and restores the source DataView', () => {
    cy.window().then((win: any) => {
      const originalGrid = win.grid;
      cy.get(`${panel} .slick-pivot-mode-checkbox`).uncheck();
      cy.window().should((current: any) => {
        expect(current.grid).to.equal(originalGrid);
        expect(current.pivot.isPivotMode()).to.equal(false);
        expect(current.grid.getData()).not.to.equal(current.pivot.rowModel);
        expect(current.grid.getDataLength()).to.equal(5000);
      });
      cy.get(`${panel} .slick-pivot-mode-checkbox`).check();
      cy.window().should((current: any) => {
        expect(current.grid).to.equal(originalGrid);
        expect(current.pivot.isPivotMode()).to.equal(true);
        expect(current.grid.getData()).to.equal(current.pivot.rowModel);
      });
    });
  });

  it('manages pivot columns in the grid menu and keeps cells aligned after clearing pinning', () => {
    cy.get(`${grid} .slick-grid-menu-button`).click();
    cy.get('.slick-grid-menu:visible .slick-column-picker-list').should('contain', '2025').and('not.contain', 'Country');
    cy.get('.slick-grid-menu:visible .slick-column-picker-list').contains('2025').click();
    cy.window().should((win: any) => {
      expect(win.grid.getColumns().find((column: any) => column.name === '2025').hidden).to.equal(true);
    });
    cy.get('.slick-grid-menu:visible .slick-column-picker-list').contains('2025').click();
    cy.window().should((win: any) => {
      expect(win.grid.getColumns().find((column: any) => column.name === '2025').hidden).to.equal(false);
    });
    cy.get('.slick-grid-menu:visible').contains('Clear all Pinning').click();
    cy.window().should((win: any) => {
      const columns = win.grid.getColumns();
      const totalIndex = columns.findIndex((column: any) => column.name === 'Grand Total');
      const header = win.grid.getHeaderColumn(columns[totalIndex].id).getBoundingClientRect();
      const totalCell = win.document.querySelector(`${grid} .slick-row[data-row="0"] .slick-cell.l${totalIndex}`).getBoundingClientRect();
      expect(Math.abs(header.left - totalCell.left)).to.be.lessThan(1.5);
      // The last header is 2px narrower to leave space for the GridMenu resize handle.
      expect(Math.abs(header.right - totalCell.right)).to.be.lessThan(2.5);
    });
    cy.window().then((win: any) => win.pivot.refresh());
  });

  it('shows unit prices and discounts in the source data', () => {
    cy.get(`${panel} .slick-pivot-mode-checkbox`).uncheck();
    cy.get(cell(0, 8)).should('have.text', '5');
    cy.get(cell(0, 9)).should('have.text', '0');
    cy.get(cell(5, 9)).should('have.text', '0.05');
    cy.window().should((win: any) => {
      const row = win.grid.getDataItem(5);
      expect(row.amount).to.equal(Math.round(row.units * row.unitPrice * (1 - row.discount) * 100) / 100);
    });
    cy.get(`${panel} .slick-pivot-mode-checkbox`).check();
  });

  it('shows source filters only in regular mode and retains them across pivot mode', () => {
    cy.get(`${panel} .slick-pivot-mode-checkbox`).uncheck();
    cy.get(`${grid} .search-filter.filter-region`).should('be.visible').type('East');
    cy.window().its('grid').invoke('getDataLength').should('eq', 1250);
    cy.get(`${panel} .slick-pivot-mode-checkbox`).check();
    cy.window().its('grid').invoke('getOptions').its('showHeaderRow').should('eq', false);
    cy.get(status).should('contain', '5,000 of 5,000 source rows');
    cy.get(`${panel} .slick-pivot-mode-checkbox`).uncheck();
    cy.get(`${grid} .search-filter.filter-region`).should('have.value', 'East').clear();
    cy.window().its('grid').invoke('getDataLength').should('eq', 5000);
    ['region', 'country', 'channel', 'category', 'product', 'orderId', 'orderDate', 'units', 'unitPrice', 'discount', 'amount'].forEach(
      (field) => cy.get(`${grid} .search-filter.filter-${field}`).should('be.visible')
    );
    cy.get(`${grid} .search-filter.filter-units input`).type('1');
    cy.window().its('grid').invoke('getDataLength').should('eq', 250);
    cy.get(`${grid} .search-filter.filter-units input`).clear();
    cy.window().its('grid').invoke('getDataLength').should('eq', 5000);
    cy.get(`${panel} .slick-pivot-mode-checkbox`).check();
  });

  it('should render the initial pivot in compact layout with the captions, subtotals and a sticky grand total row', () => {
    expectHeaderNames(['Row Labels', '2023', '2024', '2025', 'Grand Total']);
    cy.get(`${grid} .slick-pivot-header-caption`).first().should('have.text', 'Sum of amount');
    cy.get(`${grid} .slick-pivot-header-caption`).last().should('have.text', 'Years (Order Date)');
    cy.get(cell(0, 0)).should('contain', 'East').find('.slick-pivot-toggle').should('have.class', 'expanded');
    cy.get(`${grid} .slick-row[data-row="0"]`).should('have.class', 'slick-pivot-group');
    cy.get(cell(0, 1)).should('have.text', 'US$185,835');
    cy.get(cell(1, 0)).should('contain', 'China');
    // a short pivot shows its sticky grand total right below its last row
    cy.get(`${grid} .slick-pivot-grand-total`).should('have.class', 'slick-row-sticky');
    cy.get(`${grid} .slick-pivot-grand-total .slick-cell.l0`).should('contain', 'Grand Total');
    cy.get(`${grid} .slick-pivot-grand-total .slick-cell.l4`).should('have.text', 'US$2,560,315');
    cy.get(status).should('contain', '5,000 of 5,000 source rows');
  });

  it('should collapse and expand a row group with its toggle', () => {
    cy.get(`${cell(0, 0)} .slick-pivot-toggle`).click();
    cy.get(`${cell(0, 0)} .slick-pivot-toggle`).should('have.class', 'collapsed');
    cy.get(cell(0, 1)).should('have.text', 'US$185,835');
    cy.get(cell(1, 0)).should('contain', 'North');
    cy.get(`${cell(0, 0)} .slick-pivot-toggle`).click();
    cy.get(cell(1, 0)).should('contain', 'China');
  });

  it('should show the pivot of the Excel sample of issue #1020 like Excel does', () => {
    cy.get('[data-test="dataset-select"]').select('excel');
    expectHeaderNames(['Row Labels', 'Apples', 'Bananas', 'Grand Total']);
    const expected = [
      ['1', '1', '', '1'],
      ['2', '2', '', '2'],
      ['3', '', '3', '3'],
      ['4', '', '4', '4'],
      ['Grand Total', '3', '7', '10'],
    ];
    expected.forEach((row, r) => row.forEach((text, c) => cy.get(cell(r, c)).should('have.text', text)));
    expectAreaFields('rows', ['myCol1']);
    expectAreaFields('columns', ['myCol2']);
    cy.get(`${areaList('values')} .slick-pivot-pill-label`).should('have.text', 'Sum of myCol1');
    cy.get(`${panel} .slick-pivot-mode-checkbox`).uncheck();
    cy.window()
      .its('grid')
      .invoke('getColumns')
      .should((columns: any[]) => {
        expect(columns.map((column) => column.id)).to.deep.equal(['myCol1', 'myCol2', 'myCol3', 'myCol4']);
      });
    ['1', 'Apples', '43', 'Hot'].forEach((value, column) => cy.get(cell(0, column)).should('have.text', value));
    cy.get('[data-test="dataset-select"]').select('500');
    cy.window().its('grid').invoke('getDataLength').should('eq', 500);
    cy.window().its('grid').invoke('getColumns').its('0.id').should('eq', 'region');
    cy.get('[data-test="dataset-select"]').select('excel');
    cy.window().its('grid').invoke('getDataLength').should('eq', 4);
    cy.get(cell(0, 1)).should('have.text', 'Apples');
    cy.get(`${panel} .slick-pivot-mode-checkbox`).should('not.be.checked').check();
    expectHeaderNames(['Row Labels', 'Apples', 'Bananas', 'Grand Total']);
  });

  it('should add a text field to the rows, and a number field to the values, when checking them', () => {
    cy.get(`${fieldItem('myCol4')} .slick-pivot-field-checkbox`).check();
    expectAreaFields('rows', ['myCol1', 'myCol4']);
    cy.get(`${fieldItem('myCol3')} .slick-pivot-field-checkbox`).check();
    cy.get(`${areaList('values')} .slick-pivot-pill-label`).then(($labels) => {
      expect(Array.from($labels).map((label) => label.textContent)).to.deep.equal(['Sum of myCol1', 'Sum of myCol3']);
    });
    // two values: the Σ Values pill shows up in the columns
    expectAreaFields('columns', ['myCol2', '$values']);

    cy.get(`${fieldItem('myCol3')} .slick-pivot-field-checkbox`).uncheck();
    cy.get(`${fieldItem('myCol4')} .slick-pivot-field-checkbox`).uncheck();
    expectAreaFields('rows', ['myCol1']);
    expectAreaFields('columns', ['myCol2']);
    cy.get('[data-test="dataset-select"]').select('5000');
    expectHeaderNames(['Row Labels', '2023', '2024', '2025', 'Grand Total']);
    cy.get(`${panel} .slick-pivot-mode-checkbox`).uncheck();
    cy.window().its('grid').invoke('getColumns').its('0.id').should('eq', 'region');
    cy.get(cell(0, 0)).should('have.text', 'East');
    cy.get(`${panel} .slick-pivot-mode-checkbox`).check();
  });

  it('should move a field from the rows to the columns by dragging it', () => {
    dragTo(pill('rows', 'country'), areaList('columns'));
    expectAreaFields('columns', ['orderDate.year', 'country']);
    expectAreaFields('rows', ['region']);
    cy.get(`${grid} .slick-pivot-header-caption`).last().should('have.text', 'Years (Order Date) / Country');
    cy.get(`${grid} .slick-pivot-header-group .slick-pivot-header-label`).contains('2023').should('exist');
    cy.get(`${grid} .slick-pivot-header-group .slick-pivot-column-toggle`).should('have.length.greaterThan', 0);
  });

  it('should collapse a column group into its subtotal column', () => {
    cy.window().then((win: any) => {
      const before = win.grid.getColumns().length;
      cy.get(`${grid} .slick-pivot-header-group .slick-pivot-column-toggle`).first().click();
      cy.window().its('grid').invoke('getColumns').should('have.length.lessThan', before);
      cy.get(`${grid} .slick-pivot-column-toggle.collapsed`).should('exist');
      cy.get(`${grid} .slick-pivot-column-toggle.collapsed`).first().click();
      cy.window().its('grid').invoke('getColumns').should('have.length', before);
    });
  });

  it('should move the field back to the rows with the pill menu', () => {
    openPillMenu('columns', 'country');
    clickMenuItem('Move to Rows');
    expectAreaFields('columns', ['orderDate.year']);
    expectAreaFields('rows', ['region', 'country']);
  });

  it('should reorder and move pills with the keyboard', () => {
    pressKey(cy.get(pill('rows', 'country')).focus(), 'ArrowUp', { altKey: true });
    expectAreaFields('rows', ['country', 'region']);
    cy.focused().should('have.attr', 'data-field', 'country');
    cy.get(`${panel} .slick-pivot-live`).should('contain', 'Country moved to position 1 of 2');
    pressKey(cy.focused(), 'ArrowDown', { altKey: true });
    expectAreaFields('rows', ['region', 'country']);
    pressKey(cy.get(pill('rows', 'region')).focus(), 'ArrowLeft', { altKey: true });
    expectAreaFields('columns', ['orderDate.year', 'region']);
    cy.focused().should('have.attr', 'data-area', 'columns');
    pressKey(cy.focused(), 'ArrowRight', { altKey: true });
    expectAreaFields('rows', ['country', 'region']);
    pressKey(cy.focused(), 'ArrowUp', { altKey: true });
    expectAreaFields('rows', ['region', 'country']);
  });

  it('should open the pill menu with Enter and close it with Escape', () => {
    pressKey(cy.get(pill('rows', 'region')).focus(), 'Enter');
    cy.get(`${panel} .slick-pivot-menu`).should('be.visible');
    cy.focused().should('have.text', 'Move Down');
    pressKey(cy.focused(), 'Escape');
    cy.get(`${panel} .slick-pivot-menu`).should('not.exist');
    cy.focused().should('have.attr', 'data-field', 'region');
  });

  it('should remove a field by dragging it out of the areas', () => {
    dragTo(pill('filters', 'channel'), grid);
    expectAreaFields('filters', []);
    cy.get(`${fieldItem('channel')} .slick-pivot-field-checkbox`).should('not.be.checked');
  });

  it('should add a field to the filters by dragging it from the field list, then filter its items', () => {
    dragTo(fieldItem('channel'), areaList('filters'));
    expectAreaFields('filters', ['channel']);
    openPillMenu('filters', 'channel');
    clickMenuItem('Filter…');
    cy.get(`${panel} .slick-pivot-filter-popup .slick-pivot-filter-item`).should('have.length', 4);
    cy.get(`${panel} .slick-pivot-filter-popup .slick-pivot-filter-item`).contains('Partner').click();
    cy.get(`${panel} .slick-pivot-filter-popup .slick-pivot-dialog-ok`).click();
    cy.get(`${pill('filters', 'channel')} .slick-pivot-pill-summary`).should('have.text', '(Multiple Items)');
    cy.get(status).should('contain', '3,339 of 5,000 source rows');

    openPillMenu('filters', 'channel');
    clickMenuItem('Filter…');
    cy.get(`${panel} .slick-pivot-filter-popup .slick-pivot-filter-clear`).click();
    cy.get(`${pill('filters', 'channel')} .slick-pivot-pill-summary`).should('have.text', '(All)');
    cy.get(status).should('contain', '5,000 of 5,000 source rows');
  });

  it('should sort the rows by the value of a column when clicking its header, within each parent', () => {
    cy.get(`${grid} .slick-header-column`).contains('Grand Total').click();
    cy.window().then((win: any) => {
      const regions = win.pivot.getResult().rowTree.children;
      const totals = regions.map((region: any) => win.pivot.getResult().cells[region.key][win.pivot.getResult().columnTree.key][0]);
      expect(totals).to.deep.equal([...totals].sort((a: number, b: number) => a - b));
    });
    cy.get(cell(0, 0)).should('contain', 'East');
    cy.get(`${grid} .slick-header-column`).contains('Grand Total').click();
    cy.get(cell(0, 0)).should('contain', 'West');
    cy.get(`${grid} .slick-header-column`).contains('Row Labels').click();
    cy.get(cell(0, 0)).should('contain', 'East');
  });

  it('should change the summary of a value with the Value Field Settings', () => {
    openPillMenu('values', 'amount');
    clickMenuItem('Value Field Settings…');
    cy.get(`${panel} .slick-pivot-value-name`).should('have.value', 'Sum of amount');
    cy.get(`${panel} .slick-pivot-value-format`).find('option:selected').should('have.text', 'Custom');
    cy.get(`${panel} .slick-pivot-value-aggregator`).select('avg');
    cy.get(`${panel} .slick-pivot-value-name`).should('have.value', 'Average of amount');
    cy.get(`${panel} .slick-pivot-value-show-as`).select('percentOfColumnTotal');
    cy.get(`${panel} .slick-pivot-dialog-ok`).click();
    cy.get(`${areaList('values')} .slick-pivot-pill-label`).should('have.text', 'Average of amount');
    cy.get(`${grid} .slick-pivot-grand-total .slick-cell.l4`).should('have.text', '100%');

    openPillMenu('values', 'amount');
    clickMenuItem('Value Field Settings…');
    cy.get(`${panel} .slick-pivot-value-aggregator`).select('sum');
    cy.get(`${panel} .slick-pivot-value-show-as`).select('No Calculation');
    cy.get(`${panel} .slick-pivot-value-format`).select('Number (1,234)');
    cy.get(`${panel} .slick-pivot-dialog-ok`).click();
    cy.get(`${grid} .slick-pivot-grand-total .slick-cell.l4`).should('have.text', '2,560,315');
  });

  it('should change the summary of a value from the "Summarize Values By" items of its pill menu', () => {
    const radioItems = `${panel} .slick-pivot-menu [role="menuitemradio"]`;
    openPillMenu('values', 'amount');
    cy.get(`${panel} .slick-pivot-menu [role="group"] .slick-pivot-menu-heading`).should('have.text', 'Summarize Values By');
    cy.get(radioItems).should(($items) => {
      expect(Array.from($items).map((item) => item.textContent)).to.deep.equal(['Sum', 'Count', 'Average', 'Max', 'Min', 'Distinct Count']);
    });
    cy.get(`${radioItems}[aria-checked="true"]`).should('have.text', 'Sum');
    cy.get(radioItems).contains('Count').click();
    cy.get(`${areaList('values')} .slick-pivot-pill-label`).should('have.text', 'Count of amount');
    cy.get(`${grid} .slick-pivot-grand-total .slick-cell.l4`).should('have.text', '5,000');

    openPillMenu('values', 'amount');
    cy.get(`${radioItems}[aria-checked="true"]`).should('have.text', 'Count');
    cy.get(radioItems).contains('Sum').click();
    cy.get(`${areaList('values')} .slick-pivot-pill-label`).should('have.text', 'Sum of amount');
    cy.get(`${grid} .slick-pivot-grand-total .slick-cell.l4`).should('have.text', '2,560,315');
  });

  it('should switch to the tabular layout with bottom subtotals', () => {
    cy.get(`${toolbarItem('layout')} select`).select('tabular');
    expectHeaderNames(['Region', 'Country', '2023', '2024', '2025', 'Grand Total']);
    cy.get(cell(0, 0)).should('contain', 'East');
    cy.get(cell(0, 1)).should('contain', 'China');
    cy.get(cell(1, 0)).should('have.text', '');
    cy.get(`${grid} .slick-pivot-subtotal`).first().find('.slick-cell.l0').should('contain', 'East Total');
    cy.get(`${toolbarItem('subtotals')} select`).select('none');
    cy.get(`${grid} .slick-pivot-subtotal`).should('not.exist');
    cy.get(`${toolbarItem('layout')} select`).select('compact');
    cy.get(`${toolbarItem('subtotals')} select`).select('top');
    expectHeaderNames(['Row Labels', '2023', '2024', '2025', 'Grand Total']);
  });

  it('should list the source rows of a double-clicked cell in a sortable details dialog', () => {
    cy.get(cell(1, 1)).dblclick();
    cy.get(details).should('be.visible').and('have.attr', 'open');
    cy.window().should((win: any) => expect(win.fieldList.getDetails().getGrid().getOptions().rowHeight).to.equal(32));
    cy.get(`${details} .slick-row`)
      .first()
      .should(($row) => expect($row[0].getBoundingClientRect().height).to.equal(32));
    cy.focused().should('have.class', 'slick-pivot-details-close');
    cy.window().then((win: any) => {
      const item = win.grid.getDataItem(1);
      const columnKey = win.pivot.getColumnInfo(win.grid.getColumns()[1].id).columnKey;
      const expected = win.pivot
        .getEngine()
        .getSourceRows(win.pivot.getSourceRows(), win.pivot.getSpec(), item.__pivot.key, columnKey).length;
      cy.get(`${details} .slick-pivot-details-title`).should('have.text', `${expected} source rows — East › China / 2023`);
      cy.wrap(win.fieldList.getDetails().getGrid().getDataLength()).should('eq', expected);
    });
    // One column per configured field.
    cy.get(`${details} .slick-header-column .slick-column-name`).should(($names) => {
      expect(Array.from($names).map((name) => name.textContent)).to.deep.equal([
        'Region',
        'Country',
        'Channel',
        'Category',
        'Product',
        'Order Id',
        'Order Date',
        'units',
        'Unit Price',
        'discount',
        'amount',
      ]);
    });
    cy.get(`${details} .slick-row[data-row="0"] .slick-cell.l0`).should('have.text', 'East');
    // Sort the numeric order IDs, largest first.
    cy.get(`${details} .slick-header-column`).contains('Order Id').click().click();
    cy.window().should((win: any) => {
      const detailsGrid = win.fieldList.getDetails().getGrid();
      const ids = Array.from({ length: detailsGrid.getDataLength() }, (_v, i) => detailsGrid.getDataItem(i).orderId);
      expect(ids).to.deep.equal([...ids].sort((a, b) => b - a));
    });

    cy.get(`${details} .slick-pivot-details-close`).click();
    cy.get(details).should('not.be.visible');

    // a click on the backdrop closes it too
    cy.get(cell(0, 4)).dblclick();
    cy.get(`${details} .slick-pivot-details-title`).should('contain', 'East');
    cy.get(details).then(($dialog) => {
      const win = $dialog[0].ownerDocument.defaultView as any;
      $dialog[0].dispatchEvent(new win.MouseEvent('click', { bubbles: true, clientX: 2, clientY: 2 }));
    });
    cy.get(details).should('not.be.visible');
  });

  it('should change the grand totals, and expand or collapse every group, from the toolbar', () => {
    cy.get(`${toolbarItem('grandTotals')} select`).select('rows');
    expectHeaderNames(['Row Labels', '2023', '2024', '2025']);
    cy.get(`${grid} .slick-pivot-grand-total`).should('exist');
    cy.get(`${toolbarItem('grandTotals')} select`).select('columns');
    expectHeaderNames(['Row Labels', '2023', '2024', '2025', 'Grand Total']);
    cy.get(`${grid} .slick-pivot-grand-total`).should('not.exist');
    cy.get(`${toolbarItem('grandTotals')} select`).select('none');
    expectHeaderNames(['Row Labels', '2023', '2024', '2025']);
    cy.get(`${toolbarItem('grandTotals')} select`).select('both');
    expectHeaderNames(['Row Labels', '2023', '2024', '2025', 'Grand Total']);

    cy.get(toolbarItem('collapseAll')).click();
    cy.window().its('grid').invoke('getDataLength').should('eq', 5);
    cy.get(toolbarItem('expandAll')).click();
    cy.window().its('grid').invoke('getDataLength').should('eq', 17);

    // the toolbar follows a spec changed another way
    cy.window().then((win: any) => win.pivot.updateSpec({ layout: 'outline' }));
    cy.get(`${toolbarItem('layout')} select`).should('have.value', 'outline');
    cy.window().then((win: any) => win.pivot.updateSpec({ layout: 'compact' }));
  });

  it('should hide and show the field list, the grid taking the space', () => {
    cy.get(grid)
      .invoke('width')
      .then((width) => {
        cy.get(toolbarItem('fieldList')).click();
        cy.get(panel).should('not.be.visible');
        cy.get(toolbarItem('fieldList')).should('have.attr', 'aria-pressed', 'false');
        cy.get(grid)
          .invoke('width')
          .should('be.greaterThan', Number(width) + 200);
        cy.get(`${grid} .slick-viewport`)
          .invoke('width')
          .should('be.greaterThan', Number(width) + 200);

        cy.get(toolbarItem('fieldList')).click();
        cy.get(panel).should('be.visible');
        // the close button of the field list hides it and gives the focus to the toolbar button
        cy.get(`${panel} .slick-pivot-panel-close`).click();
        cy.get(panel).should('not.be.visible');
        cy.focused().should('have.attr', 'data-item', 'fieldList');
        cy.get(toolbarItem('fieldList')).click();
        cy.get(grid).invoke('width').should('eq', width);
      });
  });

  it('should resize the field list by dragging its splitter or with its keyboard', () => {
    const splitter = `${pivotTable} .slick-pivot-layout-splitter`;
    cy.get(splitter)
      .should('have.attr', 'role', 'separator')
      .and('have.attr', 'aria-valuenow', '320')
      .and('have.attr', 'aria-valuemin', '240');
    cy.get(splitter).then(($splitter) => {
      const rect = $splitter[0].getBoundingClientRect();
      const pointer = { eventConstructor: 'PointerEvent', pointerId: 1, button: 0, clientY: rect.top + 40 };
      const x = rect.left + rect.width / 2;
      cy.wrap($splitter).trigger('pointerdown', { ...pointer, clientX: x });
      cy.wrap($splitter).trigger('pointermove', { ...pointer, clientX: x - 60 });
      cy.wrap($splitter).trigger('pointerup', { ...pointer, clientX: x - 60 });
    });
    cy.get(splitter).should('have.attr', 'aria-valuenow', '380');
    cy.get(panel).invoke('outerWidth').should('eq', 380);

    // the arrows move the splitter the way they point
    pressKey(cy.get(splitter).focus(), 'ArrowRight');
    cy.get(splitter).should('have.attr', 'aria-valuenow', '364');
    pressKey(cy.get(splitter), 'ArrowLeft', { shiftKey: true });
    cy.get(splitter).should('have.attr', 'aria-valuenow', '428');
    pressKey(cy.get(splitter), 'Home');
    cy.get(splitter).should('have.attr', 'aria-valuenow', '240');
    pressKey(cy.get(splitter), 'End');
    cy.get(splitter)
      .invoke('attr', 'aria-valuemax')
      .then((max) => cy.get(splitter).should('have.attr', 'aria-valuenow', max));
    cy.window().then((win: any) => win.fieldList.setWidth(320));
    cy.get(panel).invoke('outerWidth').should('eq', 320);
  });

  it('should defer the layout update until Update is pressed', () => {
    cy.get(`${panel} .slick-pivot-defer-checkbox`).check();
    cy.get(`${fieldItem('category')} .slick-pivot-field-checkbox`).check();
    expectAreaFields('rows', ['region', 'country', 'category']);
    cy.window().its('pivot').invoke('getSpec').its('rows').should('deep.equal', ['region', 'country']);
    cy.get(`${panel} .slick-pivot-update-button`).should('not.be.disabled').click();
    cy.window().its('pivot').invoke('getSpec').its('rows').should('deep.equal', ['region', 'country', 'category']);
    cy.get(`${panel} .slick-pivot-update-button`).should('be.disabled');
    cy.get(`${panel} .slick-pivot-defer-checkbox`).uncheck();
    cy.get(`${fieldItem('category')} .slick-pivot-field-checkbox`).uncheck();
    expectAreaFields('rows', ['region', 'country']);
  });

  it('should compute the same pivot with the (simulated) asynchronous server provider', () => {
    cy.get('[data-test="server-provider"]').check();
    cy.window().its('grid').invoke('getContainerNode').should('have.class', 'slick-pivot-loading');
    cy.window().its('grid').invoke('getContainerNode').should('not.have.class', 'slick-pivot-loading');
    cy.get(`${grid} .slick-pivot-grand-total .slick-cell.l4`).should('have.text', '2,560,315');
    cy.get('[data-test="server-provider"]').uncheck();
  });

  it('should save and restore the layout', () => {
    cy.contains('button', 'Save layout').click();
    cy.get(`${toolbarItem('layout')} select`).select('outline');
    cy.contains('button', 'Restore layout').click();
    cy.get(`${toolbarItem('layout')} select`).should('have.value', 'compact');
  });

  it('should group a date field by years, quarters and months when checking it, listing its levels below it', () => {
    // the date field is in use while one of its levels is: the years are the column field
    cy.get(`${fieldItem('orderDate')} .slick-pivot-field-checkbox`).should('be.checked');
    cy.get(`${fieldItem('orderDate.year')} .slick-pivot-field-checkbox`).should('be.checked');
    cy.get(`${fieldItem('orderDate')} .slick-pivot-field-checkbox`).uncheck();
    expectAreaFields('columns', []);

    cy.get(`${fieldItem('orderDate')} .slick-pivot-field-checkbox`).check();
    expectAreaFields('rows', ['region', 'country', 'orderDate.year', 'orderDate.quarter', 'orderDate.month']);
    cy.get(fieldItem('orderDate.year'))
      .should('have.class', 'slick-pivot-field-level')
      .find('.slick-pivot-field-name')
      .should('have.text', 'Years');
    cy.get(`${fieldItem('orderDate.month')} .slick-pivot-field-checkbox`)
      .should('be.checked')
      .and('have.attr', 'aria-label', 'Months (Order Date)');
    cy.get(`${fieldItem('orderDate.day')} .slick-pivot-field-checkbox`).should('not.be.checked');
    cy.get(`${pill('rows', 'orderDate.year')} .slick-pivot-pill-label`).should('have.text', 'Years (Order Date)');
    cy.get(cell(2, 0)).should('contain', '2023');
    cy.get(cell(3, 0)).should('contain', 'Qtr1');
    cy.get(cell(4, 0)).should('contain', 'Jan');

    // a level on its own
    cy.get(`${fieldItem('orderDate.day')} .slick-pivot-field-checkbox`).check();
    expectAreaFields('rows', ['region', 'country', 'orderDate.year', 'orderDate.quarter', 'orderDate.month', 'orderDate.day']);

    // unchecking the date field removes every level
    cy.get(`${fieldItem('orderDate')} .slick-pivot-field-checkbox`).uncheck();
    expectAreaFields('rows', ['region', 'country']);

    // a level can be dragged on its own
    dragTo(fieldItem('orderDate.year'), areaList('columns'));
    expectAreaFields('columns', ['orderDate.year']);
    expectHeaderNames(['Row Labels', '2023', '2024', '2025', 'Grand Total']);
  });

  it('should write a value typed into a cell back to its source rows, update every total, and undo it', () => {
    cy.get('[data-test="write-back"]').check();
    cy.get(`${areaList('values')} .slick-pivot-pill`).should('have.length', 2);
    cy.get(`${grid} .slick-pivot-editable`).should('exist');

    cy.window().then((win: any) => {
      const value = (row: number, column: number) => win.grid.getDataItem(row)[win.grid.getColumns()[column].field];
      const grandTotalRow = () => win.grid.getDataLength() - 1;
      // China 2023 units, East 2023 units and the grand total of the units
      const before = { china: value(1, 2), east: value(0, 2), grand: value(grandTotalRow(), 8) };

      // Amount is computed, so it cannot be edited
      win.grid.setActiveCell(1, 1);
      win.grid.editActiveCell();
      expect(win.grid.getCellEditor()).to.eq(null);

      win.grid.setActiveCell(1, 2);
      win.grid.editActiveCell();
      cy.get(`${grid} .slick-cell.active input`).clear().type('1000{enter}');
      cy.get(cell(1, 2)).should('have.text', '1,000');
      cy.get(toolbarItem('undo')).should('be.visible').and('not.be.disabled');
      cy.get(toolbarItem('redo')).should('be.disabled');
      cy.window().should(() => {
        expect(value(0, 2)).to.eq(before.east - before.china + 1000);
        expect(value(grandTotalRow(), 8)).to.eq(before.grand - before.china + 1000);
        const rows = win.pivot.getEngine().getSourceRows(win.pivot.getSourceRows(), win.pivot.getSpec(), '["East","China"]', '[2023]');
        expect(
          rows.every((row: any) => Number.isInteger(row.units)),
          'whole units'
        ).to.eq(true);
        expect(rows.every((row: any) => row.amount === Math.round(row.units * row.unitPrice * (1 - row.discount) * 100) / 100)).to.eq(true);
      });

      cy.get(toolbarItem('undo')).click();
      cy.get(cell(1, 2)).should('have.text', before.china.toLocaleString('en-US'));
      cy.get(toolbarItem('undo')).should('be.disabled');

      // Redo applies the very same values again, Ctrl+Z (on the grid) takes them back
      cy.get(toolbarItem('redo')).click();
      cy.get(cell(1, 2)).should('have.text', '1,000');
      pressKey(cy.get(cell(1, 2)), 'z', { ctrlKey: true });
      cy.get(cell(1, 2)).should('have.text', before.china.toLocaleString('en-US'));
      pressKey(cy.get(cell(1, 2)), 'y', { ctrlKey: true });
      cy.get(cell(1, 2)).should('have.text', '1,000');
      cy.window().then(() => win.pivot.undo());
      cy.get(cell(1, 2)).should('have.text', before.china.toLocaleString('en-US'));
      cy.window().should(() => expect(value(grandTotalRow(), 8)).to.eq(before.grand));
    });
  });

  it('should pin or stick the grand totals, the column group headers following the docked columns', () => {
    cy.get('[data-test="grand-total-row-docking"]').select('pinned');
    cy.get(`${grid} .slick-pivot-grand-total`).should('have.class', 'slick-row-pinned-bottom');
    cy.get('[data-test="grand-total-row-docking"]').select('sticky');
    cy.get(`${grid} .slick-pivot-grand-total`).should('have.class', 'slick-row-sticky');

    cy.get('[data-test="grand-total-column-docking"]').select('pinned');
    cy.window().its('grid').invoke('getOptions').its('pinning.columns.right').should('have.length', 2);
    cy.get(`${grid} .slick-pivot-header-group-right`).contains('Grand Total').should('exist');
    expectDockedGroupsAligned();
    scrollHorizontally(1);
    expectDockedGroupsAligned();

    cy.get('[data-test="grand-total-column-docking"]').select('sticky');
    cy.window().its('grid').invoke('getOptions').its('pinning.columns.right').should('have.length', 0);
    cy.window()
      .its('grid')
      .invoke('getColumns')
      .then((columns: any[]) => {
        expect(columns.filter((column) => column.sticky).map((column) => column.sticky)).to.deep.equal(['right', 'right']);
      });
    scrollHorizontally(0.5);
    expectDockedGroupsAligned();
    cy.get('[data-test="grand-total-column-docking"]').select('none');
    cy.get(`${grid} .slick-pivot-header-group-sticky`).should('not.exist');
  });

  it('should mirror the pivot in a right-to-left grid, rendering the visible cells of a wide pivot wherever it is scrolled', () => {
    cy.get('[data-test="rtl"]').check();
    cy.window().its('grid').invoke('getContainerNode').should('have.class', 'slick-rtl');
    cy.get(pivotTable).should('have.attr', 'dir', 'rtl');
    // the field list is at the end of the line, which is on the left
    cy.get(panel).then(($panel) =>
      cy.get(grid).should(($grid) => expect($panel[0].getBoundingClientRect().right).to.be.lessThan($grid[0].getBoundingClientRect().left))
    );
    cy.window().then((win: any) => win.pivot.updateSpec({ columns: ['orderDate.year', 'orderDate.quarter', 'country'] }));
    cy.window().its('grid').invoke('getColumns').should('have.length.greaterThan', 30);

    // the row labels are pinned at the leading edge, which is the right one
    cy.window().should((win: any) => {
      const gridRect = win.document.querySelector(grid).getBoundingClientRect();
      const rowLabels = win.grid.getHeaderColumn('__pivot_rows').getBoundingClientRect();
      expect(gridRect.right - rowLabels.right).to.be.lessThan(gridRect.width / 3);
    });
    expectDockedGroupsAligned();
    expectVisibleCellsRendered();
    scrollHorizontally(0.5);
    expectVisibleCellsRendered();
    expectDockedGroupsAligned();
    scrollHorizontally(1);
    expectVisibleCellsRendered();
    // the indentation of the compact layout starts from the right
    cy.get(`${cell(1, 0)} .slick-pivot-toggle-spacer, ${cell(1, 0)} .slick-pivot-toggle`)
      .first()
      .should('have.attr', 'style')
      .and('contain', 'margin-inline-start: 15px');
  });

  it('keeps wide pivot columns readable after changing direction', () => {
    const expectReadableColumns = () => {
      cy.window().should((win: any) => {
        const columns = win.grid.getColumns().filter((column: any) => column.cssClass?.includes('slick-pivot-value'));
        expect(columns.length).to.be.greaterThan(30);
        expect(Math.min(...columns.map((column: any) => column.width))).to.be.at.least(80);
      });
    };

    expectReadableColumns();
    cy.get('[data-test="rtl"]').uncheck();
    cy.window().its('grid').invoke('getContainerNode').should('not.have.class', 'slick-rtl');
    expectReadableColumns();
    cy.get('[data-test="rtl"]').check();
    cy.window().its('grid').invoke('getContainerNode').should('have.class', 'slick-rtl');
    expectReadableColumns();
    cy.get('[data-test="rtl"]').uncheck();
    cy.get(pivotTable).should('have.css', 'direction', 'ltr');
    cy.get('[data-test="write-back"]').uncheck();
    cy.contains('button', 'Reset layout').click();
    expectHeaderNames(['Row Labels', '2023', '2024', '2025', 'Grand Total']);
    expectAreaFields('columns', ['orderDate.year']);
    cy.get(`${areaList('values')} .slick-pivot-pill`).should('have.length', 1);
  });
});
