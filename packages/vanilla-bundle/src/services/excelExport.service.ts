import { ExcelExportService, ExcelExportOption } from '@slickgrid-universal/common';


export class ExcelExportServicer implements ExcelExportService {
  init(grid: any, dataView: any): void {
  }

  exportToExcel(options: ExcelExportOption): Promise<boolean> {
    return new Promise((resolve) => resolve(true));
  }
}
