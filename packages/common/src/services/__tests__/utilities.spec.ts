import type { EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { basicFetchStub } from '../../../../../test/httpClientStub.js';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub.js';
import { SumAggregator } from '../../aggregators/sumAggregator.js';
import { Constants } from '../../constants.js';
import { applyHtmlToElement } from '../../core/utils.js';
import type { Column, GridOption, TreeDataPropNames } from '../../interfaces/index.js';
import {
  addTreeLevelAndAggregatorsByMutation,
  addTreeLevelByMutation,
  cancellablePromise,
  CancelledException,
  castObservableToPromise,
  decimalFormatted,
  fetchAsPromise,
  findItemInTreeStructure,
  findOrDefault,
  flattenToParentChildArray,
  formatNumber,
  getColumnFieldType,
  getDescendantProperty,
  getTranslationPrefix,
  getTreeDataOptionPropName,
  isColumnDateType,
  mapOperatorByFieldType,
  mapOperatorToShorthandDesignation,
  mapOperatorType,
  sortPresetColumns,
  thousandSeparatorFormatted,
  unflattenParentChildArrayToTree,
  unsubscribeAll,
} from '../utilities.js';

describe('applyHtmlToElement() method', () => {
  const defaultOptions: GridOption = {
    enableCellNavigation: true,
    columnResizingDelay: 1,
    scrollRenderThrottling: 1,
    asyncEditorLoadDelay: 1,
    asyncPostRenderDelay: 1,
    asyncPostRenderCleanupDelay: 2,
    devMode: { ownerNodeIndex: 0 },
  };

  it('should be able to apply HTMLElement to a HTMLElement target and empty its content by default', () => {
    const divElm = document.createElement('div');
    divElm.textContent = 'text to be erased';
    const spanElm = document.createElement('span');
    spanElm.textContent = 'some text';

    applyHtmlToElement(divElm, spanElm, defaultOptions);

    expect(divElm.outerHTML).toBe('<div><span>some text</span></div>');
  });

  it('should be able to apply HTMLElement to a HTMLElement target but not empty its content when defined', () => {
    const divElm = document.createElement('div');
    divElm.textContent = 'text not erased';
    const spanElm = document.createElement('span');
    spanElm.textContent = 'some text';

    applyHtmlToElement(divElm, spanElm, { emptyTarget: false });

    expect(divElm.outerHTML).toBe('<div>text not erased<span>some text</span></div>');
  });

  it('should be able to skip empty text content assignment to HTMLElement', () => {
    const divElm = document.createElement('div');
    divElm.textContent = 'text not erased';
    const spanElm = document.createElement('span');
    spanElm.textContent = '';

    applyHtmlToElement(divElm, spanElm, { emptyTarget: false, skipEmptyReassignment: true });

    expect(divElm.outerHTML).toBe('<div>text not erased<span></span></div>');
  });

  it('should be able to apply DocumentFragment to a HTMLElement target', () => {
    const fragment = document.createDocumentFragment();
    const divElm = document.createElement('div');
    const spanElm = document.createElement('span');
    spanElm.textContent = 'some text';
    divElm.appendChild(spanElm);
    fragment.appendChild(spanElm);

    applyHtmlToElement(divElm, fragment);

    expect(divElm.outerHTML).toBe('<div><span>some text</span></div>');
  });

  it('should be able to apply a number and not expect it to be sanitized but parsed as string', () => {
    const divElm = document.createElement('div');

    applyHtmlToElement(divElm, 123);

    expect(divElm.outerHTML).toBe('<div>123</div>');
  });

  it('should be able to apply a boolean and not expect it to be sanitized but parsed as string', () => {
    const divElm = document.createElement('div');
    applyHtmlToElement(divElm, false);

    expect(divElm.outerHTML).toBe('<div>false</div>');
  });

  it('should be able to supply a custom sanitizer to use before applying html code', () => {
    const sanitizer = (dirtyHtml: string) =>
      typeof dirtyHtml === 'string'
        ? dirtyHtml.replace(
            /(\b)(on[a-z]+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script(>*)|(&lt;)(\/*)(script|script defer)(.*)(&gt;|&gt;">)/gi,
            ''
          )
        : dirtyHtml;
    const divElm = document.createElement('div');
    const htmlStr = '<span><script>alert("hello")</script>only text kept</span>';

    applyHtmlToElement(divElm, htmlStr, { ...defaultOptions, sanitizer, enableHtmlRendering: true });

    expect(divElm.outerHTML).toBe('<div><span>only text kept</span></div>');
  });

  it('should expect HTML string to be kept as a string and not be converted (but html escaped) when "enableHtmlRendering" grid option is disabled', () => {
    const divElm = document.createElement('div');
    const htmlStr = '<span aria-label="some aria label">only text kept</span>';

    applyHtmlToElement(divElm, htmlStr, { ...defaultOptions, enableHtmlRendering: false });

    expect(divElm.outerHTML).toBe('<div>&lt;span aria-label="some aria label"&gt;only text kept&lt;/span&gt;</div>');
  });
});

describe('Service/Utilies', () => {
  describe('unflattenParentChildArrayToTree method', () => {
    it('should take a parent/child array and return a hierarchical array structure', () => {
      const input = [
        { id: 18, size: 90, dateModified: '2015-03-03', file: 'something.txt', parentId: null },
        { id: 11, file: 'Music', parentId: null },
        { id: 12, file: 'mp3', parentId: 11 },
        { id: 16, file: 'rock', parentId: 12 },
        { id: 17, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, parentId: 16 },
        { id: 14, file: 'pop', parentId: 12 },
        { id: 15, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, parentId: 14 },
      ];

      const output = unflattenParentChildArrayToTree(input, { parentPropName: 'parentId', childrenPropName: 'files' });

      expect(output).toEqual([
        {
          id: 11,
          __treeLevel: 0,
          __collapsed: false,
          parentId: null,
          file: 'Music',
          files: [
            {
              id: 12,
              __treeLevel: 1,
              __collapsed: false,
              parentId: 11,
              file: 'mp3',
              files: [
                {
                  id: 14,
                  __treeLevel: 2,
                  __collapsed: false,
                  parentId: 12,
                  file: 'pop',
                  files: [{ id: 15, __treeLevel: 3, parentId: 14, file: 'theme.mp3', dateModified: '2015-03-01', size: 85 }],
                },
                {
                  id: 16,
                  __treeLevel: 2,
                  __collapsed: false,
                  parentId: 12,
                  file: 'rock',
                  files: [{ id: 17, __treeLevel: 3, parentId: 16, file: 'soft.mp3', dateModified: '2015-05-13', size: 98 }],
                },
              ],
            },
          ],
        },
        { id: 18, __treeLevel: 0, parentId: null, file: 'something.txt', dateModified: '2015-03-03', size: 90 },
      ]);
    });

    it('should produce same result when calling the function twice with input that have a parent/child array and return a hierarchical array structure', () => {
      const input = [
        { id: 18, size: 90, dateModified: '2015-03-03', file: 'something.txt', parentId: null },
        { id: 11, file: 'Music', parentId: null },
        { id: 12, file: 'mp3', parentId: 11 },
        { id: 16, file: 'rock', parentId: 12 },
        { id: 17, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, parentId: 16 },
        { id: 14, file: 'pop', parentId: 12 },
        { id: 15, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, parentId: 14 },
      ];

      const output1 = unflattenParentChildArrayToTree(input, { parentPropName: 'parentId', childrenPropName: 'files' });
      const output2 = unflattenParentChildArrayToTree(input, { parentPropName: 'parentId', childrenPropName: 'files' });

      expect(output1).toEqual([
        {
          id: 11,
          __treeLevel: 0,
          __collapsed: false,
          parentId: null,
          file: 'Music',
          files: [
            {
              id: 12,
              __treeLevel: 1,
              __collapsed: false,
              parentId: 11,
              file: 'mp3',
              files: [
                {
                  id: 14,
                  __treeLevel: 2,
                  __collapsed: false,
                  parentId: 12,
                  file: 'pop',
                  files: [{ id: 15, __treeLevel: 3, parentId: 14, file: 'theme.mp3', dateModified: '2015-03-01', size: 85 }],
                },
                {
                  id: 16,
                  __treeLevel: 2,
                  __collapsed: false,
                  parentId: 12,
                  file: 'rock',
                  files: [{ id: 17, __treeLevel: 3, parentId: 16, file: 'soft.mp3', dateModified: '2015-05-13', size: 98 }],
                },
              ],
            },
          ],
        },
        { id: 18, __treeLevel: 0, parentId: null, file: 'something.txt', dateModified: '2015-03-03', size: 90 },
      ]);
      expect(output1).toEqual(output2);
    });

    it('should take a parent/child array with aggregators and return a hierarchical array structure', () => {
      const input = [
        { id: 18, size: 90, dateModified: '2015-03-03', file: 'something.txt', parentId: null },
        { id: 11, file: 'Music', parentId: null, __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } } },
        { id: 12, file: 'mp3', parentId: 11, __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } } },
        { id: 16, file: 'rock', parentId: 12, __treeTotals: { count: { size: 2 }, sum: { size: 98 } } },
        { id: 17, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, parentId: 16 },
        { id: 14, file: 'pop', parentId: 12, __treeTotals: { count: { size: 2 }, sum: { size: 85 } } },
        { id: 15, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, parentId: 14 },
      ];

      const output = unflattenParentChildArrayToTree(input, {
        aggregators: [new SumAggregator('size')],
        parentPropName: 'parentId',
        childrenPropName: 'files',
      });

      expect(output).toEqual([
        {
          id: 11,
          __treeLevel: 0,
          __collapsed: false,
          parentId: null,
          file: 'Music',
          __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } },
          files: [
            {
              id: 12,
              __treeLevel: 1,
              __collapsed: false,
              parentId: 11,
              file: 'mp3',
              __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } },
              files: [
                {
                  id: 14,
                  __treeLevel: 2,
                  __collapsed: false,
                  parentId: 12,
                  file: 'pop',
                  __treeTotals: { count: { size: 1 }, sum: { size: 85 } },
                  files: [{ id: 15, __treeLevel: 3, parentId: 14, file: 'theme.mp3', dateModified: '2015-03-01', size: 85 }],
                },
                {
                  id: 16,
                  __treeLevel: 2,
                  __collapsed: false,
                  parentId: 12,
                  file: 'rock',
                  __treeTotals: { count: { size: 1 }, sum: { size: 98 } },
                  files: [{ id: 17, __treeLevel: 3, parentId: 16, file: 'soft.mp3', dateModified: '2015-05-13', size: 98 }],
                },
              ],
            },
          ],
        },
        { id: 18, __treeLevel: 0, parentId: null, file: 'something.txt', dateModified: '2015-03-03', size: 90 },
      ]);
    });

    it('should produce same result when calling the function multiple times with input that have a parent/child array with aggregators and return a hierarchical array structure', () => {
      const input = [
        { id: 18, size: 90, dateModified: '2015-03-03', file: 'something.txt', parentId: null },
        { id: 11, file: 'Music', parentId: null, __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } } },
        { id: 12, file: 'mp3', parentId: 11, __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } } },
        { id: 16, file: 'rock', parentId: 12, __treeTotals: { count: { size: 2 }, sum: { size: 98 } } },
        { id: 17, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, parentId: 16 },
        { id: 14, file: 'pop', parentId: 12, __treeTotals: { count: { size: 2 }, sum: { size: 85 } } },
        { id: 15, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, parentId: 14 },
      ];

      const output1 = unflattenParentChildArrayToTree(input, {
        aggregators: [new SumAggregator('size')],
        parentPropName: 'parentId',
        childrenPropName: 'files',
      });
      const output2 = unflattenParentChildArrayToTree(input, {
        aggregators: [new SumAggregator('size')],
        parentPropName: 'parentId',
        childrenPropName: 'files',
      });
      const output3 = unflattenParentChildArrayToTree(input, {
        aggregators: [new SumAggregator('size')],
        parentPropName: 'parentId',
        childrenPropName: 'files',
      });

      expect(output1).toEqual([
        {
          id: 11,
          __treeLevel: 0,
          __collapsed: false,
          parentId: null,
          file: 'Music',
          __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } },
          files: [
            {
              id: 12,
              __treeLevel: 1,
              __collapsed: false,
              parentId: 11,
              file: 'mp3',
              __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } },
              files: [
                {
                  id: 14,
                  __treeLevel: 2,
                  __collapsed: false,
                  parentId: 12,
                  file: 'pop',
                  __treeTotals: { count: { size: 1 }, sum: { size: 85 } },
                  files: [{ id: 15, __treeLevel: 3, parentId: 14, file: 'theme.mp3', dateModified: '2015-03-01', size: 85 }],
                },
                {
                  id: 16,
                  __treeLevel: 2,
                  __collapsed: false,
                  parentId: 12,
                  file: 'rock',
                  __treeTotals: { count: { size: 1 }, sum: { size: 98 } },
                  files: [{ id: 17, __treeLevel: 3, parentId: 16, file: 'soft.mp3', dateModified: '2015-05-13', size: 98 }],
                },
              ],
            },
          ],
        },
        { id: 18, __treeLevel: 0, parentId: null, file: 'something.txt', dateModified: '2015-03-03', size: 90 },
      ]);
      expect(output1).toEqual(output2);
      expect(output1).toEqual(output3);
    });
  });

  describe('cancellablePromise method', () => {
    it('should return the same input when it is not a Promise provided', () => {
      const notPromise = () => true;
      const wrappedOutput = cancellablePromise(notPromise as any);

      expect(wrappedOutput).toEqual(notPromise);
    });

    it('should throw a CancelledException when calling the "cancel" method on the wrapped cancellable promise', () =>
      new Promise((done: any) => {
        const promise = new Promise((resolve) => resolve(true));
        const wrappedPromise = cancellablePromise(promise);

        wrappedPromise.promise.catch((e) => {
          expect(e).toEqual(new CancelledException('Cancelled Promise'));
          done();
        });
        const output = wrappedPromise.cancel();
        expect(output).toBe(true);
      }));

    it('should execute Promise as regular when it is not cancelled', () =>
      new Promise((done: any) => {
        const promise = new Promise((resolve) => resolve(true));
        const wrappedPromise = cancellablePromise(promise);

        wrappedPromise.promise.then((output) => {
          expect(output).toBe(true);
          done();
        });
      }));
  });

  describe('castObservableToPromise method', () => {
    let rxjs: RxJsResourceStub;
    beforeEach(() => {
      rxjs = new RxJsResourceStub();
    });

    it('should throw an error when argument provided is not a Promise neither an Observable', async () => {
      expect(() => castObservableToPromise(rxjs, null as any)).toThrow('Something went wrong,');
    });

    it('should return original Promise when argument is already a Promise', async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve('hello'), 1));
      const castPromise = castObservableToPromise(rxjs, promise);
      expect(promise).toBe(castPromise);
    });

    it('should be able to cast an Observable to a Promise', () => {
      const inputArray = ['hello', 'world'];
      const observable = of(inputArray);

      castObservableToPromise(rxjs, observable).then((outputArray) => {
        expect(outputArray).toBe(inputArray);
      });
    });
  });

  describe('flattenToParentChildArray method', () => {
    let mockTreeArray: any[] = [];

    beforeEach(() => {
      mockTreeArray = [
        { id: 18, file: 'something.txt', dateModified: '2015-03-03', size: 90 },
        {
          id: 11,
          file: 'Music',
          files: [
            {
              id: 12,
              file: 'mp3',
              files: [
                { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13', size: 98 }] },
                { id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01', size: 85 }] },
              ],
            },
          ],
        },
      ];
    });

    it('should return a flat array from a hierarchical structure', () => {
      addTreeLevelByMutation(mockTreeArray, { childrenPropName: 'files', levelPropName: '__treeLevel' });
      const output = flattenToParentChildArray(mockTreeArray, { childrenPropName: 'files' });
      expect(output).toEqual([
        { id: 18, size: 90, __treeLevel: 0, dateModified: '2015-03-03', file: 'something.txt', __parentId: null, __hasChildren: false },
        { id: 11, __treeLevel: 0, file: 'Music', __parentId: null, __hasChildren: true },
        { id: 12, __treeLevel: 1, file: 'mp3', __parentId: 11, __hasChildren: true },
        { id: 16, __treeLevel: 2, file: 'rock', __parentId: 12, __hasChildren: true },
        { id: 17, __treeLevel: 3, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, __parentId: 16, __hasChildren: false },
        { id: 14, __treeLevel: 2, file: 'pop', __parentId: 12, __hasChildren: true },
        { id: 15, __treeLevel: 3, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, __parentId: 14, __hasChildren: false },
      ]);
    });

    it('should return a flat array from a hierarchical structure and tree totals aggregation', () => {
      const aggregator = new SumAggregator('size');
      addTreeLevelAndAggregatorsByMutation(mockTreeArray, { aggregator, childrenPropName: 'files', levelPropName: '__treeLevel' });
      const output = flattenToParentChildArray(mockTreeArray, { childrenPropName: 'files' });
      expect(output).toEqual([
        { id: 18, size: 90, __treeLevel: 0, dateModified: '2015-03-03', file: 'something.txt', __parentId: null, __hasChildren: false },
        { id: 11, __treeLevel: 0, file: 'Music', __parentId: null, __hasChildren: true, __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } } },
        { id: 12, __treeLevel: 1, file: 'mp3', __parentId: 11, __hasChildren: true, __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } } },
        { id: 16, __treeLevel: 2, file: 'rock', __parentId: 12, __hasChildren: true, __treeTotals: { count: { size: 1 }, sum: { size: 98 } } },
        { id: 17, __treeLevel: 3, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, __parentId: 16, __hasChildren: false },
        { id: 14, __treeLevel: 2, file: 'pop', __parentId: 12, __hasChildren: true, __treeTotals: { count: { size: 1 }, sum: { size: 85 } } },
        { id: 15, __treeLevel: 3, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, __parentId: 14, __hasChildren: false },
      ]);
    });

    it('should return a flat array from a hierarchical structure and tree totals aggregation and tree level number as well', () => {
      const aggregator = new SumAggregator('size');
      addTreeLevelAndAggregatorsByMutation(mockTreeArray, { aggregator, childrenPropName: 'files', levelPropName: '__treeLevel' });
      const output = flattenToParentChildArray(mockTreeArray, { childrenPropName: 'files', shouldAddTreeLevelNumber: true, aggregators: [aggregator] });
      expect(output).toEqual([
        { id: 18, size: 90, __treeLevel: 0, dateModified: '2015-03-03', file: 'something.txt', __parentId: null, __hasChildren: false },
        { id: 11, __treeLevel: 0, file: 'Music', __parentId: null, __hasChildren: true, __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } } },
        { id: 12, __treeLevel: 1, file: 'mp3', __parentId: 11, __hasChildren: true, __treeTotals: { count: { size: 2 }, sum: { size: 98 + 85 } } },
        { id: 16, __treeLevel: 2, file: 'rock', __parentId: 12, __hasChildren: true, __treeTotals: { count: { size: 1 }, sum: { size: 98 } } },
        { id: 17, __treeLevel: 3, dateModified: '2015-05-13', file: 'soft.mp3', size: 98, __parentId: 16, __hasChildren: false },
        { id: 14, __treeLevel: 2, file: 'pop', __parentId: 12, __hasChildren: true, __treeTotals: { count: { size: 1 }, sum: { size: 85 } } },
        { id: 15, __treeLevel: 3, dateModified: '2015-03-01', file: 'theme.mp3', size: 85, __parentId: 14, __hasChildren: false },
      ]);
    });
  });

  describe('getTreeDataOptionPropName method', () => {
    let treeDataOptions: TreeDataPropNames;
    beforeEach(() => {
      treeDataOptions = {};
    });

    it('should return default constant children prop name', () => {
      const output = getTreeDataOptionPropName(treeDataOptions, 'childrenPropName');
      expect(output).toBe(Constants.treeDataProperties.CHILDREN_PROP);
    });

    it('should return default constant collapsed prop name', () => {
      const output = getTreeDataOptionPropName(treeDataOptions, 'collapsedPropName');
      expect(output).toBe(Constants.treeDataProperties.COLLAPSED_PROP);
    });

    it('should return default constant hasChildren prop name', () => {
      const output = getTreeDataOptionPropName(treeDataOptions, 'hasChildrenPropName');
      expect(output).toBe(Constants.treeDataProperties.HAS_CHILDREN_PROP);
    });

    it('should return default constant level prop name', () => {
      const output = getTreeDataOptionPropName(treeDataOptions, 'levelPropName');
      expect(output).toBe(Constants.treeDataProperties.TREE_LEVEL_PROP);
    });

    it('should return default constant parent prop name', () => {
      const output = getTreeDataOptionPropName(treeDataOptions, 'parentPropName');
      expect(output).toBe(Constants.treeDataProperties.PARENT_PROP);
    });

    it('should return "id" as default identifier prop name', () => {
      const output = getTreeDataOptionPropName(treeDataOptions, 'identifierPropName');
      expect(output).toBe('id');
    });
  });

  describe('findItemInTreeStructure method', () => {
    let mockColumns: any[] = [];

    beforeEach(() => {
      mockColumns = [
        { id: 18, file: 'something.txt', dateModified: '2015-03-03', size: 90 },
        {
          id: 11,
          file: 'Music',
          files: [
            {
              id: 12,
              file: 'mp3',
              files: [
                { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13', size: 98 }] },
                { id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01', size: 85 }] },
              ],
            },
          ],
        },
      ];

      // add large set of data for testing
      for (let i = 20; i < 300_200; i++) {
        mockColumns[1].files.push({ id: i, file: `file-${i}.txt`, dateModified: '2020-02-01', size: 123 });
      }
    });

    it('should throw an error when the children property name argument is missing', () => {
      expect(() => findItemInTreeStructure(mockColumns, (x) => x.file === 'pop', '')).toThrow(
        'findItemInTreeStructure requires parameter "childrenPropertyName"'
      );
    });

    it('should find an item from a hierarchical array', () => {
      const item = findItemInTreeStructure(mockColumns, (x) => x.file === 'pop', 'files');
      expect(item).toEqual({ id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01', size: 85 }] });
    });

    it('should return undefined when item is not found', () => {
      const item = findItemInTreeStructure(mockColumns, (x) => x.file === 'pop2', 'files');
      expect(item).toEqual(undefined as any);
    });

    it('should return item found in large dataset', () => {
      const item = findItemInTreeStructure(mockColumns, (x) => x.file === 'file-125000.txt', 'files');
      expect(item).toEqual({
        dateModified: '2020-02-01',
        file: 'file-125000.txt',
        id: 125000,
        size: 123,
      });
    });
  });

  describe('findOrDefault method', () => {
    it('should return original input when it is not an array provided', () => {
      const input = 'a';
      const searchValue = '';
      const output = findOrDefault(input as any, (val) => val === searchValue);
      expect(output).toBe(input);
    });

    it('should find an element in the array given a provided logic to find such element', () => {
      const collection = ['a', 'c', 'b', 1];
      const searchValue = 'c';
      const output = findOrDefault(collection, (val) => val === searchValue);
      expect(output).toBe(searchValue);
    });

    it('should find an object in an array of objects given a provided logic to find such element', () => {
      const collection = [
        { id: 1, name: 'a', order: 3 },
        { id: 2, name: 'def', order: 45 },
        { id: 3, name: 'xyz', order: 99 },
      ];
      const searchProperty = 'id';
      const searchId = 2;

      const output = findOrDefault(collection, (item) => {
        if (item && item.hasOwnProperty(searchProperty)) {
          return item[searchProperty] === searchId;
        }
        return false;
      });

      expect(output).toEqual({ id: 2, name: 'def', order: 45 });
    });

    it('should return default value when element is not found in the array', () => {
      const collection = ['a', 'c', 'b', 1];
      const searchValue = 'z';
      const defaultValue = 'a';
      const output = findOrDefault(collection, (val) => val === searchValue, defaultValue);
      expect(output).toBe(defaultValue);
    });
  });

  describe('decimalFormatted method', () => {
    it('should return original input when the argument is not a number', () => {
      const input = 'abc';
      const output = decimalFormatted(input, 2, 2);
      expect(output).toBe(input);
    });

    it('should return a string with a number formatted with 2 decimals when only a number is provided', () => {
      const input = 123;
      const output = decimalFormatted(input);
      expect(output).toBe('123.00');
    });

    it('should return a string with a number formatted with 2 decimals when the number provided is a string', () => {
      const input = '456';
      const output = decimalFormatted(input);
      expect(output).toBe('456.00');
    });

    it('should return a string without any decimals when the minDecimal is set to 0 and the provided is an integer', () => {
      const input = '456';
      const output = decimalFormatted(input, 0);
      expect(output).toBe('456');
    });

    it('should return a string with a number formatted and rounded to 4 decimals when maxDecimal is set to 4 and the number provided has extra decimals', () => {
      const input = 456.4567899;
      const output = decimalFormatted(input, 0, 4);
      expect(output).toBe('456.4568');
    });

    it('should return a string with a number formatted to 2 decimals minDecimal is set to 2 and maxDecimal is set to any number greater than 2', () => {
      const input = 456.4;
      const output = decimalFormatted(input, 2, 4);
      expect(output).toBe('456.40');
    });

    it('should return a string with a negative number formatted to 2 decimals minDecimal is set to 2', () => {
      const input = -456.4;
      const output = decimalFormatted(input, 2, 4);
      expect(output).toBe('-456.40');
    });

    it('should return a string with comma as decimal separator when separator is set and maxDecimal is set and will round the decimal', () => {
      const input = 1234567890.44566;
      const output = decimalFormatted(input, 2, 4, ',');
      expect(output).toBe('1234567890,4457');
    });

    it('should return a string with dot as decimal separator when separator is set and maxDecimal is set and will round the decimal', () => {
      const input = '1234567890.44566';
      const output = decimalFormatted(input, 2, 4, ',');
      expect(output).toBe('1234567890,4457');
    });

    it('should return a string with thousand separator when separator is set and maxDecimal is set and will round the decimal', () => {
      const input = 1234567890.44566;
      const output = decimalFormatted(input, 2, 4, '.', ',');
      expect(output).toBe('1,234,567,890.4457');
    });
  });

  describe('formatNumber method', () => {
    it('should return original value when input provided is not a number', () => {
      const input = 'abc';
      const output = formatNumber(input);
      expect(output).toBe(input);
    });

    it('should return original value when input provided is not a number even if thousand separator is set', () => {
      const input = 'abc';
      const decimalSeparator = ',';
      const thousandSeparator = '_';
      const output = formatNumber(input, undefined, undefined, false, '', '', decimalSeparator, thousandSeparator);
      expect(output).toBe(input);
    });

    it('should return a string with a number formatted to 2 decimals when minDecimal is set to 2', () => {
      const input = 12345678;
      const output = formatNumber(input, 2);
      expect(output).toBe('12345678.00');
    });

    it('should return a string with thousand separator and a number formatted to 2 decimals when minDecimal is set to 2', () => {
      const input = 12345678;
      const decimalSeparator = '.';
      const thousandSeparator = ',';
      const output = formatNumber(input, 2, undefined, false, '', '', decimalSeparator, thousandSeparator);
      expect(output).toBe('12,345,678.00');
    });

    it('should return a string with a number formatted and rounded to 4 decimals when maxDecimal is set to 4 and the number provided has extra decimals', () => {
      const input = 12345678.4567899;
      const output = formatNumber(input, 0, 4);
      expect(output).toBe('12345678.4568');
    });

    it('should return a string with thousand separator and a number formatted and rounded to 4 decimals when maxDecimal is set to 4 and the number provided has extra decimals', () => {
      const input = 12345678.4567899;
      const decimalSeparator = ',';
      const thousandSeparator = ' ';
      const output = formatNumber(input, 0, 4, false, '', '', decimalSeparator, thousandSeparator);
      expect(output).toBe('12 345 678,4568');
    });

    it('should return a string without decimals when these arguments are null or undefined and the input provided is an integer', () => {
      const input = 12345678;
      const output1 = formatNumber(input);
      const output2 = formatNumber(input, null as any, null as any);
      const output3 = formatNumber(input, undefined, undefined);

      expect(output1).toBe('12345678');
      expect(output2).toBe('12345678');
      expect(output3).toBe('12345678');
    });

    it('should return a string without decimals and thousand separator when these arguments are null or undefined and the input provided is an integer', () => {
      const input = 12345678;
      const decimalSeparator = '.';
      const thousandSeparator = ',';
      const output1 = formatNumber(input, null as any, null as any, false, '', '', decimalSeparator, thousandSeparator);
      const output2 = formatNumber(input, undefined, undefined, false, '', '', decimalSeparator, thousandSeparator);

      expect(output1).toBe('12,345,678');
      expect(output2).toBe('12,345,678');
    });

    it('should return a string without decimals but using dot (.) as thousand separator when these arguments are null or undefined and the input provided is an integer', () => {
      const input = 12345678;
      const decimalSeparator = ',';
      const thousandSeparator = '.';
      const output1 = formatNumber(input, null as any, null as any, false, '', '', decimalSeparator, thousandSeparator);
      const output2 = formatNumber(input, undefined, undefined, false, '', '', decimalSeparator, thousandSeparator);

      expect(output1).toBe('12.345.678');
      expect(output2).toBe('12.345.678');
    });

    it('should return a formatted string wrapped in parentheses when the input number is negative and the displayNegativeNumberWithParentheses argument is enabled', () => {
      const input = -123;
      const displayNegativeNumberWithParentheses = true;
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses);
      expect(output).toBe('(123.00)');
    });

    it('should return a formatted string and thousand separator wrapped in parentheses when the input number is negative and the displayNegativeNumberWithParentheses argument is enabled', () => {
      const input = -12345678;
      const displayNegativeNumberWithParentheses = true;
      const decimalSeparator = ',';
      const thousandSeparator = '_';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, '', '', decimalSeparator, thousandSeparator);
      expect(output).toBe('(12_345_678,00)');
    });

    it('should return a formatted currency string when the input number is negative and symbol prefix is provided', () => {
      const input = -123;
      const displayNegativeNumberWithParentheses = false;
      const currencyPrefix = '$';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix);
      expect(output).toBe('-$123.00');
    });

    it('should return a formatted currency string and thousand separator when the input number is negative and symbol prefix is provided', () => {
      const input = -12345678;
      const displayNegativeNumberWithParentheses = false;
      const currencyPrefix = '$';
      const decimalSeparator = '.';
      const thousandSeparator = ',';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix, '', decimalSeparator, thousandSeparator);
      expect(output).toBe('-$12,345,678.00');
    });

    it('should return a formatted currency string and thousand separator using dot (.) and decimal using comma (,) when those are provided', () => {
      const input = -12345678.32;
      const displayNegativeNumberWithParentheses = false;
      const currencyPrefix = '$';
      const decimalSeparator = ',';
      const thousandSeparator = '.';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix, '', decimalSeparator, thousandSeparator);
      expect(output).toBe('-$12.345.678,32');
    });

    it('should return a formatted currency string with symbol prefix/suffix wrapped in parentheses when the input number is negative, when all necessary arguments are filled', () => {
      const input = -1234;
      const displayNegativeNumberWithParentheses = true;
      const currencyPrefix = '$';
      const currencySuffix = ' CAD';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix, currencySuffix);
      expect(output).toBe('($1234.00 CAD)');
    });

    it('should return a formatted currency string with symbol prefix/suffix and thousand separator wrapped in parentheses when the input number is negative, when all necessary arguments are filled', () => {
      const input = -12345678;
      const displayNegativeNumberWithParentheses = true;
      const currencyPrefix = '$';
      const currencySuffix = ' CAD';
      const decimalSeparator = ',';
      const thousandSeparator = ' ';
      const output = formatNumber(input, 2, 2, displayNegativeNumberWithParentheses, currencyPrefix, currencySuffix, decimalSeparator, thousandSeparator);
      expect(output).toBe('($12 345 678,00 CAD)');
    });

    it('should return a formatted currency string with symbol prefix/suffix but without decimals when these arguments are not provided, then wrapped in parentheses when the input number is negative, when all necessary arguments are filled', () => {
      const input = -1234;
      const displayNegativeNumberWithParentheses = true;
      const currencyPrefix = '$';
      const currencySuffix = ' CAD';
      const output = formatNumber(input, null as any, null as any, displayNegativeNumberWithParentheses, currencyPrefix, currencySuffix);
      expect(output).toBe('($1234 CAD)');
    });

    it('should return a formatted currency string with symbol prefix/suffix and thousand separator but without decimals when these arguments are not provided, then wrapped in parentheses when the input number is negative, when all necessary arguments are filled', () => {
      const input = -12345678;
      const displayNegativeNumberWithParentheses = true;
      const currencyPrefix = '$';
      const currencySuffix = ' CAD';
      const decimalSeparator = ',';
      const thousandSeparator = '_';
      const output = formatNumber(
        input,
        null as any,
        null as any,
        displayNegativeNumberWithParentheses,
        currencyPrefix,
        currencySuffix,
        decimalSeparator,
        thousandSeparator
      );
      expect(output).toBe('($12_345_678 CAD)');
    });
  });

  describe('getColumnFieldType() method', () => {
    it('should return field type when type is defined', () => {
      const result = getColumnFieldType({ type: 'dateIso' } as Column);
      expect(result).toEqual('dateIso');
    });

    it('should return outputType when both field type and outputType are defined', () => {
      const result = getColumnFieldType({ outputType: 'number', type: 'dateIso' } as Column);
      expect(result).toEqual('number');
    });

    it('should return string field type when neither type nor outputType are defined', () => {
      const result = getColumnFieldType({ field: 'startDate' } as Column);
      expect(result).toEqual('string');
    });
  });

  describe('getDescendantProperty() method', () => {
    let obj: any = {};
    beforeEach(() => {
      obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', address: { number: 123, street: 'Broadway' } } };
    });

    it('should return original object when no path is provided', () => {
      const output = getDescendantProperty(obj, undefined);
      expect(output).toBe(obj);
    });

    it('should return undefined when search argument is not part of the input object', () => {
      const output = getDescendantProperty(obj, 'users');
      expect(output).toBe(undefined as any);
    });

    it('should return the object descendant even when path given is not a dot notation', () => {
      const output = getDescendantProperty(obj, 'user');
      expect(output).toEqual(obj['user']);
    });

    it('should return the object descendant when using dot notation', () => {
      const output = getDescendantProperty(obj, 'user.firstName');
      expect(output).toEqual('John');
    });

    it('should return the object descendant when using multiple levels of dot notation', () => {
      const output = getDescendantProperty(obj, 'user.address.street');
      expect(output).toEqual('Broadway');
    });
  });

  describe('getTranslationPrefix method', () => {
    it('should return empty Translation Prefix when no Grid Options are provided', () => {
      const output = getTranslationPrefix(null as any);
      expect(output).toBe('');
    });

    it('should return Translation Prefix without separator when only namespace defined in the Grid Options', () => {
      const gridOptions = { translationNamespace: 'App1' } as GridOption;
      const output = getTranslationPrefix(gridOptions);
      expect(output).toBe('App1');
    });

    it('should return Translation Prefix with separator when defined in the Grid Options', () => {
      const gridOptions = { translationNamespace: 'App1', translationNamespaceSeparator: ':' } as GridOption;
      const output = getTranslationPrefix(gridOptions);
      expect(output).toBe('App1:');
    });
  });

  describe('isColumnDateType() method', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return True when "date" is provided', () => {
      const result = isColumnDateType('date');
      expect(result).toBe(true);
    });

    it('should return True when "dateTime" is provided', () => {
      const result = isColumnDateType('dateTime');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeIso" is provided', () => {
      const result = isColumnDateType('dateTimeIso');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeShortIso" is provided', () => {
      const result = isColumnDateType('dateTimeShortIso');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeIsoAmPm" is provided', () => {
      const result = isColumnDateType('dateTimeIsoAmPm');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeIsoAM_PM" is provided', () => {
      const result = isColumnDateType('dateTimeIsoAM_PM');
      expect(result).toBe(true);
    });

    it('should return True when "dateEuro" is provided', () => {
      const result = isColumnDateType('dateEuro');
      expect(result).toBe(true);
    });

    it('should return True when "dateEuroShort" is provided', () => {
      const result = isColumnDateType('dateEuroShort');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeEuro" is provided', () => {
      const result = isColumnDateType('dateTimeEuro');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeShortEuro" is provided', () => {
      const result = isColumnDateType('dateTimeShortEuro');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeEuroAmPm" is provided', () => {
      const result = isColumnDateType('dateTimeEuroAmPm');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeEuroAM_PM" is provided', () => {
      const result = isColumnDateType('dateTimeEuroAM_PM');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeEuroShort" is provided', () => {
      const result = isColumnDateType('dateTimeEuroShort');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeEuroShortAM_PM" is provided', () => {
      const result = isColumnDateType('dateTimeEuroShortAM_PM');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeEuroShortAmPm" is provided', () => {
      const result = isColumnDateType('dateTimeEuroShortAmPm');
      expect(result).toBe(true);
    });

    it('should return True when "dateUs" is provided', () => {
      const result = isColumnDateType('dateUs');
      expect(result).toBe(true);
    });

    it('should return True when "dateUsShort" is provided', () => {
      const result = isColumnDateType('dateUsShort');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeUs" is provided', () => {
      const result = isColumnDateType('dateTimeUs');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeShortUs" is provided', () => {
      const result = isColumnDateType('dateTimeShortUs');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeUsAmPm" is provided', () => {
      const result = isColumnDateType('dateTimeUsAmPm');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeUsShortAM_PM" is provided', () => {
      const result = isColumnDateType('dateTimeUsShortAM_PM');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeUsAM_PM" is provided', () => {
      const result = isColumnDateType('dateTimeUsAM_PM');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeUsShort" is provided', () => {
      const result = isColumnDateType('dateTimeUsShort');
      expect(result).toBe(true);
    });

    it('should return True when "dateTimeUsShortAmPm" is provided', () => {
      const result = isColumnDateType('dateTimeUsShortAmPm');
      expect(result).toBe(true);
    });

    it('should return True when "dateUtc" is provided', () => {
      const result = isColumnDateType('dateUtc');
      expect(result).toBe(true);
    });

    it('should return True when "dateIso" is provided', () => {
      const result = isColumnDateType('dateIso');
      expect(result).toBe(true);
    });
  });

  describe('mapOperatorType method', () => {
    it('should return OperatoryType associated to "<"', () => {
      const expectation = 'LT';

      const output1 = mapOperatorType('<');
      const output2 = mapOperatorType('LT');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "<="', () => {
      const expectation = 'LE';

      const output1 = mapOperatorType('<=');
      const output2 = mapOperatorType('LE');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to ">"', () => {
      const expectation = 'GT';

      const output1 = mapOperatorType('>');
      const output2 = mapOperatorType('GT');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to ">="', () => {
      const expectation = 'GE';

      const output1 = mapOperatorType('>=');
      const output2 = mapOperatorType('GE');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "!=", "neq" or "NEQ"', () => {
      const expectation = 'NE';

      const output1 = mapOperatorType('!=');
      const output2 = mapOperatorType('NE');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "*", "a*", ".*", "startsWith"', () => {
      const expectation = 'StartsWith';

      const output1 = mapOperatorType('*');
      const output2 = mapOperatorType('a*');
      const output3 = mapOperatorType('StartsWith');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });

    it('should return OperatoryType associated to "*.", "*z", "endsWith"', () => {
      const expectation = 'EndsWith';

      const output1 = mapOperatorType('*z');
      const output2 = mapOperatorType('EndsWith');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "=", "==", "eq" or "EQ"', () => {
      const expectation = 'EQ';

      const output1 = mapOperatorType('=');
      const output2 = mapOperatorType('==');
      const output3 = mapOperatorType('EQ');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });

    it('should return OperatoryType associated to "in", "IN"', () => {
      const expectation = 'IN';

      const output1 = mapOperatorType('IN');

      expect(output1).toBe(expectation);
    });

    it('should return OperatoryType associated to "notIn", "NIN", "NOT_IN"', () => {
      const expectation = 'NOT_IN';

      const output1 = mapOperatorType('NIN');
      const output2 = mapOperatorType('NOT_IN');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return OperatoryType associated to "not_contains", "Not_Contains", "notContains"', () => {
      const expectation = 'Not_Contains';

      const output1 = mapOperatorType('<>');
      const output2 = mapOperatorType('Not_Contains');
      const output3 = mapOperatorType('NOT_CONTAINS');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });

    it('should return default OperatoryType associated to contains', () => {
      const expectation = 'Contains';

      const output1 = mapOperatorType('');
      const output2 = mapOperatorType('Contains');
      const output3 = mapOperatorType('CONTAINS');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });
  });

  describe('mapOperatorToShorthandDesignation method', () => {
    it('should return Operator shorthand of ">"', () => {
      const expectation = '>';
      const output1 = mapOperatorToShorthandDesignation('GT');
      const output2 = mapOperatorToShorthandDesignation('>');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of ">="', () => {
      const expectation = '>=';
      const output1 = mapOperatorToShorthandDesignation('GE');
      const output2 = mapOperatorToShorthandDesignation('>=');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of "<"', () => {
      const expectation = '<';
      const output1 = mapOperatorToShorthandDesignation('LT');
      const output2 = mapOperatorToShorthandDesignation('<');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of "<="', () => {
      const expectation = '<=';
      const output1 = mapOperatorToShorthandDesignation('LE');
      const output2 = mapOperatorToShorthandDesignation('<=');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of "<>"', () => {
      const expectation = '<>';
      const output1 = mapOperatorToShorthandDesignation('NE');
      const output2 = mapOperatorToShorthandDesignation('<>');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
    });

    it('should return Operator shorthand of "="', () => {
      const expectation = '=';
      const output1 = mapOperatorToShorthandDesignation('EQ');
      const output2 = mapOperatorToShorthandDesignation('=');
      const output3 = mapOperatorToShorthandDesignation('==');
      const output4 = mapOperatorToShorthandDesignation('EQ');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
      expect(output4).toBe(expectation);
    });

    it('should return Operator shorthand of "a*" to represent starts with', () => {
      const expectation = 'a*';
      const output1 = mapOperatorToShorthandDesignation('StartsWith');
      const output2 = mapOperatorToShorthandDesignation('a*');
      const output3 = mapOperatorToShorthandDesignation('*');
      const output4 = mapOperatorToShorthandDesignation('StartsWith');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
      expect(output4).toBe(expectation);
    });

    it('should return Operator shorthand of "*z" to represent ends with', () => {
      const expectation = '*z';
      const output1 = mapOperatorToShorthandDesignation('EndsWith');
      const output2 = mapOperatorToShorthandDesignation('*z');
      const output3 = mapOperatorToShorthandDesignation('EndsWith');

      expect(output1).toBe(expectation);
      expect(output2).toBe(expectation);
      expect(output3).toBe(expectation);
    });

    it('should return same input Operator when no shorthand is found', () => {
      const output1 = mapOperatorToShorthandDesignation('IN');
      const output2 = mapOperatorToShorthandDesignation('Contains');
      const output3 = mapOperatorToShorthandDesignation('Not_Contains');
      const output4 = mapOperatorToShorthandDesignation('RangeExclusive');
      const output5 = mapOperatorToShorthandDesignation('RangeInclusive');

      expect(output1).toBe('IN');
      expect(output2).toBe('Contains');
      expect(output3).toBe('Not_Contains');
      expect(output4).toBe('RangeExclusive');
      expect(output5).toBe('RangeInclusive');
    });
  });

  describe('mapOperatorByFieldType method', () => {
    it('should return default OperatoryType associated to contains', () => {
      const output1 = mapOperatorByFieldType('string');
      const output2 = mapOperatorByFieldType('unknown');

      expect(output1).toBe('Contains');
      expect(output2).toBe('Contains');
    });

    it('should return default OperatoryType associated to equal', () => {
      const output2 = mapOperatorByFieldType('float');
      const output3 = mapOperatorByFieldType('number');
      const output4 = mapOperatorByFieldType('date');
      const output5 = mapOperatorByFieldType('dateIso');
      const output6 = mapOperatorByFieldType('date');
      const output7 = mapOperatorByFieldType('dateUtc');
      const output8 = mapOperatorByFieldType('dateTime');
      const output9 = mapOperatorByFieldType('dateTimeIso');
      const output10 = mapOperatorByFieldType('dateTimeIsoAmPm');
      const output11 = mapOperatorByFieldType('dateTimeIsoAM_PM');
      const output12 = mapOperatorByFieldType('dateEuro');
      const output13 = mapOperatorByFieldType('dateEuroShort');
      const output14 = mapOperatorByFieldType('dateTimeEuro');
      const output15 = mapOperatorByFieldType('dateTimeEuroAmPm');
      const output16 = mapOperatorByFieldType('dateTimeEuroAM_PM');
      const output17 = mapOperatorByFieldType('dateTimeEuroShort');
      const output18 = mapOperatorByFieldType('dateTimeEuroShortAmPm');
      const output19 = mapOperatorByFieldType('dateTimeEuroShortAM_PM');
      const output20 = mapOperatorByFieldType('dateUs');
      const output21 = mapOperatorByFieldType('dateUsShort');
      const output22 = mapOperatorByFieldType('dateTimeUs');
      const output23 = mapOperatorByFieldType('dateTimeUsAmPm');
      const output24 = mapOperatorByFieldType('dateTimeUsAM_PM');
      const output25 = mapOperatorByFieldType('dateTimeUsShort');
      const output26 = mapOperatorByFieldType('dateTimeUsShortAmPm');
      const output27 = mapOperatorByFieldType('dateTimeUsShortAM_PM');

      expect(output2).toBe('EQ');
      expect(output3).toBe('EQ');
      expect(output4).toBe('EQ');
      expect(output5).toBe('EQ');
      expect(output6).toBe('EQ');
      expect(output7).toBe('EQ');
      expect(output8).toBe('EQ');
      expect(output9).toBe('EQ');
      expect(output10).toBe('EQ');
      expect(output11).toBe('EQ');
      expect(output12).toBe('EQ');
      expect(output13).toBe('EQ');
      expect(output14).toBe('EQ');
      expect(output15).toBe('EQ');
      expect(output16).toBe('EQ');
      expect(output17).toBe('EQ');
      expect(output18).toBe('EQ');
      expect(output19).toBe('EQ');
      expect(output20).toBe('EQ');
      expect(output21).toBe('EQ');
      expect(output22).toBe('EQ');
      expect(output23).toBe('EQ');
      expect(output24).toBe('EQ');
      expect(output25).toBe('EQ');
      expect(output26).toBe('EQ');
      expect(output27).toBe('EQ');
    });

    it('should return default OperatoryType associated to contains', () => {
      const output = mapOperatorByFieldType('' as any);
      expect(output).toBe('EQ');
    });
  });

  describe('fetchAsPromise method', () => {
    it('should return a Promise with an array when the input is an array', async () => {
      const mockCollection = [
        { value: 'other', description: 'other' },
        { value: 'male', description: 'male' },
        { value: 'female', description: 'female' },
      ];

      const output = fetchAsPromise(mockCollection);

      expect(output instanceof Promise).toBeTruthy();
      expect(await output).toEqual(mockCollection);
    });

    it('should return a Promise with an array when the input is also a Promise with an array', async () => {
      const mockCollection = [
        { value: 'other', description: 'other' },
        { value: 'male', description: 'male' },
        { value: 'female', description: 'female' },
      ];
      const promise = Promise.resolve(mockCollection);

      const output = fetchAsPromise(promise);

      expect(output instanceof Promise).toBeTruthy();
      expect(await output).toEqual(mockCollection);
    });

    it('should be able to load async collection from /a Promise with content to simulate http-client', async () => {
      const mockCollection = ['male', 'female'];
      const promise = Promise.resolve({ content: mockCollection });

      const output = fetchAsPromise(promise);

      expect(output instanceof Promise).toBeTruthy();
      expect(await output).toEqual(mockCollection);
    });

    it('should be able to load async collection from a Fetch Promise', async () => {
      const mockCollection = ['male', 'female'];
      const collectionAsync = basicFetchStub('http://locahost/api', { method: 'GET' }, mockCollection);

      const output = fetchAsPromise(collectionAsync);

      expect(output instanceof Promise).toBeTruthy();
      expect(await output).toEqual(mockCollection);
    });

    it('should be able to load collection from an Observable', async () => {
      const mockCollection = ['male', 'female'];
      const rxjsMock = new RxJsResourceStub();

      const output = fetchAsPromise(of(mockCollection), rxjsMock);

      expect(output instanceof Promise).toBeTruthy();
      expect(await output).toEqual(mockCollection);
    });

    it('should throw an error when Fetch Promise response bodyUsed is true', async () => {
      const consoleSpy = vi.spyOn(global.console, 'warn').mockReturnValue();
      const mockCollection = ['male', 'female'];
      const collectionAsync = basicFetchStub('http://invalid-url', { method: 'GET' }, mockCollection);

      await fetchAsPromise(collectionAsync);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SlickGrid-Universal] The response body passed to Fetch was already read.'));
    });

    it('should return a Promise with null when the collection input is not an array', async () => {
      const input = {};
      const output = await fetchAsPromise(input as any);

      expect(output).toBeNull();
    });

    it('should return a Promise with null when the collection input is a Promise that is not an array', async () => {
      const collectionObj = {
        deep: {
          myCollection: [
            { value: 'other', description: 'other' },
            { value: 'male', description: 'male' },
            { value: 'female', description: 'female' },
          ],
        },
      };
      const promise = Promise.resolve(collectionObj);
      const output = await fetchAsPromise(promise as any);

      expect(output).toEqual(collectionObj);
    });
  });

  describe('sortPresetColumns() method', () => {
    it('should sort preset columns', () => {
      const allColumns: Column[] = [
        { id: 'firstName', field: 'firstName', name: 'First Name', minWidth: 110, width: 300, hidden: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name', width: 620 },
        { id: 'age', field: 'age', name: 'age', width: 192, resizable: false },
      ];

      const results = sortPresetColumns(allColumns, [
        { id: 'firstName', field: 'firstName' },
        { id: 'lastName', field: 'lastName' },
      ]);

      expect(results).toEqual([
        { field: 'firstName', hidden: false, id: 'firstName', minWidth: 110, name: 'First Name', width: 300 },
        { field: 'lastName', hidden: false, id: 'lastName', name: 'Last Name', width: 620 },
        { field: 'age', hidden: true, id: 'age', name: 'age', resizable: false, width: 192 },
      ]);
    });
  });

  describe('thousandSeparatorFormatted() method', () => {
    it('should return original value when input provided is null', () => {
      const input = null as any;
      const output = thousandSeparatorFormatted(input, ',');
      expect(output).toBe(input);
    });

    it('should return original value when input provided is undefined', () => {
      const input = undefined as any;
      const output = thousandSeparatorFormatted(input, ',');
      expect(output).toBe(input);
    });

    it('should return original value when input provided is not a number', () => {
      const input = 'abc';
      const output = thousandSeparatorFormatted(input, ',');
      expect(output).toBe(input);
    });

    it('should return a string with a number formatted with every thousand separated with a comma when separator is not defined', () => {
      const input = 12345678;
      const output = thousandSeparatorFormatted(input);
      expect(output).toBe('12,345,678');
    });

    it('should return a string with a number formatted with every thousand separated with a custom space defined as separator', () => {
      const input = 12345678;
      const output = thousandSeparatorFormatted(input, ' ');
      expect(output).toBe('12 345 678');
    });

    it('should return a string with a number formatted with every thousand separated with a custom underscore defined as separator', () => {
      const input = 12345678;
      const output = thousandSeparatorFormatted(input, '_');
      expect(output).toBe('12_345_678');
    });
  });

  describe('unsubscribeAll method', () => {
    it('should return original array when array of subscriptions is empty', () => {
      const output = unsubscribeAll([]);
      expect(output).toEqual([]);
    });

    it('should be able to unsubscribe all Observables', () => {
      const subscriptions: EventSubscription[] = [];
      const observable1 = of([1, 2]);
      const observable2 = of([1, 2]);
      subscriptions.push(observable1.subscribe(), observable2.subscribe());
      const output = unsubscribeAll(subscriptions);
      expect(output).toHaveLength(0);
    });

    it('should be able to unsubscribe all PubSub events or anything that has an unsubscribe method', () => {
      const mockUnsubscribe1 = vi.fn();
      const mockUnsubscribe2 = vi.fn();
      const mockSubscription1 = { unsubscribe: mockUnsubscribe1 };
      const mockSubscription2 = { unsubscribe: mockUnsubscribe2 };
      const mockSubscriptions = [mockSubscription1, mockSubscription2];

      unsubscribeAll(mockSubscriptions);

      expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    });
  });
});
