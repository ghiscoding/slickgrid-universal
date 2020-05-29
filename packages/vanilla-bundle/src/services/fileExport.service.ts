import { ExportOption, SlickGrid } from '@slickgrid-universal/common';
import { FileExportService as UniversalExportService } from '@slickgrid-universal/file-export';
import { EventPubSubService } from './eventPubSub.service';

export class FileExportService extends UniversalExportService {
  constructor(eventPubSubService: EventPubSubService) {
    super(eventPubSubService);
  }

  init(grid: SlickGrid): void {
    super.init(grid);
  }

  exportToFile(options: ExportOption): Promise<boolean> {
    return super.exportToFile(options);
  }
}
