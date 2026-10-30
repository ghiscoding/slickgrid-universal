import type { GridOption } from '@slickgrid-universal/common';

/** Grid options specific to the Salesforce bundle. */
export interface SalesforceGridOption extends GridOption {
  /** Maximum retry count at 200ms intervals. Salesforce defaults: 18000 (60 minutes). */
  autoFixResizeTimeout?: number;

  /** Successful resize checks required before stopping. Salesforce defaults: 18000. */
  autoFixResizeRequiredGoodCount?: number;

  /** Enable tab visibility recovery. Enabled by useSalesforceDefaultGridOptions. */
  autoFixResizeWhenBrokenStyleDetected?: boolean;
}
