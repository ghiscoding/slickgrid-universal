import { ExcelExportService } from '../excelExport.service';

describe('ExcelExport Service', () => {
  it('should display a not implemented when calling "init" method', () => {
    expect(() => ExcelExportService.prototype.init({}, {})).toThrow('ExcelExportService the "init" method must be implemented');
  });

  it('should display a not implemented when calling "exportToExcel" method', () => {
    expect(() => ExcelExportService.prototype.exportToExcel({})).toThrow('ExcelExportService the "exportToExcel" method must be implemented');
  });
});
