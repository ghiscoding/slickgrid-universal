import { ExcelExportOption } from '../interfaces/index';

export abstract class ExcelExportService {
  /**
   * Initialize the Export Service
   * @param grid
   * @param dataView
   */
  init(grid: any, dataView: any): void {
    throw new Error('ExcelExportService the "init" method must be implemented');
  }

  /**
   * Method to return the current locale used by the App
   * @return {string} current locale
   */
  exportToExcel(options: ExcelExportOption): Promise<boolean> {
    throw new Error('ExcelExportService the "exportToExcel" method must be implemented');
  }
}
