import { createDomElement, type EmptyWarning, type GridOption, type SlickGrid } from '@slickgrid-universal/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContainerServiceStub } from '../../../test/containerServiceStub.js';
import { TranslateServiceStub } from '../../../test/translateServiceStub.js';
import { SlickEmptyWarningComponent } from './slick-empty-warning.component.js';

const GRID_UID = 'slickgrid_123456';

// mocked modules
vi.mock('@slickgrid-universal/common', async (importOriginal) => ({
  ...((await importOriginal()) as any),
  applyHtmlToElement: (elm: HTMLElement, val: any) => {
    if (val instanceof HTMLElement || val instanceof DocumentFragment) {
      elm.appendChild(val);
    } else {
      elm.innerHTML = val || '';
    }
  },
}));

const mockGridOptions = {
  enableTranslate: false,
  pinning: { columns: { left: 0 } },
} as GridOption;

const gridStub = {
  getGridPosition: () => mockGridOptions,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  registerPlugin: vi.fn(),
} as unknown as SlickGrid;

describe('Slick-Empty-Warning Component', () => {
  let container: ContainerServiceStub;
  let component: SlickEmptyWarningComponent;
  let div: HTMLDivElement;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    div = document.createElement('div');
    const contentRoot = document.createElement('div');
    contentRoot.className = 'slick-content-root';
    contentRoot.style.height = '44px';
    const paneRight = document.createElement('div');
    paneRight.className = 'slick-right-root';
    paneRight.style.height = '44px';
    const canvasLeft = document.createElement('div');
    const canvasRight = document.createElement('div');
    canvasLeft.className = 'grid-canvas grid-canvas-left';
    canvasRight.className = 'grid-canvas grid-canvas-right';
    div.className = `slickgrid-container ${GRID_UID}`;
    div.appendChild(contentRoot);
    div.appendChild(paneRight);
    contentRoot.appendChild(canvasLeft);
    paneRight.appendChild(canvasRight);
    document.body.appendChild(div);

    container = new ContainerServiceStub();
    translateService = new TranslateServiceStub();

    mockGridOptions.emptyDataWarning = {
      message: 'No data to display.',
      messageKey: 'EMPTY_DATA_WARNING_MESSAGE',
    };
  });

  describe('Integration Tests', () => {
    afterEach(() => {
      // clear all the spyOn mocks to not influence next test
      vi.clearAllMocks();
      component.dispose();
    });

    it('should expect the Slick-Empty-Warning to return False when calling the "showEmptyDataMessage" method without a grid object defined', () => {
      component = new SlickEmptyWarningComponent();
      component.init(null as any, container);
      const output = component.showEmptyDataMessage(false);

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(output).toBeFalsy();
    });

    it('should expect the Slick-Empty-Warning to be created and NOT be rendered when passing False as 2nd argument and component was never rendered', () => {
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(false);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeFalsy();
      expect(componentRightElm).toBeFalsy();
    });

    it('should expect the Slick-Empty-Warning to be created in both viewports and rendered and passing true as 2nd argument', () => {
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('flex');
      expect(componentRightElm.style.display).toBe('flex');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
    });

    it('should expect the Slick-Empty-Warning to be created but not shown after calling the method twice with False on 2nd time', () => {
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true);
      component.showEmptyDataMessage(false);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('none');
      expect(componentRightElm.style.display).toBe('none');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
    });

    it('should expect the Slick-Empty-Warning to be created and use different left margin when "leftViewportMarginLeft" is set', () => {
      mockGridOptions.pinning = undefined;
      (mockGridOptions.emptyDataWarning as EmptyWarning).leftViewportMarginLeft = '40%';
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('flex');
      expect(componentRightElm.style.display).toBe('flex');
      expect(componentLeftElm.style.marginLeft).toBe('40%');
      expect(componentRightElm.style.marginLeft).toBe('0px');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
    });

    it('should expect the Slick-Empty-Warning to be created with proper height when defining a grid that has the "autoHeight" grid option', () => {
      mockGridOptions.pinning = undefined;
      (mockGridOptions.emptyDataWarning as EmptyWarning).leftViewportMarginLeft = '40%';
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      mockGridOptions.autoHeight = true;
      mockGridOptions.rowHeight = 55;
      component.showEmptyDataMessage(true);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const contentRootElm = document.querySelector<HTMLDivElement>('.slick-content-root');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('flex');
      expect(componentRightElm.style.display).toBe('flex');
      expect(componentLeftElm.style.marginLeft).toBe('40%');
      expect(componentRightElm.style.marginLeft).toBe('0px');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
      expect(contentRootElm!.style.minHeight).toBe('44px');
      expect(contentRootElm!.style.height).toBe('44px');
    });

    it('should expect the Slick-Empty-Warning to be created with calculated height including preHeader & filter headerRow when they are both defined in the grid options with "autoHeight" as well', () => {
      mockGridOptions.pinning = undefined;
      (mockGridOptions.emptyDataWarning as EmptyWarning).leftViewportMarginLeft = '40%';
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      mockGridOptions.autoHeight = true;
      mockGridOptions.createPreHeaderPanel = true;
      mockGridOptions.enableFiltering = true;
      mockGridOptions.rowHeight = 55;
      mockGridOptions.preHeaderPanelHeight = 33;
      mockGridOptions.headerRowHeight = 40;
      component.showEmptyDataMessage(true);
      component.showEmptyDataMessage(false);
      component.showEmptyDataMessage(true);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const contentRootElm = document.querySelector<HTMLDivElement>('.slick-content-root');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('flex');
      expect(componentRightElm.style.display).toBe('flex');
      expect(componentLeftElm.style.marginLeft).toBe('40%');
      expect(componentRightElm.style.marginLeft).toBe('0px');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
      expect(contentRootElm!.style.minHeight).toBe('117px');
      expect(contentRootElm!.style.height).toBe('44px');
    });

    it('should expect the Slick-Empty-Warning to be created when defining a grid that has the "autoHeight" grid option but hidden when calling it the show warning with True then False', () => {
      mockGridOptions.pinning = undefined;
      (mockGridOptions.emptyDataWarning as EmptyWarning).leftViewportMarginLeft = '40%';
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      mockGridOptions.autoHeight = true;
      mockGridOptions.createPreHeaderPanel = false;
      mockGridOptions.enableFiltering = false;
      mockGridOptions.rowHeight = 55;
      component.showEmptyDataMessage(true);
      component.showEmptyDataMessage(false);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const contentRootElm = document.querySelector<HTMLDivElement>('.slick-content-root');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('none');
      expect(componentRightElm.style.display).toBe('none');
      expect(componentLeftElm.style.marginLeft).toBe('40%');
      expect(componentRightElm.style.marginLeft).toBe('0px');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
      expect(contentRootElm!.style.minHeight).toBe('44px');
      expect(contentRootElm!.style.height).toBe('44px');
    });

    it('should expect the Slick-Empty-Warning to be created and use different left margin when "rightViewportMarginLeft" is set', () => {
      mockGridOptions.pinning = undefined;
      (mockGridOptions.emptyDataWarning as EmptyWarning).rightViewportMarginLeft = '40%';
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);

      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('flex');
      expect(componentRightElm.style.display).toBe('flex');
      expect(componentLeftElm.style.marginLeft).toBe('0px');
      expect(componentRightElm.style.marginLeft).toBe('40%');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
    });

    it('should expect the Slick-Empty-Warning to be created in both viewports and use different left margin when "pinnedLeftViewportMarginLeft" is set', () => {
      mockGridOptions.pinning = { columns: { left: 2 } };
      (mockGridOptions.emptyDataWarning as EmptyWarning).leftViewportMarginLeft = '40%';
      (mockGridOptions.emptyDataWarning as EmptyWarning).pinnedLeftViewportMarginLeft = '15px';
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('flex');
      expect(componentRightElm.style.display).toBe('flex');
      expect(componentLeftElm.style.marginLeft).toBe('15px');
      expect(componentRightElm.style.marginLeft).toBe('0px');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
    });

    it('should expect the Slick-Empty-Warning to be created in both viewports and use different left margin when "pinnedRightViewportMarginLeft" is set', () => {
      mockGridOptions.pinning = { columns: { left: 2 } };
      (mockGridOptions.emptyDataWarning as EmptyWarning).leftViewportMarginLeft = '40%';
      (mockGridOptions.emptyDataWarning as EmptyWarning).pinnedRightViewportMarginLeft = '22px';
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true);

      const componentLeftElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-left .slick-empty-data-warning'
      ) as HTMLSelectElement;
      const componentRightElm = document.querySelector<HTMLSelectElement>(
        'div.slickgrid_123456 .grid-canvas.grid-canvas-right .slick-empty-data-warning'
      ) as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentLeftElm).toBeTruthy();
      expect(componentLeftElm.style.display).toBe('flex');
      expect(componentRightElm.style.display).toBe('flex');
      expect(componentLeftElm.style.marginLeft).toBe('0px');
      expect(componentRightElm.style.marginLeft).toBe('22px');
      expect(componentLeftElm.textContent).toBe('No data to display.');
      expect(componentRightElm.textContent).toBe('No data to display.');
    });

    it('should expect the Slick-Empty-Warning to change some options and display a different message when provided as an option', () => {
      const mockOptions = {
        message: '<span class="mdi mdi-alert color-warning"></span> No Record found.',
        className: 'custom-class',
        marginTop: 22,
        marginLeft: 11,
      };
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true, mockOptions);

      const componentElm = document.querySelector<HTMLSelectElement>('div.slickgrid_123456 .grid-canvas .custom-class') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentElm).toBeTruthy();
      expect(componentElm.style.display).toBe('flex');
      expect(componentElm.classList.contains('custom-class')).toBeTruthy();
      expect(componentElm.innerHTML).toBe('<span class="mdi mdi-alert color-warning"></span> No Record found.');
    });

    it('should expect the Slick-Empty-Warning to change some options and display a different message is provided as a DocumentFragment', () => {
      const emptyWarningElm = new DocumentFragment();
      emptyWarningElm.appendChild(createDomElement('span', { className: 'mdi mdi-alert color-warning' }));
      emptyWarningElm.appendChild(document.createTextNode(' No Record found.'));

      const mockOptions = { message: emptyWarningElm, className: 'custom-class', marginTop: 22, marginLeft: 11 };
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true, mockOptions);

      const componentElm = document.querySelector<HTMLSelectElement>('div.slickgrid_123456 .grid-canvas .custom-class') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentElm).toBeTruthy();
      expect(componentElm.style.display).toBe('flex');
      expect(componentElm.classList.contains('custom-class')).toBeTruthy();
      expect(componentElm.innerHTML).toBe('<span class="mdi mdi-alert color-warning"></span> No Record found.');
    });

    it('should expect the Slick-Empty-Warning to change some options and display a different message is provided as an HTMLElement', () => {
      const emptyWarningElm = createDomElement('div', { className: 'container' });
      emptyWarningElm.appendChild(createDomElement('span', { className: 'mdi mdi-alert color-warning' }));
      emptyWarningElm.appendChild(document.createTextNode(' No Record found.'));

      const mockOptions = { message: emptyWarningElm, className: 'custom-class', marginTop: 22, marginLeft: 11 };
      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true, mockOptions);

      const componentElm = document.querySelector<HTMLSelectElement>('div.slickgrid_123456 .grid-canvas .custom-class') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentElm).toBeTruthy();
      expect(componentElm.style.display).toBe('flex');
      expect(componentElm.classList.contains('custom-class')).toBeTruthy();
      expect(componentElm.innerHTML).toBe('<div class="container"><span class="mdi mdi-alert color-warning"></span> No Record found.</div>');
    });

    it('should expect the Slick-Empty-Warning message to be translated to French when providing a Translater Service and "messageKey" property', () => {
      container.registerInstance('TranslaterService', translateService);
      mockGridOptions.enableTranslate = true;
      translateService.use('fr');

      component = new SlickEmptyWarningComponent();
      component.init(gridStub, container);
      component.showEmptyDataMessage(true);
      const componentElm = document.querySelector<HTMLSelectElement>('div.slickgrid_123456 .grid-canvas .slick-empty-data-warning') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(componentElm).toBeTruthy();
      expect(componentElm.style.display).toBe('flex');
      expect(componentElm.textContent).toBe('Aucune donnée à afficher.');
    });
  });
});
