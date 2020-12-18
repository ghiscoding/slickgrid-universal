/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExcelExportOption, ExternalResource, SlickGrid } from '../interfaces/index';
import { ContainerService } from '../services/container.service';

export abstract class ExcelExportService implements ExternalResource {
  /** ExcelExportService class name which is use to find service instance in the external registered services */
  className: string;

  /**
   * Initialize the Export Service
   * @param _grid
   * @param _containerService
   */
  init(_grid: SlickGrid, _containerService: ContainerService): void {
    throw new Error('ExcelExportService the "init" method must be implemented');
  }

  /**
   * Method to return the current locale used by the App
   * @return {string} current locale
   */
  exportToExcel(_options?: ExcelExportOption): Promise<boolean> {
    throw new Error('ExcelExportService the "exportToExcel" method must be implemented');
  }
}
