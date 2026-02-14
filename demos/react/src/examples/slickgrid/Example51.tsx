import { format as tempoFormat } from '@formkit/tempo';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import React, { useEffect, useRef, useState } from 'react';
import {
  Aggregators,
  createDomElement,
  Filters,
  Formatters,
  SlickgridReact,
  SortComparers,
  SortDirectionNumber,
  type Column,
  type GridOption,
  type Grouping,
  type MenuCommandItem,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import './example51.scss'; // provide custom CSS/SASS styling

const NB_ITEMS = 2000;

interface ReportItem {
  id: number;
  title: string;
  duration: number;
  cost: number;
  percentComplete: number;
  start: Date;
  finish: Date;
  action?: string;
}

const Example51: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column<ReportItem>[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>();
  const [dataset] = useState<ReportItem[]>(loadData(NB_ITEMS));
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        filterable: true,
        minWidth: 100,
        // Demo: Header Menu with Slot - complete custom HTML with keyboard shortcuts
        header: {
          menu: {
            commandItems: [
              {
                command: 'sort-asc',
                title: 'Sort Ascending',
                positionOrder: 50,
                // Slot renderer replaces entire menu item content (can be HTML string or native DOM elements)
                slotRenderer: (cmdItem) => `
                  <div class="menu-item">
                    <i class="mdi mdi-sort-ascending menu-item-icon"></i>
                    <span class="menu-item-label">${cmdItem.title}</span>
                    <kbd class="key-hint">Alt+↑</kbd>
                  </div>
                `,
              },
              {
                command: 'sort-desc',
                title: 'Sort Descending',
                positionOrder: 51,
                // Slot renderer using native DOM elements
                slotRenderer: () => {
                  const menuItemElm = createDomElement('div', { className: 'menu-item' });
                  const iconElm = createDomElement('i', { className: 'mdi mdi-sort-descending menu-item-icon' });
                  const menuItemLabelElm = createDomElement('span', { className: 'menu-item-label', textContent: 'Sort Descending' });
                  const kbdElm = createDomElement('kbd', { className: 'key-hint', textContent: 'Alt+↓' });
                  menuItemElm.appendChild(iconElm);
                  menuItemElm.appendChild(menuItemLabelElm);
                  menuItemElm.appendChild(kbdElm);
                  return menuItemElm;
                },
              },
            ],
          },
        },
      },
      {
        id: 'duration',
        name: 'Duration',
        field: 'duration',
        sortable: true,
        filterable: true,
        minWidth: 100,
        // Demo: Header Menu with Slot - showing badge and status dot
        header: {
          menu: {
            commandItems: [
              {
                command: 'column-resize-by-content',
                title: 'Resize by Content',
                positionOrder: 47,
                // Slot renderer with badge
                slotRenderer: () => `
                  <div class="menu-item">
                    <i class="mdi mdi-arrow-expand-horizontal menu-item-icon"></i>
                    <span class="menu-item-label">Resize by Content</span>
                    <span class="key-hint danger">NEW</span>
                  </div>
                `,
              },
              { divider: true, command: '', positionOrder: 48 },
              {
                command: 'sort-asc',
                title: 'Sort Ascending',
                iconCssClass: 'mdi mdi-sort-ascending',
                positionOrder: 50,
              },
              {
                command: 'sort-desc',
                title: 'Sort Descending',
                iconCssClass: 'mdi mdi-sort-descending',
                positionOrder: 51,
              },
              { divider: true, command: '', positionOrder: 52 },
              {
                command: 'clear-sort',
                title: 'Remove Sort',
                positionOrder: 58,
                // Slot renderer with status indicator
                slotRenderer: () => `
                  <div class="menu-item">
                    <i class="mdi mdi-sort-variant-off menu-item-icon"></i>
                    <span class="menu-item-label">Remove Sort</span>
                    <span class="round-tag"></span>
                  </div>
                `,
              },
            ],
          },
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        sortable: true,
        formatter: Formatters.dateIso,
        filterable: true,
        filter: { model: Filters.compoundDate },
        minWidth: 100,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        sortable: true,
        formatter: Formatters.dateIso,
        filterable: true,
        filter: { model: Filters.dateRange },
        minWidth: 100,
      },
      {
        id: 'cost',
        name: 'Cost',
        field: 'cost',
        width: 90,
        sortable: true,
        filterable: true,
        formatter: Formatters.dollar,
        // Demo: Header Menu with Slot - showing slotRenderer with callback (item, args)
        header: {
          menu: {
            commandItems: [
              {
                command: 'custom-action',
                title: 'Advanced Export',
                // Demo: Native HTMLElement with event listeners using slotRenderer (full DOM control)
                slotRenderer: (cmdItem) => {
                  // you can use `createDomElement()` from Slickgrid for easier DOM element creation
                  const containerDiv = createDomElement('div', { className: 'menu-item' });
                  const iconDiv = createDomElement('div', { className: 'advanced-export-icon', textContent: '📊' });
                  const textSpan = createDomElement('span', { textContent: cmdItem.title || '', style: { flex: '1' } });
                  const kbdElm = createDomElement('kbd', { className: 'key-hint', textContent: 'Ctrl+E' });
                  containerDiv.appendChild(iconDiv);
                  containerDiv.appendChild(textSpan);
                  containerDiv.appendChild(kbdElm);

                  // Add native event listeners for hover effects
                  containerDiv.addEventListener('mouseover', () => {
                    iconDiv.style.transform = 'scale(1.15)';
                    iconDiv.style.background = 'linear-gradient(135deg, #d8dcef 0%, #ffffff 100%)';
                    containerDiv.parentElement!.style.backgroundColor = '#854685';
                    containerDiv.parentElement!.title = `📈 Export timestamp: ${tempoFormat(new Date(), 'YYYY-MM-DD hh:mm:ss a')}`;
                    containerDiv.style.color = 'white';
                    containerDiv.querySelector<HTMLElement>('.key-hint')!.style.color = 'black';
                  });
                  containerDiv.addEventListener('mouseout', () => {
                    iconDiv.style.transform = 'scale(1)';
                    iconDiv.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    containerDiv.parentElement!.style.backgroundColor = 'white';
                    containerDiv.style.color = 'black';
                    document.querySelector('.export-timestamp')?.remove();
                  });

                  return containerDiv;
                },
                action: () => {
                  alert('Custom export action triggered!');
                },
              },
              { divider: true, command: '' },
              {
                command: 'filter-column',
                title: 'Filter Column',
                // Slot renderer with status indicator and beta badge
                slotRenderer: () => `
                  <div class="menu-item">
                    <i class="mdi mdi-filter menu-item-icon"></i>
                    <span class="menu-item-label">Filter Column</span>
                    <span class="key-hint beta">BETA</span>
                  </div>
                `,
              },
            ],
          },
        },
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters.slider, operator: '>=' },
        // Demo: Header Menu with Slot - showing interactive element (checkbox)
        header: {
          menu: {
            commandItems: [
              {
                command: 'recalc',
                title: 'Recalculate',
                iconCssClass: 'mdi mdi-refresh',
                slotRenderer: () => `
                  <div class="menu-item">
                    <div class="recalc-icon">%</div>
                    <span class="menu-item-label">Recalculate</span>
                  </div>
                `,
              },
            ],
          },
        },
      },
      {
        id: 'action',
        name: 'Action',
        field: 'action',
        width: 70,
        minWidth: 70,
        maxWidth: 70,
        cssClass: 'justify-center flex',
        formatter: () =>
          `<div class="button-style margin-auto" style="width: 35px;"><span class="mdi mdi-chevron-down text-primary"></span></div>`,
        excludeFromExport: true,
        // Demo: Cell Menu with slot examples (demonstrating defaultMenuItemRenderer at menu level)
        cellMenu: {
          hideCloseButton: false,
          commandTitle: 'Cell Actions',
          // Demo: Menu-level default renderer that applies to all items unless overridden
          defaultMenuItemRenderer: (cmdItem) => {
            return `
              <div class="menu-item">
                ${cmdItem.iconCssClass ? `<i class="${cmdItem.iconCssClass}" style="margin-right: 10px; font-size: 18px;"></i>` : '<span style="width: 18px; margin-right: 10px;">◦</span>'}
                <span class="menu-item-label">${cmdItem.title}</span>
              </div>
            `;
          },
          commandItems: [
            {
              command: 'copy-cell',
              title: 'Copy Cell Value',
              iconCssClass: 'mdi mdi-content-copy',
              action: (_e, args) => {
                console.log('Copy cell value:', args.dataContext[args.column.field]);
                alert(`Copied: ${args.dataContext[args.column.field]}`);
              },
            },
            'divider',
            {
              command: 'export-row',
              title: 'Export Row',
              iconCssClass: 'mdi mdi-download',
              action: (_e, args) => {
                console.log('Export row:', args.dataContext);
                alert(`Export row #${args.dataContext.id}`);
              },
            },
            {
              command: 'export',
              title: 'Export',
              iconCssClass: 'mdi mdi-download',
              commandItems: [
                {
                  command: 'export-excel',
                  title: 'Export as Excel',
                  iconCssClass: 'mdi mdi-file-excel-outline text-success',
                  action: (_e, args) => {
                    alert(`Export row #${args.dataContext.id} to Excel`);
                  },
                },
                {
                  command: 'export-csv',
                  title: 'Export as CSV',
                  iconCssClass: 'mdi mdi-file-document-outline',
                  action: (_e, args) => {
                    alert(`Export row #${args.dataContext.id} to CSV`);
                  },
                },
                {
                  command: 'export-pdf',
                  title: 'Export as PDF',
                  iconCssClass: 'mdi mdi-file-pdf-outline text-red',
                  action: (_e, args) => {
                    alert(`Export row #${args.dataContext.id} to PDF`);
                  },
                },
              ],
            },
            { divider: true, command: '' },
            {
              command: 'edit-row',
              title: 'Edit Row',
              // Individual slotRenderer overrides the defaultMenuItemRenderer
              slotRenderer: (_item, args) => `
                <div class="menu-item">
                    <div class="edit-cell-icon">✎</div>
                    <span class="menu-item-label">Edit Row #${args.dataContext.id}</span>
                </div>
              `,
              action: (_e, args) => {
                console.log('Edit row:', args.dataContext);
                alert(`Edit row #${args.dataContext.id}`);
              },
            },
            {
              command: 'delete-row',
              title: 'Delete Row',
              iconCssClass: 'mdi mdi-delete text-danger',
              action: (_event, args) => {
                const dataContext = args.dataContext;
                if (confirm(`Do you really want to delete row (${args.row! + 1}) with "${dataContext.title}"`)) {
                  reactGridRef.current?.gridService.deleteItemById(dataContext.id);
                }
              },
            },
          ],
        },
      },
    ];

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
      },
      enableAutoResize: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      enableGrouping: true,

      // Header Menu with slots (already configured in columns above)
      enableHeaderMenu: true,
      headerMenu: {
        // hideCommands: ['column-resize-by-content', 'clear-sort'],

        // Demo: Menu-level default renderer for all header menu items
        defaultMenuItemRenderer: (cmdItem) => {
          return `
            <div class="menu-item">
              ${cmdItem.iconCssClass ? `<i class="${cmdItem.iconCssClass} menu-item-icon"></i>` : ''}
              <span class="menu-item-label">${cmdItem.title}</span>
            </div>
          `;
        },
      },

      // Cell Menu with slots (configured in the Action column above)
      enableCellMenu: true,

      // Context Menu with slot examples
      enableContextMenu: true,
      contextMenu: {
        // hideCommands: ['clear-grouping', 'copy'],

        // build your command items list
        // spread built-in commands and optionally filter/sort them however you want
        commandListBuilder: (builtInItems) => {
          // commandItems.sort((a, b) => (a === 'divider' || b === 'divider' ? 0 : a.title! > b.title! ? -1 : 1));
          return [
            // filter commands if you want
            // ...builtInItems.filter((x) => x !== 'divider' && x.command !== 'copy' && x.command !== 'clear-grouping'),
            {
              command: 'edit-cell',
              title: 'Edit Cell',
              // Demo: Individual slotRenderer overrides the menu's defaultMenuItemRenderer
              slotRenderer: (cmdItem) => {
                // you can use `createDomElement()` from Slickgrid for easier DOM element creation
                const containerDiv = createDomElement('div', { className: 'menu-item' });
                const iconDiv = createDomElement('div', { className: 'edit-cell-icon', textContent: '✎' });
                const textSpan = createDomElement('span', { textContent: cmdItem.title || '', style: { flex: '1' } });
                const kbdElm = createDomElement('kbd', { className: 'edit-cell', textContent: 'F2' });
                containerDiv.appendChild(iconDiv);
                containerDiv.appendChild(textSpan);
                containerDiv.appendChild(kbdElm);

                // Native event listeners for interactive effects
                containerDiv.addEventListener('mouseover', () => {
                  iconDiv.style.transform = 'rotate(15deg) scale(1.1)';
                  iconDiv.style.boxShadow = '0 2px 8px rgba(0,200,83,0.4)';
                });
                containerDiv.addEventListener('mouseout', () => {
                  iconDiv.style.transform = 'rotate(0deg) scale(1)';
                  iconDiv.style.boxShadow = 'none';
                });

                return containerDiv;
              },
              action: () => alert('Edit cell'),
            },
            ...builtInItems,
            { divider: true, command: '' },
            {
              command: 'export',
              title: 'Export',
              iconCssClass: 'mdi mdi-download',
              commandItems: [
                {
                  command: 'export-excel',
                  title: 'Export as Excel',
                  iconCssClass: 'mdi mdi-file-excel-outline text-success',
                  action: () => alert('Export to Excel'),
                },
                {
                  command: 'export-csv',
                  title: 'Export as CSV',
                  iconCssClass: 'mdi mdi-file-document-outline',
                  action: () => alert('Export to CSV'),
                },
                {
                  command: 'export-pdf',
                  title: 'Export as PDF',
                  iconCssClass: 'mdi mdi-file-pdf-outline text-danger',
                  action: () => alert('Export to PDF'),
                },
              ],
            },
            { divider: true, command: '' },
            {
              command: 'delete-row',
              title: 'Delete Row',
              iconCssClass: 'mdi mdi-delete text-danger',
              action: () => alert('Delete row'),
            },
          ] as Array<MenuCommandItem | 'divider'>;
        },
        // Demo: Menu-level default renderer for context menu items
        defaultMenuItemRenderer: (cmdItem) => {
          return `
            <div class="menu-item">
              ${cmdItem.iconCssClass ? `<i class="${cmdItem.iconCssClass} menu-item-icon"></i>` : ''}
              <span class="menu-item-label">${cmdItem.title}</span>
            </div>
          `;
        },
      },

      // Grid Menu with slot examples (demonstrating defaultMenuItemRenderer at menu level)
      enableGridMenu: true,
      gridMenu: {
        // hideCommands: ['toggle-preheader', 'toggle-filter'],

        // Demo: Menu-level default renderer that applies to all items (can be overridden per item with slotRenderer)
        defaultMenuItemRenderer: (cmdItem) => {
          return `
            <div class="menu-item">
              ${cmdItem.iconCssClass ? `<i class="${cmdItem.iconCssClass} menu-item-icon"></i>` : ''}
              <span class="menu-item-label">${cmdItem.title}</span>
            </div>
          `;
        },
        commandListBuilder: (builtInItems) => {
          return [
            ...builtInItems,
            { divider: true, command: '' },
            {
              command: 'export-excel',
              title: 'Export to Excel',
              iconCssClass: 'mdi mdi-file-excel-outline',
              action: () => alert('Export to Excel'),
            },
            {
              command: 'export-csv',
              title: 'Export to CSV',
              iconCssClass: 'mdi mdi-download',
              // Individual slotRenderer overrides the defaultMenuItemRenderer for this item
              slotRenderer: (cmdItem) => `
              <div class="menu-item">
                <i class="${cmdItem.iconCssClass} menu-item-icon warn"></i>
                <span class="menu-item-label warn">${cmdItem.title || ''}</span>
                <span class="key-hint warn">CUSTOM</span>
              </div>
            `,
              action: () => alert('Export to CSV'),
            },
            {
              command: 'refresh-data',
              title: 'Refresh Data',
              iconCssClass: 'mdi mdi-refresh',
              // Demo: slotRenderer with keyboard shortcut
              slotRenderer: (cmdItem) => {
                // you can use `createDomElement()` from Slickgrid for easier DOM element creation
                const menuItemElm = createDomElement('div', { className: 'menu-item' });
                const iconElm = createDomElement('i', { className: `${cmdItem.iconCssClass} menu-item-icon` });
                const menuItemLabelElm = createDomElement('span', { className: 'menu-item-label', textContent: cmdItem.title || '' });
                const kbdElm = createDomElement('kbd', { className: 'key-hint', textContent: 'F5' });
                menuItemElm.appendChild(iconElm);
                menuItemElm.appendChild(menuItemLabelElm);
                menuItemElm.appendChild(kbdElm);
                return menuItemElm;
              },
              action: () => alert('Refresh data'),
            },
          ] as Array<MenuCommandItem | 'divider'>;
        },
      },

      // tooltip plugin
      externalResources: [new SlickCustomTooltip()],
      customTooltip: {
        observeAllTooltips: true,
      },
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function clearGrouping() {
    reactGridRef.current?.dataView?.setGrouping([]);
  }

  function collapseAllGroups() {
    reactGridRef.current?.dataView?.collapseAllGroups();
  }

  function expandAllGroups() {
    reactGridRef.current?.dataView?.expandAllGroups();
  }

  function groupByDuration() {
    // you need to manually add the sort icon(s) in UI
    reactGridRef.current?.slickGrid?.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
    reactGridRef.current?.dataView?.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    reactGridRef.current?.slickGrid?.invalidate(); // invalidate all rows and re-render
  }

  function loadData(count: number): ReportItem[] {
    const tmpData: ReportItem[] = [];
    for (let i = 0; i < count; i++) {
      const randomDuration = Math.round(Math.random() * 100);
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      tmpData[i] = {
        id: i,
        title: 'Task ' + i,
        duration: randomDuration,
        cost: Math.round(Math.random() * 10000) / 100,
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
      };
    }
    return tmpData;
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 51: Menus with Slots
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example51.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>

      <div className="subtitle alert alert-light">
        <h5 className="mb-2">
          <span className="mdi mdi-information-outline"></span>
          <strong>Menu Slots Demo with Custom Renderer</strong>
        </h5>
        <p className="mb-2">
          Click on the menu buttons to see the new <strong>single slot functionality</strong> working across all menu types (Header Menu,
          Cell Menu, Context Menu, Grid Menu):
        </p>
        <p className="mt-2">
          <small>
            <strong>Note:</strong> The demo focuses on the custom rendering capability via <code>slotRenderer</code> and
            <code>defaultMenuItemRenderer</code>, which work across all menu plugins (SlickHeaderMenu, SlickCellMenu, SlickContextMenu,
            SlickGridMenu). Also note that the keyboard shortcuts displayed in the menus (e.g., <code>Alt+↑</code>, <code>F5</code>) are for
            demo purposes only and do not actually trigger any actions.
          </small>
        </p>
      </div>

      <section className="row mb-2">
        <div className="mb-1">
          <button className="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-grouping-btn" onClick={() => clearGrouping()}>
            <span>Clear grouping</span>
          </button>
          <button className="btn btn-outline-secondary btn-sm btn-icon" data-test="collapse-all-btn" onClick={() => collapseAllGroups()}>
            <span className="mdi mdi-arrow-collapse"></span>
            <span>Collapse all groups</span>
          </button>
          <button className="btn btn-outline-secondary btn-sm btn-icon" data-test="expand-all-btn" onClick={() => expandAllGroups()}>
            <span className="mdi mdi-arrow-expand"></span>
            <span>Expand all groups</span>
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="group-duration-sort-value-btn"
            onClick={() => groupByDuration()}
          >
            Group by Duration
          </button>
        </div>
      </section>

      <div id="grid-container" className="col-sm-12">
        <SlickgridReact
          gridId="grid51"
          columns={columnDefinitions}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

export default Example51;
