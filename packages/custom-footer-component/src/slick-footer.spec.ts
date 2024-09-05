import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type CustomFooterOption, type GridOption, SlickEvent, type SlickGrid } from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';

import { SlickFooterComponent } from './slick-footer.component';
import { TranslateServiceStub } from '../../../test/translateServiceStub';

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\s{2,}/g, '');
}

const mockGridOptions = {
  enableTranslate: false,
  showCustomFooter: true,
} as GridOption;

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  getOptions: () => mockGridOptions,
  getUID: () => 'slickgrid_123456',
  onSelectedRowsChanged: new SlickEvent(),
  registerPlugin: vi.fn(),
} as unknown as SlickGrid;

describe('Slick-Footer Component', () => {
  let component: SlickFooterComponent;
  let div: HTMLDivElement;
  let eventPubSubService: EventPubSubService;
  let translateService: TranslateServiceStub;
  let mockTimestamp: Date;

  beforeEach(() => {
    div = document.createElement('div');
    document.body.appendChild(div);
    eventPubSubService = new EventPubSubService();
    translateService = new TranslateServiceStub();
    mockTimestamp = new Date('2019-05-03T00:00:01');

    mockGridOptions.customFooterOptions = {
      dateFormat: 'YYYY-MM-DD, h:mm:ssa',
      metricSeparator: '|',
      metricTexts: {
        items: 'some items',
        lastUpdate: 'some last update',
        of: 'some of'
      }
    };
  });

  describe('Integration Tests', () => {
    afterEach(() => {
      // clear all the spyOn mocks to not influence next test
      vi.clearAllMocks();
      component.dispose();
    });

    it('should make sure Slick-Footer is being created and rendered', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);

      const footerContainerElm = document.querySelector<HTMLSelectElement>('div.slick-custom-footer.slickgrid_123456');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(footerContainerElm).toBeTruthy();
    });

    it('should create a the Slick-Footer component in the DOM', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(translateService.getCurrentLanguage()).toBe('en');
      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
    });

    it('should create a the Slick-Footer component with only left side content when everything else is defined as hidden', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideLastUpdateTimestamp = true;
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideMetrics = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe('');
    });

    it('should create a the Slick-Footer component in the DOM with only right side with last update timestamp & items count', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(removeExtraSpaces(rightFooterElm.innerHTML)).toBe(removeExtraSpaces(
        `<span class="timestamp"><span><span class="text-last-update">some last update</span>
        <span class="last-update-timestamp">2019-05-03, 12:00:01am</span>
          <span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span class="text-of">some of</span><span class="total-count">99</span>
          <span class="text-items">some items</span>`));
    });

    it('should create a the Slick-Footer component in the DOM with metrics but without timestamp when hidding it', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideMetrics = false;
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideLastUpdateTimestamp = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(removeExtraSpaces(rightFooterElm.innerHTML)).toBe(removeExtraSpaces(
        `<span class="timestamp"></span>
          <span class="item-count">7</span><span class="text-of">some of</span><span class="total-count">99</span>
          <span class="text-items">some items</span>`));
    });

    it('should create a the Slick-Footer component in the DOM with metrics but without timestamp neither totalCount when hidding it', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideMetrics = false;
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideLastUpdateTimestamp = true;
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideTotalItemCount = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(removeExtraSpaces(rightFooterElm.innerHTML)).toBe(removeExtraSpaces(
        `<span class="timestamp"></span>
          <span class="item-count">7</span>
          <span class="text-items">some items</span>`));
    });

    it('should create a the Slick-Footer component in the DOM and expect to use default English locale when none of the metricsText are defined', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).metricTexts = { items: '', lastUpdate: '', of: '' };

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(removeExtraSpaces(rightFooterElm.innerHTML)).toBe(removeExtraSpaces(
        `<span class="timestamp"><span><span class="text-last-update">Last Update</span>
        <span class="last-update-timestamp">2019-05-03, 12:00:01am</span>
          <span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span class="text-of">of</span><span class="total-count">99</span>
          <span class="text-items">items</span>`));
    });

    it('should throw an error when enabling translate without a Translate Service', () => {
      mockGridOptions.enableTranslate = true;
      expect(() => new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, null as any))
        .toThrow('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    });

    it('should create a the Slick-Footer component in the DOM and use different locale when enableTranslate is enabled', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).metricTexts = { itemsKey: 'ITEMS', lastUpdateKey: 'LAST_UPDATE', ofKey: 'OF' };
      mockGridOptions.enableTranslate = true;
      translateService.use('en');
      eventPubSubService.publish('onLanguageChange', 'fr');

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      translateService.use('fr');
      eventPubSubService.publish('onLanguageChange', 'fr');
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(removeExtraSpaces(rightFooterElm.innerHTML)).toBe(removeExtraSpaces(
        `<span class="timestamp"><span><span class="text-last-update">Dernière mise à jour</span>
          <span class="last-update-timestamp">2019-05-03, 12:00:01am</span><span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span class="text-of">de</span><span class="total-count">99</span>
          <span class="text-items">éléments</span>`));
    });

    it('should read initial custom left text from grid options and display it on the left side footer section when calling the leftFooterText SETTER', () => {
      mockGridOptions.enableCheckboxSelector = true;
      const customFooterOptions = mockGridOptions.customFooterOptions as CustomFooterOption;
      customFooterOptions.leftFooterText = 'initial left footer text';
      component = new SlickFooterComponent(gridStub, customFooterOptions, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;

      expect(component.eventHandler).toEqual(expect.any(Object));
      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('initial left footer text');
    });

    it('should display custom text on the left side footer section when calling the leftFooterText SETTER', () => {
      mockGridOptions.enableCheckboxSelector = true;
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };
      component.leftFooterText = 'custom left footer text';

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(component.eventHandler).toEqual(expect.any(Object));
      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('custom left footer text');
      expect(removeExtraSpaces(rightFooterElm.innerHTML)).toBe(removeExtraSpaces(
        `<span class="timestamp"><span><span class="text-last-update">some last update</span><span class="last-update-timestamp">2019-05-03, 12:00:01am</span><span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span class="text-of">some of</span><span class="total-count">99</span>
          <span class="text-items">some items</span>`));
    });

    it('should display 1 items selected on the left side footer section after triggering "onSelectedRowsChanged" event', () => {
      mockGridOptions.enableCheckboxSelector = true;
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };
      gridStub.onSelectedRowsChanged.notify({ rows: [1], grid: gridStub, previousSelectedRows: [] } as any);

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(component.eventHandler).toEqual(expect.any(Object));
      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('1 items selected');
      expect(removeExtraSpaces(rightFooterElm.innerHTML)).toBe(removeExtraSpaces(
        `<span class="timestamp"><span><span class="text-last-update">some last update</span>
          <span class="last-update-timestamp">2019-05-03, 12:00:01am</span><span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span class="text-of">some of</span><span class="total-count">99</span>
          <span class="text-items">some items</span>`));

      gridStub.onSelectedRowsChanged.notify({ rows: [1, 2, 3, 4, 5], grid: gridStub, previousSelectedRows: [] } as any);
      expect(leftFooterElm.innerHTML).toBe('5 items selected');
    });

    it('should not not display row selection count after triggering "onSelectedRowsChanged" event when "hideRowSelectionCount" is set to True', () => {
      mockGridOptions.enableCheckboxSelector = true;
      mockGridOptions.customFooterOptions!.hideRowSelectionCount = true;
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };
      gridStub.onSelectedRowsChanged.notify({ rows: [1], grid: gridStub, previousSelectedRows: [] } as any);

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer.metrics') as HTMLSpanElement;

      expect(component.eventHandler).toEqual(expect.any(Object));
      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(removeExtraSpaces(rightFooterElm.innerHTML)).toBe(removeExtraSpaces(
        `<span class="timestamp"><span><span class="text-last-update">some last update</span>
          <span class="last-update-timestamp">2019-05-03, 12:00:01am</span><span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span class="text-of">some of</span><span class="total-count">99</span>
          <span class="text-items">some items</span>`));
    });

    it('should display row selection count on the left side footer section after triggering "onSelectedRowsChanged" event', () => {
      mockGridOptions.enableCheckboxSelector = true;
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      gridStub.onSelectedRowsChanged.notify({ rows: [1], previousSelectedRows: [], grid: gridStub, } as any);

      expect(component).toBeTruthy();
      expect(component.leftFooterText).toEqual('1 items selected');

      gridStub.onSelectedRowsChanged.notify({ rows: [1, 2, 3, 4, 5], previousSelectedRows: [], grid: gridStub, } as any);
      expect(component.leftFooterText).toEqual('5 items selected');
    });

    it('should display row selection count in French on the left side footer section after triggering "onSelectedRowsChanged" event when using "fr" as locale', () => {
      translateService.use('fr');
      (mockGridOptions.customFooterOptions as CustomFooterOption).metricTexts = { itemsKey: 'ITEMS', itemsSelectedKey: 'ITEMS_SELECTED', lastUpdateKey: 'LAST_UPDATE', ofKey: 'OF' };
      mockGridOptions.enableTranslate = true;
      mockGridOptions.enableCheckboxSelector = true;
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);

      gridStub.onSelectedRowsChanged.notify({ rows: [1], previousSelectedRows: [], grid: gridStub, } as any);
      expect(component.leftFooterText).toEqual('1 éléments sélectionnés');

      gridStub.onSelectedRowsChanged.notify({ rows: [1, 2, 3, 4, 5], previousSelectedRows: [], grid: gridStub, } as any);
      expect(component.leftFooterText).toEqual('5 éléments sélectionnés');
    });

    it('should not display row selection count after triggering "onSelectedRowsChanged" event if "hideRowSelectionCount" is set to True', () => {
      mockGridOptions.enableCheckboxSelector = true;
      mockGridOptions.customFooterOptions!.hideRowSelectionCount = true;
      component.renderFooter(div);
      gridStub.onSelectedRowsChanged.notify({ rows: [1], previousSelectedRows: [], grid: gridStub, } as any);
      expect(component.leftFooterText).toBe('0 items selected');
    });

    it('should read initial custom right text from grid options and display it on the right side footer section when calling the rightFooterText SETTER', () => {
      mockGridOptions.enableCheckboxSelector = true;
      const customFooterOptions = mockGridOptions.customFooterOptions as CustomFooterOption;
      customFooterOptions.rightFooterText = 'initial right footer text';
      component = new SlickFooterComponent(gridStub, customFooterOptions, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer') as HTMLSpanElement;

      expect(component.eventHandler).toEqual(expect.any(Object));
      expect(footerContainerElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(rightFooterElm.innerHTML).toBe('initial right footer text');
      expect(component.rightFooterText).toBe('initial right footer text');
    });

    it('should display custom text on the right side footer section when calling the rightFooterText SETTER', () => {
      mockGridOptions.enableCheckboxSelector = true;
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, eventPubSubService, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };
      component.rightFooterText = 'custom right footer text';

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.right-footer') as HTMLSpanElement;

      expect(component.eventHandler).toEqual(expect.any(Object));
      expect(footerContainerElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(rightFooterElm.innerHTML).toBe('custom right footer text');
      expect(component.rightFooterText).toBe('custom right footer text');
    });
  });
});
