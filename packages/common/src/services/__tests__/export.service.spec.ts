import { ExportService } from '../export.service';

describe('Export Service', () => {
  it('should display a not implemented when calling "init" method', () => {
    expect(() => ExportService.prototype.init({}, {})).toThrow('ExportService the "init" method must be implemented');
  });

  it('should display a not implemented when calling "exportToFile" method', () => {
    expect(() => ExportService.prototype.exportToFile({})).toThrow('ExportService the "exportToFile" method must be implemented');
  });
});
