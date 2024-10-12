import { describe, expect, it } from 'vitest';

import { TextExportService } from '../textExport.service.js';

describe('Export Service', () => {
  it('should display a not implemented when calling "init" method', () => {
    expect(() => TextExportService.prototype.init({} as any, {} as any)).toThrow('ExportService the "init" method must be implemented');
  });

  it('should display a not implemented when calling "exportToFile" method', () => {
    expect(() => TextExportService.prototype.exportToFile({})).toThrow('ExportService the "exportToFile" method must be implemented');
  });
});
