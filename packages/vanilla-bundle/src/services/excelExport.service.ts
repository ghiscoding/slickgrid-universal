import { ExcelExportOption, SlickGrid } from '@slickgrid-universal/common';
import { TranslateService } from './translate.service';
import { EventPubSubService } from './eventPubSub.service';


export class ExcelExportService {
  constructor(eventPubSubService: EventPubSubService) {
    // super(eventPubSubService);
  }

  init(grid: SlickGrid): void {
    // super.init(grid);
  }

  exportToExcel(options: ExcelExportOption): Promise<boolean> {
    return new Promise((resolve) => resolve(true));
    // return super.exportToExcel(options);
  }
}
