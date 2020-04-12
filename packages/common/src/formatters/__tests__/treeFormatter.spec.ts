import { Column, GridOption } from '../../interfaces/index';
import { treeFormatter } from '../treeFormatter';

const dataViewStub = {
  getIdxById: jest.fn(),
  getItemByIdx: jest.fn(),
  getIdPropertyName: jest.fn(),
};

const gridStub = {
  getData: jest.fn(),
  getOptions: jest.fn(),
};

describe('the Uppercase Formatter', () => {
  let dataset;
  let mockGridOptions: GridOption;

  beforeEach(() => {
    dataset = [
      { id: 0, firstName: 'John', lastName: 'Smith', email: 'john.smith@movie.com', parentId: null, indent: 0 },
      { id: 1, firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@movie.com', parentId: 0, indent: 1 },
      { id: 2, firstName: 'Bob', lastName: 'Cane', email: 'bob.cane@movie.com', parentId: 1, indent: 2, __collapsed: true },
      { id: 2, firstName: 'Barbara', lastName: 'Cane', email: 'barbara.cane@movie.com', parentId: null, indent: 0, __collapsed: true },
    ];
    mockGridOptions = {
      treeDataOptions: { levelPropName: 'indent' }
    } as GridOption;
    jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
  });

  it('should throw an error when oarams are mmissing', () => {
    expect(() => treeFormatter(1, 1, 'blah', {} as Column, {}, gridStub))
      .toThrowError('You must provide valid "treeDataOptions" in your Grid Options and it seems that there are no tree level found in this row');
  });

  it('should return empty string when DataView is not correctly formed', () => {
    const output = treeFormatter(1, 1, '', {} as Column, dataset[1], gridStub);
    expect(output).toBe('');
  });

  it('should return empty string when value is null', () => {
    const output = treeFormatter(1, 1, null, {} as Column, dataset[1], gridStub);
    expect(output).toBe('');
  });

  it('should return empty string when value is undefined', () => {
    const output = treeFormatter(1, 1, undefined, {} as Column, dataset[1], gridStub);
    expect(output).toBe('');
  });

  it('should return empty string when item is undefined', () => {
    const output = treeFormatter(1, 1, 'blah', {} as Column, undefined, gridStub);
    expect(output).toBe('');
  });

  it('should return a span without any icon and ', () => {
    jest.spyOn(gridStub, 'getData').mockReturnValue(dataViewStub);
    jest.spyOn(dataViewStub, 'getIdxById').mockReturnValue(1);
    jest.spyOn(dataViewStub, 'getItemByIdx').mockReturnValue(dataset[0]);

    const output = treeFormatter(1, 1, dataset[0]['firstName'], {} as Column, dataset[0], gridStub);
    expect(output).toBe(`<span style="display:inline-block; width:0px;"></span><span class="slick-group-toggle"></span>&nbsp;John`);
  });

  it('should return a span without any icon and 15px indentation of a tree level 1', () => {
    jest.spyOn(gridStub, 'getData').mockReturnValue(dataViewStub);
    jest.spyOn(dataViewStub, 'getIdxById').mockReturnValue(1);
    jest.spyOn(dataViewStub, 'getItemByIdx').mockReturnValue(dataset[1]);

    const output = treeFormatter(1, 1, dataset[1]['firstName'], {} as Column, dataset[1], gridStub);
    expect(output).toBe(`<span style="display:inline-block; width:15px;"></span><span class="slick-group-toggle"></span>&nbsp;Jane`);
  });

  it('should return a span without any icon and 30px indentation of a tree level 2', () => {
    jest.spyOn(gridStub, 'getData').mockReturnValue(dataViewStub);
    jest.spyOn(dataViewStub, 'getIdxById').mockReturnValue(1);
    jest.spyOn(dataViewStub, 'getItemByIdx').mockReturnValue(dataset[1]);

    const output = treeFormatter(1, 1, dataset[2]['firstName'], {} as Column, dataset[2], gridStub);
    expect(output).toBe(`<span style="display:inline-block; width:30px;"></span><span class="slick-group-toggle"></span>&nbsp;Bob`);
  });

  it('should return a span with expanded icon and 15px indentation of a tree level 1 when current item is greater than next item', () => {
    jest.spyOn(gridStub, 'getData').mockReturnValue(dataViewStub);
    jest.spyOn(dataViewStub, 'getIdxById').mockReturnValue(1);
    jest.spyOn(dataViewStub, 'getItemByIdx').mockReturnValue(dataset[2]);

    const output = treeFormatter(1, 1, dataset[1]['firstName'], {} as Column, dataset[1], gridStub);
    expect(output).toBe(`<span style="display:inline-block; width:15px;"></span><span class="slick-group-toggle expanded"></span>&nbsp;Jane`);
  });

  it('should return a span with collapsed icon and 0px indentation of a tree level 0 when current item is lower than next item', () => {
    jest.spyOn(gridStub, 'getData').mockReturnValue(dataViewStub);
    jest.spyOn(dataViewStub, 'getIdxById').mockReturnValue(1);
    jest.spyOn(dataViewStub, 'getItemByIdx').mockReturnValue(dataset[1]);

    const output = treeFormatter(1, 1, dataset[3]['firstName'], {} as Column, dataset[3], gridStub);
    expect(output).toBe(`<span style="display:inline-block; width:0px;"></span><span class="slick-group-toggle collapsed"></span>&nbsp;Barbara`);
  });
});
