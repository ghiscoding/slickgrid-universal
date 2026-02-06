import { BindingEventService } from '@slickgrid-universal/binding';
import { Filters, Formatters, type Column, type GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';

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

export default class Example40 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column<ReportItem>[];
  gridOptions: GridOption;
  dataset: ReportItem[];
  sgb: SlickVanillaGridBundle<ReportItem>;

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(1000);
    const gridContainerElm = document.querySelector(`.grid40`) as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(
      gridContainerElm,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
  }

  initializeGrid() {
    // This example demonstrates Menu Slot functionality across all menu types:
    // - SlickHeaderMenu (Title, Duration, Cost, % Complete columns)
    // - SlickCellMenu (Action column with chevron button)
    // - SlickContextMenu (right-click context menu)
    // - SlickGridMenu (grid menu button)
    // All demonstrate: slotRenderer callbacks (item, args) returning strings or HTMLElements

    this.columnDefinitions = [
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
                // Slot renderer replaces entire menu item content
                slotRenderer: () => `
                  <div style="display: flex; align-items: center;">
                    <i class="mdi mdi-sort-ascending" style="margin-right: 4px; font-size: 18px;"></i>
                    <span style="flex: 1;">Sort Ascending</span>
                    <kbd style="background: #eee; border: 1px solid #ccc; border-radius: 2px; padding: 2px 4px; font-size: 10px; margin-left: 10px; white-space: nowrap; display: inline-flex; align-items: center; height: 18px;">Alt+↑</kbd>
                  </div>
                `,
              },
              {
                command: 'sort-desc',
                title: 'Sort Descending',
                positionOrder: 51,
                slotRenderer: () => `
                  <div style="display: flex; align-items: center;">
                    <i class="mdi mdi-sort-descending" style="margin-right: 4px; font-size: 18px;"></i>
                    <span style="flex: 1;">Sort Descending</span>
                    <kbd style="background: #eee; border: 1px solid #ccc; border-radius: 2px; padding: 2px 4px; font-size: 10px; margin-left: 10px; white-space: nowrap; display: inline-flex; align-items: center; height: 18px;">Alt+↓</kbd>
                  </div>
                `,
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
                  <div style="display: flex; align-items: center;">
                    <i class="mdi mdi-arrow-expand-horizontal" style="margin-right: 4px; font-size: 18px;"></i>
                    <span style="flex: 1;">Resize by Content</span>
                    <span style="background: #ff4444; color: white; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold; margin-left: 10px; white-space: nowrap; display: inline-flex; align-items: center; height: 18px;">NEW</span>
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
                  <div style="display: flex; align-items: center;">
                    <i class="mdi mdi-sort-variant-off" style="margin-right: 4px; font-size: 18px;"></i>
                    <span style="flex: 1;">Remove Sort</span>
                    <span style="width: 6px; height: 6px; border-radius: 50%; display: inline-block; background: #44ff44; box-shadow: 0 0 4px #44ff44; margin-left: 10px;"></span>
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
                slotRenderer: (item, _args) => {
                  const containerDiv = document.createElement('div');
                  containerDiv.style.cssText = 'display: flex; align-items: center;';

                  const iconDiv = document.createElement('div');
                  iconDiv.style.cssText =
                    'width: 18px; height: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 4px; transition: transform 0.2s;';
                  iconDiv.innerHTML = '<span style="color: white; font-size: 10px;">📊</span>';

                  const textSpan = document.createElement('span');
                  textSpan.style.cssText = 'flex: 1;';
                  textSpan.textContent = item.title;

                  const kbdElm = document.createElement('kbd');
                  kbdElm.style.cssText =
                    'background: #eee; border: 1px solid #ccc; border-radius: 2px; padding: 2px 4px; font-size: 10px; margin-left: 10px; display: inline-flex; align-items: center; height: 18px;';
                  kbdElm.textContent = 'Ctrl+E';

                  containerDiv.appendChild(iconDiv);
                  containerDiv.appendChild(textSpan);
                  containerDiv.appendChild(kbdElm);

                  // Add native event listeners for hover effects
                  containerDiv.addEventListener('mouseenter', () => {
                    iconDiv.style.transform = 'scale(1.1)';
                    containerDiv.style.backgroundColor = '#f5f5f5';
                  });
                  containerDiv.addEventListener('mouseleave', () => {
                    iconDiv.style.transform = 'scale(1)';
                    containerDiv.style.backgroundColor = '';
                  });

                  return containerDiv;
                },
                action: (_e, _args) => {
                  alert('Custom export action triggered!');
                },
              },
              { divider: true, command: '', positionOrder: 48 },
              {
                command: 'filter-column',
                title: 'Filter Column',
                positionOrder: 55,
                // Slot renderer with status indicator and beta badge
                slotRenderer: () => `
                  <div style="display: flex; align-items: center;">
                    <i class="mdi mdi-filter" style="margin-right: 4px; font-size: 18px;"></i>
                    <span style="flex: 1;">Filter Column</span>
                    <span style="background: #4444ff; color: white; padding: 2px 3px; border-radius: 2px; font-size: 8px; font-weight: bold; margin-left: 10px; white-space: nowrap; display: inline-flex; align-items: center; height: 18px;">BETA</span>
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
        filter: { model: Filters.slider, operator: '>=' },
        // Demo: Header Menu with Slot - showing interactive element (checkbox)
        header: {
          menu: {
            commandItems: [
              {
                command: 'auto-refresh',
                title: 'Auto Refresh',
                positionOrder: 45,
                iconCssClass: 'mdi mdi-refresh',
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
        formatter: () => `<div class="button-style action-btn"><span class="mdi mdi-chevron-down font-22px color-primary"></span></div>`,
        excludeFromExport: true,
        // Demo: Cell Menu with slot examples (demonstrating defaultItemRenderer at menu level)
        cellMenu: {
          hideCloseButton: false,
          commandTitle: 'Cell Actions',
          // Demo: Menu-level default renderer that applies to all items unless overridden
          defaultItemRenderer: (item, _args) => {
            return `
            <div style="display: flex; align-items: center;">
              ${item.iconCssClass ? `<i class="${item.iconCssClass}" style="margin-right: 10px; font-size: 18px;"></i>` : '<span style="width: 18px; margin-right: 10px;">◦</span>'}
              <span style="flex: 1;">${item.title}</span>
            </div>
          `;
          },
          commandItems: [
            {
              command: 'copy-cell',
              title: 'Copy Cell Value',
              positionOrder: 50,
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
              positionOrder: 51,
              iconCssClass: 'mdi mdi-download',
              action: (_e, args) => {
                console.log('Export row:', args.dataContext);
                alert(`Export row #${args.dataContext.id}`);
              },
            },
            {
              command: 'export',
              title: 'Export',
              positionOrder: 52,
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
            { divider: true, command: '', positionOrder: 52 },
            {
              command: 'edit-row',
              title: 'Edit Row',
              positionOrder: 53,
              // Individual slotRenderer overrides the defaultItemRenderer
              slotRenderer: (_item, args) => `
                <div style="display: flex; align-items: center;">
                  <div style="width: 18px; height: 18px; background: linear-gradient(135deg, #00c853 0%, #64dd17 100%); border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                    <span style="color: white; font-size: 10px;">✎</span>
                  </div>
                  <span style="flex: 1;">Edit Row #${args.dataContext.id}</span>
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
              positionOrder: 54,
              iconCssClass: 'mdi mdi-delete',
              action: (_e, args) => {
                if (confirm(`Delete row #${args.dataContext.id}?`)) {
                  console.log('Delete row:', args.dataContext);
                  alert(`Deleted row #${args.dataContext.id}`);
                }
              },
            },
          ],
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableAutoResize: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,

      // Header Menu with slots (already configured in columns above)
      enableHeaderMenu: true,
      headerMenu: {
        hideColumnHideCommand: false,
        // Demo: Menu-level default renderer for all header menu items
        defaultItemRenderer: (item, _args) => {
          return `
            <div style="display: flex; align-items: center;">
              ${item.iconCssClass ? `<i class="${item.iconCssClass}" style="margin-right: 4px; font-size: 18px;"></i>` : ''}
              <span style="flex: 1;">${item.title}</span>
            </div>
          `;
        },
      },

      // Cell Menu with slots (configured in the Action column above)
      enableCellMenu: true,

      // Context Menu with slot examples
      enableContextMenu: true,
      contextMenu: {
        // Demo: Menu-level default renderer for context menu items
        defaultItemRenderer: (item, _args) => {
          return `
            <div style="display: flex; align-items: center;">
              ${item.iconCssClass ? `<i class="${item.iconCssClass}" style="margin-right: 4px; font-size: 18px;"></i>` : ''}
              <span style="flex: 1;">${item.title}</span>
            </div>
          `;
        },
        commandItems: [
          {
            positionOrder: 60,
            command: 'edit-cell',
            title: 'Edit Cell',
            // Demo: Individual slotRenderer overrides the menu's defaultItemRenderer
            slotRenderer: (item, _args) => {
              const containerDiv = document.createElement('div');
              containerDiv.style.cssText = 'display: flex; align-items: center;';

              const iconDiv = document.createElement('div');
              iconDiv.style.cssText =
                'width: 18px; height: 18px; background: linear-gradient(135deg, #00c853 0%, #64dd17 100%); border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 4px; transition: all 0.2s;';
              iconDiv.innerHTML = '<span style="color: white; font-size: 10px;">✎</span>';

              const textSpan = document.createElement('span');
              textSpan.style.cssText = 'flex: 1;';
              textSpan.textContent = item.title;

              const kbdElm = document.createElement('kbd');
              kbdElm.style.cssText =
                'background: #eee; border: 1px solid #ccc; border-radius: 2px; padding: 2px 4px; font-size: 10px; margin-left: 10px; display: inline-flex; align-items: center; height: 18px;';
              kbdElm.textContent = 'F2';

              containerDiv.appendChild(iconDiv);
              containerDiv.appendChild(textSpan);
              containerDiv.appendChild(kbdElm);

              // Native event listeners for interactive effects
              containerDiv.addEventListener('mouseenter', () => {
                iconDiv.style.transform = 'rotate(15deg) scale(1.1)';
                iconDiv.style.boxShadow = '0 2px 8px rgba(0,200,83,0.4)';
              });
              containerDiv.addEventListener('mouseleave', () => {
                iconDiv.style.transform = 'rotate(0deg) scale(1)';
                iconDiv.style.boxShadow = 'none';
              });

              return containerDiv;
            },
            action: () => alert('Edit cell'),
          },
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
            iconCssClass: 'mdi mdi-delete',
            action: () => alert('Delete row'),
          },
        ],
      },

      // Grid Menu with slot examples (demonstrating defaultItemRenderer at menu level)
      enableGridMenu: true,
      gridMenu: {
        // Demo: Menu-level default renderer that applies to all items (can be overridden per item with slotRenderer)
        defaultItemRenderer: (item, _args) => {
          return `
          <div style="display: flex; align-items: center;">
            ${item.iconCssClass ? `<i class="${item.iconCssClass}" style="margin-right: 4px; font-size: 18px;"></i>` : ''}
            <span style="flex: 1;">${item.title}</span>
          </div>
        `;
        },
        commandItems: [
          {
            command: 'toggle-filter',
            title: 'Toggle Filter Row',
            iconCssClass: 'mdi mdi-filter-outline',
            action: () => alert('Toggle filter row'),
          },
          {
            command: 'clear-filters',
            title: 'Clear All Filters',
            iconCssClass: 'mdi mdi-filter-remove-outline',
            action: () => alert('Clear filters'),
          },
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
            // Individual slotRenderer overrides the defaultItemRenderer for this item
            slotRenderer: (item, _args) => `
              <div style="display: flex; align-items: center;">
                <i class="${item.iconCssClass}" style="margin-right: 4px; font-size: 18px; color: #ff9800;"></i>
                <span style="flex: 1; color: #ff9800;">${item.title}</span>
                <span style="background: #ff9800; color: white; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold; margin-left: 10px; display: inline-flex; align-items: center; height: 18px;">CUSTOM</span>
              </div>
            `,
            action: () => alert('Export to CSV'),
          },
          {
            command: 'refresh-data',
            title: 'Refresh Data',
            iconCssClass: 'mdi mdi-refresh',
            // Demo: slotRenderer with keyboard shortcut
            slotRenderer: (item) => `
              <div style="display: flex; align-items: center;">
                <i class="${item.iconCssClass}" style="margin-right: 4px; font-size: 18px;"></i>
                <span style="flex: 1;">${item.title}</span>
                <kbd style="background: #eee; border: 1px solid #ccc; border-radius: 2px; padding: 2px 4px; font-size: 10px; margin-left: 10px; display: inline-flex; align-items: center; height: 18px;">F5</kbd>
              </div>
            `,
            action: () => alert('Refresh data'),
          },
        ],
      },
    };
  }

  loadData(count: number): ReportItem[] {
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
}
