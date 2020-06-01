import { FileExportService } from '../fileExport.service';

describe('Export Service', () => {
  it('should display a not implemented when calling "init" method', () => {
    expect(() => FileExportService.prototype.init({}, {})).toThrow('ExportService the "init" method must be implemented');
  });

  it('should display a not implemented when calling "exportToFile" method', () => {
    expect(() => FileExportService.prototype.exportToFile({})).toThrow('ExportService the "exportToFile" method must be implemented');
  });
});
