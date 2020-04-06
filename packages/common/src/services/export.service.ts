import { ExportOption } from '../interfaces/index';

export abstract class ExportService {
  /**
   * Initialize the Export Service
   * @param grid
   * @param dataView
   */
  init(grid: any, dataView: any): void {
    console.log('ExportService the "init" method must be implemented');
  }

  /**
   * Method to return the current locale used by the App
   * @return {string} current locale
   */
  exportToFile(options: ExportOption): Promise<boolean> {
    console.log('ExportService the "exportToFile" method must be implemented');
    return new Promise((resolve) => resolve(true));
  }
}
