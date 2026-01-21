import type { SlickGrid } from '../core/index.js';
import type { ExternalResource, PdfExportOption } from '../interfaces/index.js';
import type { ContainerService } from '../services/container.service.js';

export abstract class PdfExportService implements ExternalResource {
  /** PdfExportService class name which is use to find service instance in the external registered services */
  className!: string;

  /**
   * Initialize the Export Service
   * @param _grid
   * @param _containerService
   */
  init(_grid: SlickGrid, _containerService: ContainerService): void {
    throw new Error('PdfExportService the "init" method must be implemented');
  }

  /**
   * Export to PDF file
   * @param _options - PDF export options
   * @return {Promise<boolean>} Promise that resolves when export is complete
   */
  exportToPdf(_options?: PdfExportOption): Promise<boolean> {
    throw new Error('PdfExportService the "exportToPdf" method must be implemented');
  }
}
