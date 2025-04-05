export class AsgNumberValueConverter {
  fromView(value: any): number {
    const number = parseFloat(value);
    return isNaN(number) ? value : number;
  }
}
