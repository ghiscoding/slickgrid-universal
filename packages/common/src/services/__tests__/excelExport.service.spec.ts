import { describe, expect, it } from 'vitest';

import type { ContainerService } from '../container.service.js';
import { ExcelExportService } from '../excelExport.service.js';
import type { SlickGrid } from '../../core/index.js';

describe('ExcelExport Service', () => {
  it('should display a not implemented when calling "init" method', () => {
    expect(() => ExcelExportService.prototype.init({} as unknown as SlickGrid, {} as unknown as ContainerService)).toThrow(
      'ExcelExportService the "init" method must be implemented'
    );
  });

  it('should display a not implemented when calling "exportToExcel" method', () => {
    expect(() => ExcelExportService.prototype.exportToExcel({})).toThrow('ExcelExportService the "exportToExcel" method must be implemented');
  });
});
