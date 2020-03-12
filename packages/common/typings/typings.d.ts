/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}
interface jquery {
  tooltip(options?: any): any;
  tipsy(options?: any): any;
}
interface window {
  Slicker: any;
}
