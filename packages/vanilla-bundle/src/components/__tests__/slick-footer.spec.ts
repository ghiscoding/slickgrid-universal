import { CustomFooterOption, GridOption, SlickGrid } from '@slickgrid-universal/common';
import { SlickFooterComponent } from '../slick-footer.component';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\s{2,}/g, '');
}

const mockGridOptions = {
  enableTranslate: false,
  showCustomFooter: true,
} as GridOption;

const gridStub = {
  getOptions: () => mockGridOptions,
  getUID: () => 'slickgrid_123456',
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

describe('Slick-Footer Component', () => {
  let component: SlickFooterComponent;
  let div: HTMLDivElement;
  let translateService: TranslateServiceStub;
  let mockTimestamp: Date;

  beforeEach(() => {
    div = document.createElement('div');
    document.body.appendChild(div);
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
      jest.clearAllMocks();
      component.dispose();
    });

    it('should make sure Slick-Footer is being created and rendered', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, translateService);
      component.renderFooter(div);

      const footerContainerElm = document.querySelector<HTMLSelectElement>('div.slick-custom-footer.slickgrid_123456');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(footerContainerElm).toBeTruthy();
    });

    it('should create a the Slick-Footer component in the DOM', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, translateService);
      component.renderFooter(div);

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.metrics') as HTMLSpanElement;

      expect(translateService.getCurrentLanguage()).toBe('en');
      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
    });

    it('should create a the Slick-Footer component with only left side content when everything else is defined as hidden', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideLastUpdateTimestamp = true;
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideMetrics = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe('');
    });

    it('should create a the Slick-Footer component in the DOM with only right side with last update timestamp & items count', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe(removeExtraSpaces(
        `<div class="right-footer metrics ">
          <span class="timestamp"><span><span class="last-update">some last update 2019-05-03, 12:00:01am</span><span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span> some of </span><span class="total-count">99</span><span> some items </span>
        </div>`));
    });

    it('should create a the Slick-Footer component in the DOM with metrics but without timestamp when hidding it', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideMetrics = false;
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideLastUpdateTimestamp = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe(removeExtraSpaces(
        `<div class="right-footer metrics ">
          <span class="timestamp"></span>
          <span class="item-count">7</span><span> some of </span><span class="total-count">99</span><span> some items </span>
        </div>`));
    });

    it('should create a the Slick-Footer component in the DOM with metrics but without timestamp neither totalCount when hidding it', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideMetrics = false;
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideLastUpdateTimestamp = true;
      (mockGridOptions.customFooterOptions as CustomFooterOption).hideTotalItemCount = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe(removeExtraSpaces(
        `<div class="right-footer metrics ">
          <span class="timestamp"></span>
          <span class="item-count">7</span><span> some items </span>
        </div>`));
    });

    it('should create a the Slick-Footer component in the DOM and expect to use default English locale when none of the metricsText are defined', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).metricTexts = { items: '', lastUpdate: '', of: '' };

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe(removeExtraSpaces(
        `<div class="right-footer metrics ">
          <span class="timestamp"><span><span class="last-update">Last Update 2019-05-03, 12:00:01am</span><span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span> of </span><span class="total-count">99</span><span> items </span>
        </div>`));
    });

    it('should create a the Slick-Footer component in the DOM and use different locale when enableTranslate is enabled', () => {
      (mockGridOptions.customFooterOptions as CustomFooterOption).metricTexts = { itemsKey: 'ITEMS', lastUpdateKey: 'LAST_UPDATE', ofKey: 'OF' };
      mockGridOptions.enableTranslate = true;
      translateService.use('fr');

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions as CustomFooterOption, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector('div.slick-custom-footer.slickgrid_123456') as HTMLDivElement;
      const leftFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.left-footer') as HTMLSpanElement;
      const rightFooterElm = document.querySelector('div.slick-custom-footer.slickgrid_123456 > div.metrics') as HTMLSpanElement;

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe(removeExtraSpaces(
        `<div class="right-footer metrics ">
          <span class="timestamp"><span><span class="last-update">Dernière mise à jour 2019-05-03, 12:00:01am</span><span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span> de </span><span class="total-count">99</span><span> éléments </span>
        </div>`));
    });
  });
});
