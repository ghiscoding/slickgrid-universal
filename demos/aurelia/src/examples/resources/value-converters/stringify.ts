export class StringifyValueConverter {
  public toView(value: any): string {
    return JSON.stringify(value, null, 4);
  }
}
