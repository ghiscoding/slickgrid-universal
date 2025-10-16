import { Component, ViewEncapsulation, type OnDestroy, type OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { Subscription } from 'rxjs';
import { AngularSlickgridModule, unsubscribeAllObservables, type AngularGridInstance, type Column, type GridOption } from '../../library';

@Component({
  templateUrl: './example08.component.html',
  styleUrls: ['./example08.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [AngularSlickgridModule],
})
export class Example8Component implements OnInit, OnDestroy {
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

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
  }

  ngOnDestroy() {
    // also unsubscribe all Angular Subscriptions
    unsubscribeAllObservables(this.subscriptions);
  }

  ngOnInit(): void {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', nameKey: 'TITLE' },
      { id: 'duration', name: 'Duration', field: 'duration', nameKey: 'DURATION', sortable: true },
      { id: 'percentComplete', name: '% Complete', field: 'percentComplete', nameKey: 'PERCENT_COMPLETE', sortable: true },
      { id: 'start', name: 'Start', field: 'start', nameKey: 'START' },
      { id: 'finish', name: 'Finish', field: 'finish', nameKey: 'FINISH' },
      { id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED' },
    ];

    this.columnDefinitions.forEach((columnDef) => {
      columnDef.header = {
        menu: {
          commandItems: [
            // add Custom Header Menu Item Commands which will be appended to the existing internal custom items
            // you cannot override an internal command but you can hide them and create your own
            // also note that the internal custom commands are in the positionOrder range of 50-60,
            // if you want yours at the bottom then start with 61, below 50 will make your command(s) show on top
            {
              iconCssClass: 'mdi mdi-help-circle',

              // you can disable a command with certain logic
              // HOWEVER note that if you use "itemUsabilityOverride" has precedence when it is defined
              // disabled: (columnDef.id === 'completed'),

              titleKey: 'HELP', // use "title" as plain string OR "titleKey" when using a translation key
              command: 'help',
              tooltip: 'Need assistance?',
              cssClass: 'bold', // container css class
              textCssClass: columnDef.id === 'title' || columnDef.id === 'completed' ? '' : 'blue', // just the text css class
              positionOrder: 99,
              itemUsabilityOverride: (args) => {
                // for example if we want to disable the "Help" command over the "Title" and "Completed" column
                return !(args.column.id === 'title' || args.column.id === 'completed');
              },
              itemVisibilityOverride: (args) => {
                // for example don't show Help on column "% Complete"
                return args.column.id !== 'percentComplete';
              },
              action: (e, args) => {
                // you can use the "action" callback and/or subscribe to the "onCallback" event, they both have the same arguments
                console.log('execute an action on Help', args);
              },
            },
            // you can also add divider between commands (command is a required property but you can set it to empty string)
            { divider: true, command: '', positionOrder: 98 },

            // you can use "divider" as a string too, but if you do then make sure it's the correct position in the list
            // (since there's no positionOrder when using 'divider')
            // 'divider',
            {
              // we can also have multiple nested sub-menus
              command: 'custom-actions',
              title: 'Hello',
              positionOrder: 99,
              commandItems: [
                { command: 'hello-world', title: 'Hello World' },
                { command: 'hello-slickgrid', title: 'Hello SlickGrid' },
                {
                  command: 'sub-menu',
                  title: `Let's play`,
                  cssClass: 'green',
                  subMenuTitle: 'choose your game',
                  subMenuTitleCssClass: 'text-italic salmon',
                  commandItems: [
                    { command: 'sport-badminton', title: 'Badminton' },
                    { command: 'sport-tennis', title: 'Tennis' },
                    { command: 'sport-racquetball', title: 'Racquetball' },
                    { command: 'sport-squash', title: 'Squash' },
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
        },
      };
    });

    this.gridOptions = {
      enableAutoResize: true,
      enableHeaderMenu: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: false,
      enableCellNavigation: true,
      headerMenu: {
        hideSortCommands: false,
        hideColumnHideCommand: false,
        subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
        // you can use the "onCommand" (in Grid Options) and/or the "action" callback (in Column Definition)
        onCommand: (_e, args) => {
          // e.preventDefault(); // preventing default event would keep the menu open after the execution
          const command = args.item?.command;
          if (command.includes('hello-')) {
            alert(args?.item.title);
          } else if (command.includes('sport-')) {
            alert('Just do it, play ' + args?.item?.title);
          } else if (command.includes('contact-')) {
            alert('Command: ' + args?.item?.command);
          } else if (args.command === 'help') {
            alert('Please help!!!');
          }
        },
      },
      enableTranslate: true,
      i18n: this.translate,
    };

    this.getData();
  }

  getData() {
    // Set up some test columns.
    const mockDataset = [];
    for (let i = 0; i < 1000; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 25) + ' days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        completed: i % 5 === 0,
      };
    }
    this.dataset = mockDataset;
  }

  switchLanguage() {
    const nextLanguage = this.selectedLanguage === 'en' ? 'fr' : 'en';
    this.subscriptions.push(
      this.translate.use(nextLanguage).subscribe(() => {
        this.selectedLanguage = nextLanguage;
      })
    );
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.angularGrid.resizerService.resizeGrid(0);
  }
}
