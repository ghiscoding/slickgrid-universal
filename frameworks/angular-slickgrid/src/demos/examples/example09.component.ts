import { Component, type OnDestroy, type OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  type AngularGridInstance,
  AngularSlickgridModule,
  type Column,
  ExtensionName,
  Filters,
  Formatters,
  type GridOption,
  type SliderOption,
  unsubscribeAllObservables,
} from '../../library';
import type { Subscription } from 'rxjs';

@Component({
  templateUrl: './example09.component.html',
  styleUrls: ['./example09.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [AngularSlickgridModule],
})
export class Example9Component implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  angularGrid!: AngularGridInstance;
  columnDefinitions!: Column[];
  gridOptions!: GridOption;
  dataset!: any[];
  hideSubTitle = false;
  selectedLanguage: string;

  constructor(private translate: TranslateService) {
    // always start with English for Cypress E2E tests to be consistent
    const defaultLang = 'en';
    this.translate.use(defaultLang);
    this.selectedLanguage = defaultLang;
  }

  ngOnDestroy() {
    // also unsubscribe all Angular Subscriptions
    unsubscribeAllObservables(this.subscriptions);
  }

  ngOnInit(): void {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', nameKey: 'TITLE', filterable: true },
      {
        id: 'duration',
        name: 'Duration',
        field: 'duration',
        nameKey: 'DURATION',
        sortable: true,
        filterable: true,
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        nameKey: 'PERCENT_COMPLETE',
        sortable: true,
        filterable: true,
        type: 'number',
        formatter: Formatters.percentCompleteBar,
        filter: {
          model: Filters.compoundSlider,
          options: { hideSliderNumber: false } as SliderOption,
        },
      },
      { id: 'start', name: 'Start', field: 'start', nameKey: 'START', filterable: true },
      { id: 'finish', name: 'Finish', field: 'finish', nameKey: 'FINISH', filterable: true },
      {
        id: 'effort-driven',
        name: 'Completed',
        field: 'effortDriven',
        nameKey: 'COMPLETED',
        maxWidth: 80,
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
        minWidth: 100,
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'true' },
            { value: false, label: 'false' },
          ],
          model: Filters.singleSelect,
        },
      },
    ];

    this.gridOptions = {
      columnPicker: {
        hideForceFitButton: true,
        hideSyncResizeButton: true,
        onColumnsChanged: (e, args) => {
          console.log('Column selection changed from Column Picker, visible columns: ', args.visibleColumns);
        },
      },
      enableAutoResize: true,
      enableGridMenu: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableCellNavigation: true,
      gridMenu: {
        // we could disable the menu entirely by returning false depending on some code logic
        menuUsabilityOverride: () => true,

        // all titles optionally support translation keys, if you wish to use that feature then use the title properties with the 'Key' suffix (e.g: titleKey)
        // example "commandTitle" for a plain string OR "commandTitleKey" to use a translation key
        commandTitleKey: 'CUSTOM_COMMANDS',
        iconCssClass: 'mdi mdi-dots-vertical', // defaults to "mdi-menu"
        hideForceFitButton: true,
        hideSyncResizeButton: true,
        hideToggleFilterCommand: false, // show/hide internal custom commands
        menuWidth: 17,
        resizeOnShowHeaderRow: true,
        subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
        commandItems: [
          // add Custom Items Commands which will be appended to the existing internal custom items
          // you cannot override an internal items but you can hide them and create your own
          // also note that the internal custom commands are in the positionOrder range of 50-60,
          // if you want yours at the bottom then start with 61, below 50 will make your command(s) show on top
          {
            iconCssClass: 'mdi mdi-help-circle',
            titleKey: 'HELP',
            disabled: false,
            command: 'help',
            positionOrder: 90,
            cssClass: 'bold', // container css class
            textCssClass: 'blue', // just the text css class
          },
          // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
          // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
          { divider: true, command: '', positionOrder: 89 },
          // 'divider',
          {
            title: 'Command 1',
            command: 'command1',
            positionOrder: 91,
            cssClass: 'orange',
            iconCssClass: 'mdi mdi-alert',
            // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
            action: (_e: Event, args: any) => alert(args.command),
            itemUsabilityOverride: (args: any) => {
              // for example disable the command if there's any hidden column(s)
              if (args && Array.isArray(args.columns)) {
                return args.columns.length === args.visibleColumns.length;
              }
              return true;
            },
          },
          {
            title: 'Command 2',
            command: 'command2',
            positionOrder: 92,
            cssClass: 'red', // container css class
            textCssClass: 'italic', // just the text css class
            action: (_e: Event, args: any) => alert(args.command),
            itemVisibilityOverride: () => {
              // for example hide this command from the menu if there's any filter entered
              if (this.angularGrid) {
                return this.isObjectEmpty(this.angularGrid.filterService.getColumnFilters());
              }
              return true;
            },
          },
          {
            title: 'Disabled command',
            disabled: true,
            command: 'disabled-command',
            positionOrder: 98,
          },
          { command: '', divider: true, positionOrder: 98 },
          {
            // we can also have multiple nested sub-menus
            command: 'export',
            title: 'Exports',
            positionOrder: 99,
            commandItems: [
              { command: 'exports-txt', title: 'Text (tab delimited)' },
              {
                command: 'sub-menu',
                title: 'Excel',
                cssClass: 'green',
                subMenuTitle: 'available formats',
                subMenuTitleCssClass: 'text-italic orange',
                commandItems: [
                  { command: 'exports-csv', title: 'Excel (csv)' },
                  { command: 'exports-xlsx', title: 'Excel (xlsx)' },
                ],
              },
            ],
          },
          {
            command: 'feedback',
            title: 'Feedback',
            positionOrder: 100,
            commandItems: [
              {
                command: 'request-update',
                title: 'Request update from supplier',
                iconCssClass: 'mdi mdi-star',
                tooltip: 'this will automatically send an alert to the shipping team to contact the user for an update',
              },
              'divider',
              {
                command: 'sub-menu',
                title: 'Contact Us',
                iconCssClass: 'mdi mdi-account',
                subMenuTitle: 'contact us...',
                subMenuTitleCssClass: 'italic',
                commandItems: [
                  { command: 'contact-email', title: 'Email us', iconCssClass: 'mdi mdi-pencil-outline' },
                  { command: 'contact-chat', title: 'Chat with us', iconCssClass: 'mdi mdi-message-text-outline' },
                  { command: 'contact-meeting', title: 'Book an appointment', iconCssClass: 'mdi mdi-coffee' },
                ],
              },
            ],
          },
        ],
        // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
        onCommand: (_e: Event, args: any) => {
          // e.preventDefault(); // preventing default event would keep the menu open after the execution
          const command = args.item?.command;
          if (command.includes('exports-')) {
            alert('Exporting as ' + args?.item.title);
          } else if (command.includes('contact-') || command === 'help') {
            alert('Command: ' + args.command);
          } else {
            console.log('onGridMenuCommand', args.command);
          }
        },
        onColumnsChanged: (_e: Event, args: any) => {
          console.log('Column selection changed from Grid Menu, visible columns: ', args.visibleColumns);
        },
      },
      enableTranslate: true,
      i18n: this.translate,
    };

    this.getData();
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
  }

  getData() {
    // Set up some test columns.
    const mockDataset = [];
    for (let i = 0; i < 500; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        phone: this.generatePhoneNumber(),
        duration: Math.round(Math.random() * 25) + ' days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: i % 5 === 0,
      };
    }
    this.dataset = mockDataset;
  }

  generatePhoneNumber() {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }

  switchLanguage() {
    const nextLanguage = this.selectedLanguage === 'en' ? 'fr' : 'en';
    this.subscriptions.push(
      this.translate.use(nextLanguage).subscribe(() => {
        this.selectedLanguage = nextLanguage;
      })
    );
  }

  toggleGridMenu(e: MouseEvent) {
    if (this.angularGrid && this.angularGrid.extensionService) {
      const gridMenuInstance = this.angularGrid.extensionService.getExtensionInstanceByName(ExtensionName.gridMenu);
      // open the external button Grid Menu, you can also optionally pass Grid Menu options as 2nd argument
      // for example we want to align our external button on the right without affecting the menu within the grid which will stay aligned on the left
      gridMenuInstance.showGridMenu(e, { dropSide: 'right' });
    }
  }

  private isObjectEmpty(obj: any) {
    for (const key in obj) {
      if (key in obj && obj[key] !== '') {
        return false;
      }
    }
    return true;
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.angularGrid.resizerService.resizeGrid(0);
  }
}
