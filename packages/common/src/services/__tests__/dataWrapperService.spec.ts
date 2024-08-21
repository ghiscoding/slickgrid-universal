import type { SlickDataView, SlickGrid } from '../../core';
import { DataWrapperService } from '../dataWrapperService';

const gridStub = {
  destroy: jest.fn(),
  getData: jest.fn(),
  getDataItem: jest.fn(),
  getDataItems: jest.fn(),
  getDataLength: jest.fn(),
  hasDataView: jest.fn(),
  setData: jest.fn(),
  setDataItems: jest.fn(),
} as unknown as SlickGrid;

const dataViewStub = {
  destroy: jest.fn(),
  getItem: jest.fn(),
  getItems: jest.fn(),
  getItemCount: jest.fn(),
  setItems: jest.fn(),
} as unknown as SlickDataView;

describe('DataWrapper Service', () => {
  let service: DataWrapperService;

  beforeEach(() => {
    service = new DataWrapperService();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('SlickGrid', () => {
    beforeEach(() => {
      service.init(gridStub);
      jest.spyOn(gridStub, 'hasDataView').mockReturnValueOnce(false);
    });

    it('should create and dispose the service', () => {
      service.dispose();

      expect(service).toBeTruthy();
      expect(gridStub.destroy).toHaveBeenCalled();
    });

    it('should call getDataItem() method and expect item to be returned via SlickGrid.getDataItem()', () => {
      const itemMock = { id: 1, firstName: 'John', lastName: 'Doe' };
      const getDataItemSpy = jest.spyOn(gridStub, 'getDataItem').mockReturnValueOnce(itemMock);

      const result = service.getDataItem(1);

      expect(result).toEqual(itemMock);
      expect(getDataItemSpy).toHaveBeenCalled();
    });

    it('should call getDataItems() method and expect items to be returned via SlickGrid.getData()', () => {
      const itemsMock = [{ id: 1, firstName: 'John', lastName: 'Doe' }, { id: 2, firstName: 'Jane', lastName: 'Smith' }];
      const getDataItemsSpy = jest.spyOn(gridStub, 'getData').mockReturnValueOnce(itemsMock);

      const result = service.getDataItems();

      expect(result).toEqual(itemsMock);
      expect(getDataItemsSpy).toHaveBeenCalled();
    });

    it('should call getDataLength() method and expect items length returned via SlickGrid.getItemCount()', () => {
      const itemsMock = [{ id: 1, firstName: 'John', lastName: 'Doe' }, { id: 2, firstName: 'Jane', lastName: 'Smith' }];
      const getDataLengthSpy = jest.spyOn(gridStub, 'getDataLength').mockReturnValueOnce(itemsMock.length);

      const result = service.getDataLength();

      expect(result).toBe(itemsMock.length);
      expect(getDataLengthSpy).toHaveBeenCalled();
    });

    it('should call setDataItems() method and expect items to be set via SlickGrid.setData()', () => {
      const itemsMock = [{ id: 1, firstName: 'John', lastName: 'Doe' }, { id: 2, firstName: 'Jane', lastName: 'Smith' }];
      const setDataItemsSpy = jest.spyOn(gridStub, 'setData');

      service.setDataItems(itemsMock);

      expect(setDataItemsSpy).toHaveBeenCalled();
    });
  });

  describe('SlickDataView', () => {
    beforeEach(() => {
      jest.spyOn(gridStub, 'hasDataView').mockReturnValueOnce(true);
      jest.spyOn(gridStub, 'getData').mockReturnValueOnce(dataViewStub as any);
      service.init(gridStub);
    });

    it('should create and dispose the service', () => {
      service.init(gridStub);
      service.dispose();

      expect(service).toBeTruthy();
      expect(dataViewStub.destroy).toHaveBeenCalled();
    });

    it('should call getDataItem() method and expect item to be returned via DataView.getItem()', () => {
      const itemMock = { id: 1, firstName: 'John', lastName: 'Doe' };
      const getDataItemSpy = jest.spyOn(dataViewStub, 'getItem').mockReturnValueOnce(itemMock);

      const result = service.getDataItem(1);

      expect(result).toEqual(itemMock);
      expect(getDataItemSpy).toHaveBeenCalled();
    });

    it('should call getDataItems() method and expect items to be returned via DataView.getItems()', () => {
      const itemsMock = [{ id: 1, firstName: 'John', lastName: 'Doe' }, { id: 2, firstName: 'Jane', lastName: 'Smith' }];
      const getDataItemsSpy = jest.spyOn(dataViewStub, 'getItems').mockReturnValueOnce(itemsMock);

      const result = service.getDataItems();

      expect(result).toEqual(itemsMock);
      expect(getDataItemsSpy).toHaveBeenCalled();
    });

    it('should call getDataLength() method and expect items length returned via DataView.getItemCount()', () => {
      const itemsMock = [{ id: 1, firstName: 'John', lastName: 'Doe' }, { id: 2, firstName: 'Jane', lastName: 'Smith' }];
      const getItemCountSpy = jest.spyOn(dataViewStub, 'getItemCount').mockReturnValueOnce(itemsMock.length);

      const result = service.getDataLength();

      expect(result).toBe(itemsMock.length);
      expect(getItemCountSpy).toHaveBeenCalled();
    });

    it('should call setDataItems() method and expect items to be set via DataView.setItems()', () => {
      const itemsMock = [{ id: 1, firstName: 'John', lastName: 'Doe' }, { id: 2, firstName: 'Jane', lastName: 'Smith' }];
      const setItemsSpy = jest.spyOn(dataViewStub, 'setItems');

      service.setDataItems(itemsMock);

      expect(setItemsSpy).toHaveBeenCalled();
    });
  });
});