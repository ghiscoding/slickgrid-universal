import { GridOption, SlickGrid } from '@slickgrid-universal/common';
import { SlickFooterComponent } from '../slick-footer';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

function removeExtraSpaces(textS: string) {
  return `${textS}`.replace(/\s{2,}/g, '');
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
      dateFormat: 'YYYY-MM-DD h:mm:ssa',
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

    it('should make sure Slick-Footer is defined', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions, translateService);
      component.renderFooter(div);

      const footerContainerElm = document.querySelector<HTMLSelectElement>('div.slick-custom-footer.slickgrid_123456');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(footerContainerElm).toBeTruthy();
    });

    it('should create a the Slick-Footer component in the DOM', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions, translateService);
      component.renderFooter(div);

      const footerContainerElm = document.querySelector<HTMLDivElement>('div.slick-custom-footer.slickgrid_123456');
      const leftFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.left-footer');
      const rightFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.metrics');

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
    });

    it('should create a the Slick-Footer component with only left side content when everything else is defined as hidden', () => {
      mockGridOptions.customFooterOptions.hideLastUpdateTimestamp = true;
      mockGridOptions.customFooterOptions.hideMetrics = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector<HTMLDivElement>('div.slick-custom-footer.slickgrid_123456');
      const leftFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.left-footer');
      const rightFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.metrics');

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe('');
    });

    it('should create a the Slick-Footer component in the DOM with only right side with last update timestamp & items count', () => {
      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector<HTMLDivElement>('div.slick-custom-footer.slickgrid_123456');
      const leftFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.left-footer');
      const rightFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.metrics');

      expect(footerContainerElm).toBeTruthy();
      expect(leftFooterElm).toBeTruthy();
      expect(rightFooterElm).toBeTruthy();
      expect(leftFooterElm.innerHTML).toBe('');
      expect(rightFooterElm.innerHTML).toBe(removeExtraSpaces(
        `<div class="right-footer metrics ">
          <span class="timestamp"><span><span class="last-update">2019-05-03 12:00:01am</span><span class="separator"> | </span></span></span>
          <span class="item-count">7</span><span> some of </span><span class="total-count">99</span><span> some items </span>
        </div>`));
    });

    it('should create a the Slick-Footer component in the DOM with metrics but without timestamp when hidding it', () => {
      mockGridOptions.customFooterOptions.hideMetrics = false;
      mockGridOptions.customFooterOptions.hideLastUpdateTimestamp = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector<HTMLDivElement>('div.slick-custom-footer.slickgrid_123456');
      const leftFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.left-footer');
      const rightFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.metrics');

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
      mockGridOptions.customFooterOptions.hideMetrics = false;
      mockGridOptions.customFooterOptions.hideLastUpdateTimestamp = true;
      mockGridOptions.customFooterOptions.hideTotalItemCount = true;

      component = new SlickFooterComponent(gridStub, mockGridOptions.customFooterOptions, translateService);
      component.renderFooter(div);
      component.metrics = { startTime: mockTimestamp, endTime: mockTimestamp, itemCount: 7, totalItemCount: 99 };

      const footerContainerElm = document.querySelector<HTMLDivElement>('div.slick-custom-footer.slickgrid_123456');
      const leftFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.left-footer');
      const rightFooterElm = document.querySelector<HTMLSpanElement>('div.slick-custom-footer.slickgrid_123456 > div.metrics');

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
  });
});
