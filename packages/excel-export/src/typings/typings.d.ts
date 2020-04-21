/* SystemJS module definition */
declare const module: NodeModule;
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
