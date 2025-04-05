export class DecimalValueConverter {
  public toView(value: any, decimalCount: string): string {
    const decimal = typeof decimalCount === 'string' ? parseInt(decimalCount, 10) : 2;
    const formattedNumber = typeof value !== 'undefined' ? parseFloat(value).toFixed(decimal) : value;
    return value ? `${formattedNumber}` : value;
  }
}
