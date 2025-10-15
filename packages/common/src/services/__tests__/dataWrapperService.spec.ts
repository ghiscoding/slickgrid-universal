import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SlickDataView } from '../../core/slickDataview.js';
import type { SlickGrid } from '../../core/slickGrid.js';
import { DataWrapperService } from '../dataWrapperService.js';

const gridStub = {
  destroy: vi.fn(),
  getData: vi.fn(),
  getDataItem: vi.fn(),
  getDataItems: vi.fn(),
  getDataLength: vi.fn(),
  hasDataView: vi.fn(),
  setData: vi.fn(),
  setDataItems: vi.fn(),
} as unknown as SlickGrid;

const dataViewStub = {
  destroy: vi.fn(),
  getItem: vi.fn(),
  getItems: vi.fn(),
  getItemCount: vi.fn(),
  setItems: vi.fn(),
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
      vi.spyOn(gridStub, 'hasDataView').mockReturnValueOnce(false);
    });

    it('should call getDataItem() method and expect item to be returned via SlickGrid.getDataItem()', () => {
      const itemMock = { id: 1, firstName: 'John', lastName: 'Doe' };
      const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem').mockReturnValueOnce(itemMock);

      const result = service.getDataItem(1);

      expect(result).toEqual(itemMock);
      expect(getDataItemSpy).toHaveBeenCalled();
    });

    it('should call getDataItems() method and expect items to be returned via SlickGrid.getData()', () => {
      const itemsMock = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ];
      const getDataItemsSpy = vi.spyOn(gridStub, 'getData').mockReturnValueOnce(itemsMock);

      const result = service.getDataItems();

      expect(result).toEqual(itemsMock);
      expect(getDataItemsSpy).toHaveBeenCalled();
    });

    it('should call getDataLength() method and expect items length returned via SlickGrid.getItemCount()', () => {
      const itemsMock = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ];
      const getDataLengthSpy = vi.spyOn(gridStub, 'getDataLength').mockReturnValueOnce(itemsMock.length);

      const result = service.getDataLength();

      expect(result).toBe(itemsMock.length);
      expect(getDataLengthSpy).toHaveBeenCalled();
    });

    it('should call setDataItems() method and expect items to be set via SlickGrid.setData()', () => {
      const itemsMock = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ];
      const setDataItemsSpy = vi.spyOn(gridStub, 'setData');

      service.setDataItems(itemsMock);

      expect(setDataItemsSpy).toHaveBeenCalled();
    });
  });

  describe('SlickDataView', () => {
    beforeEach(() => {
      vi.spyOn(gridStub, 'hasDataView').mockReturnValueOnce(true);
      vi.spyOn(gridStub, 'getData').mockReturnValueOnce(dataViewStub as any);
      service.init(gridStub);
    });

    it('should call getDataItem() method and expect item to be returned via DataView.getItem()', () => {
      const itemMock = { id: 1, firstName: 'John', lastName: 'Doe' };
      const getDataItemSpy = vi.spyOn(dataViewStub, 'getItem').mockReturnValueOnce(itemMock);

      service.init(gridStub);
      const result = service.getDataItem(1);

      expect(result).toEqual(itemMock);
      expect(getDataItemSpy).toHaveBeenCalled();
    });

    it('should call getDataItems() method and expect items to be returned via DataView.getItems()', () => {
      const itemsMock = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ];
      const getDataItemsSpy = vi.spyOn(dataViewStub, 'getItems').mockReturnValueOnce(itemsMock);

      const result = service.getDataItems();

      expect(result).toEqual(itemsMock);
      expect(getDataItemsSpy).toHaveBeenCalled();
    });

    it('should call getDataLength() method and expect items length returned via DataView.getItemCount()', () => {
      const itemsMock = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ];
      const getItemCountSpy = vi.spyOn(dataViewStub, 'getItemCount').mockReturnValueOnce(itemsMock.length);

      const result = service.getDataLength();

      expect(result).toBe(itemsMock.length);
      expect(getItemCountSpy).toHaveBeenCalled();
    });

    it('should call setDataItems() method and expect items to be set via DataView.setItems()', () => {
      const itemsMock = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ];
      const setItemsSpy = vi.spyOn(dataViewStub, 'setItems');

      service.setDataItems(itemsMock);

      expect(setItemsSpy).toHaveBeenCalled();
    });
  });
});
