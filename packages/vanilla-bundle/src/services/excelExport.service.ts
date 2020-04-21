import { ExcelExportOption } from '@slickgrid-universal/common';
import { TranslateService } from './translate.service';
import { EventPubSubService } from './eventPubSub.service';


export class ExcelExportService {
  constructor(eventPubSubService: EventPubSubService, translateService: TranslateService) {
    // super(eventPubSubService, translateService);
  }

  init(grid: any, dataView: any): void {
    // super.init(grid, dataView);
  }

  exportToExcel(options: ExcelExportOption): Promise<boolean> {
    return new Promise((resolve) => resolve(true));
    // return super.exportToExcel(options);
  }
}
