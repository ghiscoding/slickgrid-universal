export interface ElementEventListener {
  element: Element;
  eventName: string;
  listener: EventListenerOrEventListenerObject;
}

export interface Route {
  route: string;
  name?: string;
  title?: string;
  view?: string;
  /** lazy loader of the ViewModel module, the module must have a default export of the ViewModel class */
  viewModel?: () => Promise<{ default: any }>;
  redirect?: string;
}

export interface RouterConfig {
  pushState: boolean;
  routes: Route[];
}
