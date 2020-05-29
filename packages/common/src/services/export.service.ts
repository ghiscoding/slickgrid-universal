import { ExportOption } from '../interfaces/index';

export abstract class ExportService {
  /**
   * Initialize the Export Service
   * @param grid
   */
  init(grid: any): void {
    throw new Error('ExportService the "init" method must be implemented');
  }

  /**
   * Method to return the current locale used by the App
   * @return {string} current locale
   */
  exportToFile(options: ExportOption): Promise<boolean> {
    throw new Error('ExportService the "exportToFile" method must be implemented');
  }
}
