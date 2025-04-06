import { format } from '@formkit/tempo';

export class DateFormatValueConverter {
  toView(value: any, f: string): string {
    return format(value, f);
  }
}
