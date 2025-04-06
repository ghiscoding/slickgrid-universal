import { format } from '@formkit/tempo';

export class AsgDateFormatValueConverter {
  toView(value: any, f: string): string {
    return format(value, f);
  }
}
