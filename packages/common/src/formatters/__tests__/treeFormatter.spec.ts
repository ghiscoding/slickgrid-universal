import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getHtmlStringOutput } from '@slickgrid-universal/utils';

import type { Column, FormatterResultWithHtml, GridOption } from '../../interfaces/index.js';
import { treeFormatter } from '../treeFormatter.js';
import * as utils from '../../core/utils.js';

describe('Tree Formatter', () => {
  let dataset;

  beforeEach(() => {
    dataset = [
      {
        id: 0,
        firstName: 'John',
        lastName: 'Smith',
        fullName: 'John Smith',
        email: 'john.smith@movie.com',
        address: { zip: 123456 },
        parentId: null,
        indent: 0,
        __collapsed: false,
        __hasChildren: true,
      },
      {
        id: 1,
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
        email: 'jane.doe@movie.com',
        address: { zip: 222222 },
        parentId: 0,
        indent: 1,
        __collapsed: false,
        __hasChildren: true,
      },
      {
        id: 2,
        firstName: 'Bob',
        lastName: 'Cane',
        fullName: 'Bob Cane',
        email: 'bob.cane@movie.com',
        address: { zip: 333333 },
        parentId: 1,
        indent: 2,
        __collapsed: true,
        __hasChildren: true,
      },
      {
        id: 3,
        firstName: 'Barbara',
        lastName: 'Cane',
        fullName: 'Barbara Cane',
        email: 'barbara.cane@movie.com',
        address: { zip: 444444 },
        parentId: null,
        indent: 0,
        __hasChildren: false,
      },
      {
        id: 4,
        firstName: 'Anonymous',
        lastName: 'Doe',
        fullName: 'Anonymous < Doe',
        email: 'anonymous.doe@anom.com',
        address: { zip: 556666 },
        parentId: null,
        indent: 0,
        __collapsed: true,
        __hasChildren: true,
      },
      {
        id: 5,
        firstName: 'Sponge',
        lastName: 'Bob',
        fullName: 'Sponge Bob',
        email: 'sponge.bob@cartoon.com',
        address: { zip: 888888 },
        parentId: 2,
        indent: 3,
        __hasChildren: false,
      },
      {
        id: 6,
        firstName: 'Bobby',
        lastName: 'Blown',
        fullName: 'Bobby Blown',
        email: 'bobby.blown@dynamite.com',
        address: { zip: 998877 },
        parentId: 4,
        indent: 1,
        __hasChildren: false,
      },
    ];
    vi.spyOn(utils, 'applyHtmlToElement').mockImplementation((elm, val) => {
      elm.innerHTML = `${val || ''}`;
    });
  });

  it('should throw an error when params are mmissing', () => {
    expect(() => treeFormatter(1, 1, 'blah', {} as Column, {}, { treeDataOptions: { levelPropName: 'indent' } } as GridOption)).toThrow(
      '[Slickgrid-Universal] You must provide valid "treeDataOptions" in your Grid Options, however it seems that we could not find any tree level info on the current item datacontext row.'
    );
  });

  it('should return empty string when value is null', () => {
    const output = treeFormatter(1, 1, null, {} as Column, dataset[1], { treeDataOptions: { levelPropName: 'indent' } } as GridOption);
    expect(output).toBe('');
  });

  it('should return empty string when value is undefined', () => {
    const output = treeFormatter(1, 1, undefined, {} as Column, dataset[1], { treeDataOptions: { levelPropName: 'indent' } } as GridOption);
    expect(output).toBe('');
  });

  it('should return empty string when item is undefined', () => {
    const output = treeFormatter(1, 1, 'blah', {} as Column, undefined, { treeDataOptions: { levelPropName: 'indent' } } as GridOption);
    expect(output).toBe('');
  });

  it('should return a span without any toggle icon when item is not a parent item', () => {
    const output = treeFormatter(1, 1, dataset[3]['firstName'], {} as Column, dataset[3], {
      treeDataOptions: { levelPropName: 'indent' },
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-0');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 0px;"></span><div class="slick-group-toggle" aria-expanded="false"></div><span class="slick-tree-title" level="0">Barbara</span>`
    );
  });

  it('should return the Tree content wrapped inside a span HTML element when "allowDocumentFragmentUsage" grid option is disabled', () => {
    const output = treeFormatter(1, 1, dataset[3]['firstName'], {} as Column, dataset[3], {
      treeDataOptions: { levelPropName: 'indent' },
      preventDocumentFragmentUsage: true,
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-0');
    expect((output.html as HTMLElement).outerHTML).toEqual(
      `<span><span style="display: inline-block; width: 0px;"></span><div class="slick-group-toggle" aria-expanded="false"></div><span class="slick-tree-title" level="0">Barbara</span></span>`
    );
  });

  it('should return a span without any toggle icon and have a 15px indentation with tree level 3', () => {
    const output = treeFormatter(1, 1, dataset[6]['firstName'], {} as Column, dataset[6], {
      treeDataOptions: { levelPropName: 'indent' },
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-1');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 15px;"></span><div class="slick-group-toggle" aria-expanded="false"></div><span class="slick-tree-title" level="1">Bobby</span>`
    );
  });

  it('should return a span without any toggle icon and have a 45px indentation of a tree level 3', () => {
    const output = treeFormatter(1, 1, dataset[5]['firstName'], {} as Column, dataset[5], {
      treeDataOptions: { levelPropName: 'indent' },
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-3');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 45px;"></span><div class="slick-group-toggle" aria-expanded="false"></div><span class="slick-tree-title" level="3">Sponge</span>`
    );
  });

  it('should return a span with expanded icon and 15px indentation when item is a parent and is not collapsed', () => {
    const output = treeFormatter(1, 1, dataset[1]['firstName'], {} as Column, dataset[1], {
      treeDataOptions: { levelPropName: 'indent' },
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-1');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 15px;"></span><div class="slick-group-toggle expanded" aria-expanded="true"></div><span class="slick-tree-title" level="1">Jane</span>`
    );
  });

  it('should return a span with collapsed icon and 0px indentation of a tree level 0 when item is a parent and is collapsed', () => {
    const output = treeFormatter(1, 1, dataset[4]['firstName'], {} as Column, dataset[4], {
      treeDataOptions: { levelPropName: 'indent' },
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-0');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 0px;"></span><div class="slick-group-toggle collapsed" aria-expanded="false"></div><span class="slick-tree-title" level="0">Anonymous</span>`
    );
  });

  it('should return a span with expanded icon and 15px indentation of a tree level 1 with a value prefix when provided', () => {
    const gridOptions: GridOption = {
      treeDataOptions: {
        columnId: 'firstName',
        levelPropName: 'indent',
        titleFormatter: (_row, _cell, value, _def, dataContext) => {
          if (dataContext.indent > 0) {
            return `<span class="mdi mdi-subdirectory-arrow-right"></span>${value}`;
          }
          return value || '';
        },
      },
    };

    const output = treeFormatter(
      1,
      1,
      { ...dataset[1]['firstName'], indent: 1 },
      { field: 'firstName' } as Column,
      dataset[1],
      gridOptions
    ) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-1');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 15px;"></span><div class="slick-group-toggle expanded" aria-expanded="true"></div><span class="slick-tree-title" level="1"><span class="mdi mdi-subdirectory-arrow-right"></span>Jane</span>`
    );
  });

  it('should execute "queryFieldNameGetterFn" callback to get field name to use when it is defined', () => {
    const mockColumn = { id: 'firstName', field: 'firstName', queryFieldNameGetterFn: () => 'fullName' } as Column;
    const output = treeFormatter(1, 1, null, mockColumn as Column, dataset[3], {
      treeDataOptions: { levelPropName: 'indent' },
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-0');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 0px;"></span><div class="slick-group-toggle" aria-expanded="false"></div><span class="slick-tree-title" level="0">Barbara Cane</span>`
    );
  });

  it('should execute "queryFieldNameGetterFn" callback to get field name and also apply html encoding when output value includes a character that should be encoded', () => {
    const mockColumn = { id: 'firstName', field: 'firstName', queryFieldNameGetterFn: () => 'fullName' } as Column;
    const output = treeFormatter(1, 1, null, mockColumn as Column, dataset[4], {
      treeDataOptions: { levelPropName: 'indent' },
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-0');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 0px;"></span><div class="slick-group-toggle collapsed" aria-expanded="false"></div><span class="slick-tree-title" level="0">Anonymous &lt; Doe</span>`
    );
  });

  it('should execute "queryFieldNameGetterFn" callback to get field name, which has (.) dot notation reprensenting complex object', () => {
    const mockColumn = { id: 'zip', field: 'zip', queryFieldNameGetterFn: () => 'address.zip' } as Column;
    const output = treeFormatter(1, 1, null, mockColumn as Column, dataset[3], {
      treeDataOptions: { levelPropName: 'indent' },
    } as GridOption) as FormatterResultWithHtml;

    expect(output.addClasses).toBe('slick-tree-level-0');
    expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
      `<span style="display: inline-block; width: 0px;"></span><div class="slick-group-toggle" aria-expanded="false"></div><span class="slick-tree-title" level="0">444444</span>`
    );
  });

  describe('lazy loading', () => {
    beforeEach(() => {
      dataset = [
        {
          id: 0,
          firstName: 'John',
          lastName: 'Smith',
          fullName: 'John Smith',
          email: 'john.smith@movie.com',
          address: { zip: 123456 },
          parentId: null,
          indent: 0,
          __collapsed: false,
          __hasChildren: true,
          __lazyLoading: 'load-fail',
        },
        {
          id: 1,
          firstName: 'Jane',
          lastName: 'Doe',
          fullName: 'Jane Doe',
          email: 'jane.doe@movie.com',
          address: { zip: 222222 },
          parentId: 0,
          indent: 1,
          __collapsed: false,
          __hasChildren: true,
          __lazyLoading: 'done',
        },
        {
          id: 2,
          firstName: 'Bob',
          lastName: 'Cane',
          fullName: 'Bob Cane',
          email: 'bob.cane@movie.com',
          address: { zip: 333333 },
          parentId: 1,
          indent: 2,
          __collapsed: true,
          __hasChildren: true,
        },
      ];
    });
    it('should return a span with collapsed icon and class name of "slick-tree-load-fail" when lazy loading failed', () => {
      const output = treeFormatter(0, 1, dataset[0]['firstName'], {} as Column, dataset[0], {
        treeDataOptions: { levelPropName: 'indent' },
      } as GridOption) as FormatterResultWithHtml;

      expect(output.addClasses).toBe('slick-tree-level-0');
      expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
        `<span style="display: inline-block; width: 0px;"></span><div class="slick-group-toggle load-fail" aria-expanded="false"></div><span class="slick-tree-load-fail"></span><span class="slick-tree-title" level="0">John</span>`
      );
    });

    it('should return a span with expanded icon and 15px indentation when item is a parent and lazy loading resolved successfully', () => {
      const output = treeFormatter(1, 1, dataset[1]['firstName'], {} as Column, dataset[1], {
        treeDataOptions: { levelPropName: 'indent' },
      } as GridOption) as FormatterResultWithHtml;

      expect(output.addClasses).toBe('slick-tree-level-1');
      expect(getHtmlStringOutput(output.html as DocumentFragment, 'outerHTML')).toEqual(
        `<span style="display: inline-block; width: 15px;"></span><div class="slick-group-toggle expanded" aria-expanded="true"></div><span class="slick-tree-title" level="1">Jane</span>`
      );
    });
  });
});
