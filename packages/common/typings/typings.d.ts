/* SystemJS module definition */
declare const module: NodeModule;
interface NodeModule {
  id: string;
}
interface window {
  Slicker: any;
}

declare module 'sortablejs/modular/sortable.core.esm.js' {
  import Sortable from 'sortablejs';
  export default Sortable;
}
