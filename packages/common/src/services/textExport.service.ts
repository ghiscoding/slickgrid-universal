import type { SlickGrid } from '../core/index.js';
import type { ExternalResource, TextExportOption } from '../interfaces/index.js';
import type { ContainerService } from '../services/container.service.js';

export abstract class TextExportService implements ExternalResource {
  /** ExcelExportService class name which is use to find service instance in the external registered services */
  className!: string;

  /**
   * Initialize the Export Service
   * @param _grid
   * @param _containerService
   */
  init(_grid: SlickGrid, _containerService: ContainerService): void {
    throw new Error('ExportService the "init" method must be implemented');
  }

  /**
   * Method to return the current locale used by the App
   * @return {string} current locale
   */
  exportToFile(_options?: TextExportOption): Promise<boolean> {
    throw new Error('ExportService the "exportToFile" method must be implemented');
  }
}
