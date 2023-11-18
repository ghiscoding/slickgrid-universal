import { ContainerService } from '../container.service';
import { ExcelExportService } from '../excelExport.service';
import { SlickGrid } from '../../core/index';

describe('ExcelExport Service', () => {
  it('should display a not implemented when calling "init" method', () => {
    expect(() => ExcelExportService.prototype.init({} as unknown as SlickGrid, {} as unknown as ContainerService)).toThrow('ExcelExportService the "init" method must be implemented');
  });

  it('should display a not implemented when calling "exportToExcel" method', () => {
    expect(() => ExcelExportService.prototype.exportToExcel({})).toThrow('ExcelExportService the "exportToExcel" method must be implemented');
  });
});
