import { ExportService, ExportOption } from '@slickgrid-universal/common';

export class ExportServicer implements ExportService {
  init(grid: any, dataView: any): void {
  }

  exportToFile(options: ExportOption): Promise<boolean> {
    return new Promise((resolve) => resolve(true));
  }
}
