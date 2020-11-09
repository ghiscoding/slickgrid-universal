import { GridOption, SlickGrid } from '@slickgrid-universal/common';
import { SlickEmptyWarningComponent } from '../slick-empty-warning.component';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

const GRID_UID = 'slickgrid_123456';

const mockGridOptions = {
  enableTranslate: false,
  showCustomFooter: true,
} as GridOption;

const gridStub = {
  getGridPosition: () => mockGridOptions,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

describe('Slick-Empty-Warning Component', () => {
  let component: SlickEmptyWarningComponent;
  let div: HTMLDivElement;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    div = document.createElement('div');
    div.className = GRID_UID;
    document.body.appendChild(div);
    translateService = new TranslateServiceStub();

    mockGridOptions.emptyDataWarning = {
      message: 'No data to display.',
      messageKey: 'EMPTY_DATA_WARNING_MESSAGE'
    };
  });

  describe('Integration Tests', () => {
    afterEach(() => {
      // clear all the spyOn mocks to not influence next test
      jest.clearAllMocks();
      component.dispose();
    });

    it('should expect the Slick-Empty-Warning to be created and NOT be rendered when passing False as 2nd argument and component was never rendered', () => {
      component = new SlickEmptyWarningComponent(gridStub);
      component.showEmptyDataMessage(false);

      const componentElm = document.querySelector<HTMLSelectElement>('div.slickgrid_123456.slick-empty-data-warning') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentElm).toBeFalsy();
    });

    it('should expect the Slick-Empty-Warning to be created and rendered and passing true as 2nd argument', () => {
      component = new SlickEmptyWarningComponent(gridStub);
      component.showEmptyDataMessage(true);

      const componentElm = document.querySelector<HTMLSelectElement>('div.slickgrid_123456.slick-empty-data-warning') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentElm).toBeTruthy();
      expect(componentElm.style.display).toBe('block');
      expect(componentElm.textContent).toBe('No data to display.');
    });

    it('should expect the Slick-Empty-Warning to change some options and display a different message when provided as an option', () => {
      const mockGridPosition = { top: 500, left: 42, bottom: 34, right: 15, height: 800, width: 450, visible: true };
      const mockOptions = { message: 'No Record found.', class: 'custom-class', marginTop: 22, marginLeft: 11 };
      jest.spyOn(gridStub, 'getGridPosition').mockReturnValue(mockGridPosition);
      component = new SlickEmptyWarningComponent(gridStub);
      component.showEmptyDataMessage(true, mockOptions);

      const componentElm = document.querySelector<HTMLSelectElement>('div.slickgrid_123456.custom-class') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentElm).toBeTruthy();
      expect(componentElm.style.display).toBe('block');
      expect(componentElm.style.top).toBe(`${mockGridPosition.top + 22}px`); // 500 + 22
      expect(componentElm.style.left).toBe(`${mockGridPosition.left + 11}px`); // 42 + 11
      expect(componentElm.classList.contains('custom-class')).toBeTruthy();
      expect(componentElm.textContent).toBe('No Record found.');
    });

    it('should expect the Slick-Empty-Warning message to be translated to French when providing a Translater Service and "messageKey" property', () => {
      mockGridOptions.enableTranslate = true;
      translateService.use('fr');

      component = new SlickEmptyWarningComponent(gridStub, translateService);
      component.showEmptyDataMessage(true);
      const componentElm = document.querySelector<HTMLSelectElement>('div.slickgrid_123456.slick-empty-data-warning') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentElm).toBeTruthy();
      expect(componentElm.style.display).toBe('block');
      expect(componentElm.textContent).toBe('Aucune donnée à afficher.');
    });
  });
});
