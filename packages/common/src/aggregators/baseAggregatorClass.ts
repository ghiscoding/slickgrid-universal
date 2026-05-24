export class BaseAggregatorClass {
  protected _isInitialized = false;
  protected _isTreeAggregator = false;
  protected _field: number | string;
  protected _type = '';

  constructor(field: number | string) {
    this._field = field;
  }

  get field(): number | string {
    return this._field;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get type(): string {
    return this._type;
  }
}
