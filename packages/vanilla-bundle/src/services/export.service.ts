import { ExportOption } from '@slickgrid-universal/common';
import { ExportService as UniversalExportService } from '@slickgrid-universal/export';
import { EventPubSubService } from './eventPubSub.service';
import { TranslateService } from './translate.service';

export class ExportService extends UniversalExportService {
  constructor(eventPubSubService: EventPubSubService, translateService: TranslateService) {
    super(eventPubSubService, translateService);
  }

  init(grid: any, dataView: any): void {
    super.init(grid, dataView);
  }

  exportToFile(options: ExportOption): Promise<boolean> {
    return super.exportToFile(options);
  }
}
