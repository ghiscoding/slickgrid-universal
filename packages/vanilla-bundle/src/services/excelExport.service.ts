import { ExcelExportOption, SharedService, SlickGrid } from '@slickgrid-universal/common';
import { TranslateService } from './translate.service';


export class ExcelExportService {
  constructor() {
    // super();
  }

  init(grid: SlickGrid, sharedService: SharedService): void {
    // super.init(grid, sharedService);
  }

  exportToExcel(options: ExcelExportOption): Promise<boolean> {
    return new Promise((resolve) => resolve(true));
    // return super.exportToExcel(options);
  }
}
