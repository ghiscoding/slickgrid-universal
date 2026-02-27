<script setup lang="ts">
import { format as tempoFormat } from '@formkit/tempo';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import {
  Aggregators,
  createDomElement,
  Filters,
  Formatters,
  SlickgridVue,
  SortComparers,
  SortDirectionNumber,
  type Column,
  type GridOption,
  type Grouping,
  type MenuCommandItem,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

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

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column<ReportItem>[]> = ref([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();

  // mock some data (different in each dataset)
  dataset.value = loadData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
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
              command: 'clear-filter',
              iconCssClass: 'mdi mdi-filter-remove-outline',
              title: 'Remove Filter',
            },
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

            {
              command: 'hide-column',
              iconCssClass: 'mdi mdi-close',
              title: 'Hide Column',
            },
            'divider',
            {
              command: 'footer-buttons',
              title: 'Footer Buttons',
              cssClass: 'slot-menu-container', // add a class to the menu container for styling purposes
              slotRenderer: () => {
                // create a container with 2 buttons to show what is possible
                const container = createDomElement('div', { className: 'footer-buttons-container' });
                const editBtn = createDomElement('button', {
                  className: 'footer-btn who-btn btn btn-outline-secondary btn-sm',
                  textContent: 'Who am I?',
                });
                const deleteBtn = createDomElement('button', {
                  className: 'footer-btn update-btn btn btn-outline-secondary btn-sm',
                  textContent: 'Request Update',
                });

                // add event listeners to buttons (see Context Menu)
                // OR use the `action` callback (see below) with `event.target` to delegate events instead of adding individual listeners
                container.appendChild(editBtn);
                container.appendChild(deleteBtn);
                return container;
              },
              action: (e, args) => {
                if (e.target.classList.contains('who-btn')) {
                  alert(`I am the "${args.column.name}" column`);
                } else if (e.target.classList.contains('update-btn')) {
                  alert(`is it done yet?`);
                }
                e.preventDefault(); // prevent menu from closing if needed
              },
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
      formatter: () => `<div class="button-style action-btn"><span class="mdi mdi-chevron-down font-22px color-primary"></span></div>`,
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
                vueGrid?.gridService.deleteItemById(dataContext.id);
              }
            },
          },
        ],
      },
    },
  ];

  gridOptions.value = {
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
          'divider',
          {
            command: 'footer-buttons',
            title: 'Footer Buttons',
            cssClass: 'slot-menu-container', // add a class to the menu container for styling purposes
            slotRenderer: (_cmd, args) => {
              // create a container with 2 buttons to show what is possible
              const container = createDomElement('div', { className: 'footer-buttons-container' });
              const editBtn = createDomElement('button', {
                className: 'footer-btn edit-btn btn btn-outline-secondary btn-sm',
                textContent: 'Edit',
              });
              const deleteBtn = createDomElement('button', {
                className: 'footer-btn delete-btn btn btn-outline-secondary btn-sm',
                textContent: 'Delete',
              });

              // add event listeners to buttons
              // OR use the `action` callback (see Header Menu) with `event.target` to delegate events instead of adding individual listeners
              editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent menu from closing if needed
                alert(`Edit action for row #${args.dataContext.id}`);
              });
              deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                alert(`Delete action for row #${args.dataContext.id}`);
              });

              container.appendChild(editBtn);
              container.appendChild(deleteBtn);
              return container;
            },
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
                <span class="menu-item-label warn">${cmdItem.title}</span>
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
}

function clearGrouping() {
  vueGrid?.dataView?.setGrouping([]);
}

function collapseAllGroups() {
  vueGrid?.dataView?.collapseAllGroups();
}

function expandAllGroups() {
  vueGrid?.dataView?.expandAllGroups();
}

function groupByDuration() {
  // you need to manually add the sort icon(s) in UI
  vueGrid?.slickGrid?.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
  vueGrid?.dataView?.setGrouping({
    getter: 'duration',
    formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
    comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
    aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
    aggregateCollapsed: false,
    lazyTotalsCalculation: true,
  } as Grouping);
  vueGrid?.slickGrid?.invalidate(); // invalidate all rows and re-render
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
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>

<template>
  <div class="grid51-container">
    <h2>
      Example 51: Menus with Slots
      <span class="float-end font18">
        see&nbsp;
        <a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example51.vue">
          <span class="mdi mdi-link-variant"></span> code
        </a>
      </span>
      <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle">
        <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
      </button>
    </h2>

    <div class="subtitle alert alert-light">
      <h5 class="mb-2">
        <span class="mdi mdi-information-outline"></span>
        <strong>Menu Slots Demo with Custom Renderer</strong>
      </h5>
      <p class="mb-2">
        Click on the menu buttons to see the new <strong>single slot functionality</strong> working across all menu types (Header Menu, Cell
        Menu, Context Menu, Grid Menu):
      </p>
      <p class="mt-2">
        <small
          ><strong>Note:</strong> The demo focuses on the custom rendering capability via <code>slotRenderer</code> and
          <code>defaultMenuItemRenderer</code>, which work across all menu plugins (SlickHeaderMenu, SlickCellMenu, SlickContextMenu,
          SlickGridMenu). Also note that the keyboard shortcuts displayed in the menus (e.g., <code>Alt+↑</code>, <code>F5</code>) are for
          demo purposes only and do not actually trigger any actions.
        </small>
      </p>
    </div>

    <section class="row mb-2">
      <div class="mb-1">
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-grouping-btn" @click="clearGrouping()">
          <span>Clear grouping</span>
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="collapse-all-btn" @click="collapseAllGroups()">
          <span class="mdi mdi-arrow-collapse"></span>
          <span>Collapse all groups</span>
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="expand-all-btn" @click="expandAllGroups()">
          <span class="mdi mdi-arrow-expand"></span>
          <span>Expand all groups</span>
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="group-duration-sort-value-btn" @click="groupByDuration()">
          Group by Duration
        </button>
      </div>
    </section>

    <slickgrid-vue
      v-model:options="gridOptions"
      v-model:columns="columnDefinitions"
      v-model:dataset="dataset"
      grid-id="grid51"
      @onVueGridCreated="vueGridReady($event.detail)"
    >
    </slickgrid-vue>
  </div>
</template>
<style lang="scss">
.grid51-container {
  --slick-menu-item-height: 30px;
  --slick-menu-line-height: 30px;
  --slick-column-picker-item-height: 28px;
  --slick-column-picker-line-height: 28px;
  --slick-menu-item-border-radius: 4px;
  --slick-menu-item-hover-border: 1px solid #148dff;
  --slick-column-picker-item-hover-color: #fff;
  --slick-column-picker-item-border-radius: 4px;
  --slick-column-picker-item-hover-border: 1px solid #148dff;
  --slick-menu-item-hover-color: #fff;
  --slick-tooltip-background-color: #4c4c4c;
  --slick-tooltip-color: #fff;
  --slick-tooltip-font-size: 14px;
  .slick-cell-menu,
  .slick-context-menu,
  .slick-grid-menu,
  .slick-header-menu {
    .slick-menu-item:hover:not(.slick-menu-item-disabled) {
      color: #0a34b5;
    }
  }
  .slick-menu-footer {
    padding: 4px 6px;
    border-top: 1px solid #c0c0c0;
  }
}

body {
  .slick-menu-item.slot-menu-container {
    --slick-menu-item-height: 40px;
    --slick-menu-item-hover-border: 1px solid transparent;
    --slick-menu-item-hover-color: transparent !important;

    .footer-buttons-container {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 10px;
    }

    .footer-btn {
      flex: 1;
      justify-content: center;
    }
  }
}

kbd {
  background-color: #eee;
  color: #202020;
}
.key-hint {
  background: #eee;
  border: 1px solid #ccc;
  border-radius: 2px;
  padding: 2px 4px;
  font-size: 10px;
  margin-left: 10px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  height: 20px;

  &.beta,
  &.danger,
  &.warn {
    color: white;
    font-size: 8px;
    font-weight: bold;
  }
  &.beta {
    background: #4444ff;
    border: 1px solid #5454ff;
  }

  &.danger {
    background: #ff4444;
    border: 1px solid #fb5a5a;
  }

  &.warn {
    background: #ff9800;
    border: 1px solid #fba321;
  }
}

.edit-cell {
  // background: #eee;
  border: 1px solid #ccc;
  border-radius: 2px;
  padding: 2px 4px;
  font-size: 10px;
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
  height: 18px;
}

.export-timestamp {
  background-color: #4c4c4c;
  color: #fff;
  padding: 8px;
  border-radius: 4px;
  position: absolute;
  z-index: 999999;
}

.advanced-export-icon,
.edit-cell-icon,
.recalc-icon {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  transition: transform 0.2s;
  color: white;
  font-size: 10px;
}
.advanced-export-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.edit-cell-icon {
  background: linear-gradient(135deg, #00c853 0%, #64dd17 100%);
}
.recalc-icon {
  background: linear-gradient(135deg, #c800a3 0%, #a31189 100%);
}

.round-tag {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  background: #44ff44;
  box-shadow: 0 0 4px #44ff44;
  margin-left: 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: space-between;

  .menu-item-label.warn {
    flex: 1;
    color: #f09000;
  }
}
.menu-item-icon {
  margin-right: 4px;
  font-size: 18px;
  &.warn {
    color: #ff9800;
  }
}

.menu-item-label {
  flex: 1;
}
</style>
