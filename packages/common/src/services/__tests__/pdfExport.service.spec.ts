import { describe, expect, it } from 'vitest';
import type { SlickGrid } from '../../core/index.js';
import type { ContainerService } from '../container.service.js';
import { PdfExportService } from '../pdfExport.service.js';

describe('PdfExportService', () => {
  it('should throw an error when calling "init" method directly from base service', () => {
    expect(() => PdfExportService.prototype.init({} as unknown as SlickGrid, {} as unknown as ContainerService)).toThrow(
      'PdfExportService the "init" method must be implemented'
    );
  });

  it('should throw an error when calling "exportToPdf" method directly from base service', () => {
    expect(() => PdfExportService.prototype.exportToPdf({})).toThrow('PdfExportService the "exportToPdf" method must be implemented');
  });
});
