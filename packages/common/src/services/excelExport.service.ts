import { ExcelExportOption } from '../interfaces/index';

export abstract class ExcelExportService {
  /**
   * Initialize the Export Service
   * @param grid
   * @param dataView
   */
  init(grid: any, dataView: any): void {
    console.log('ExcelExportService the "init" method must be implemented');
  }

  /**
   * Method to return the current locale used by the App
   * @return {string} current locale
   */
  exportToExcel(options: ExcelExportOption): Promise<boolean> {
    console.log('ExcelExportService the "exportToExcel" method must be implemented');
    return new Promise((resolve) => resolve(true));
  }
}
