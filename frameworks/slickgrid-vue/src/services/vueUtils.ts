import { createVNode, render, type VNode, type VNodeProps } from 'vue';

type Data = Record<string, unknown>;
interface MountOptions {
  props: (Data & VNodeProps) | null;
  children: unknown;
  element: HTMLElement | null;
  app: any;
}

export function mount(component: any, { props, children, element, app } = {} as Partial<MountOptions>) {
  let el = element;

  let vNode: VNode | null = createVNode(component, props, children);
  if (app && app._context) vNode.appContext = app._context;
  if (el) render(vNode, el);
  else if (typeof document !== 'undefined') render(vNode, (el = document.createElement('div')));

  const destroy = () => {
    if (el) render(null, el);
    el = null;
    vNode = null;
  };

  return { vNode, destroy, el };
}
