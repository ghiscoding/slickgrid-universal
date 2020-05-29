import { ExportOption } from '@slickgrid-universal/common';
import { FileExportService as UniversalExportService } from '@slickgrid-universal/file-export';
import { EventPubSubService } from './eventPubSub.service';
import { TranslateService } from './translate.service';

export class FileExportService extends UniversalExportService {
  constructor(eventPubSubService: EventPubSubService, translateService: TranslateService) {
    super(eventPubSubService, translateService);
  }

  init(grid: any): void {
    super.init(grid);
  }

  exportToFile(options: ExportOption): Promise<boolean> {
    return super.exportToFile(options);
  }
}
