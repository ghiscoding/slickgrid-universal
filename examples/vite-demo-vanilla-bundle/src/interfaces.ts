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
  viewModel?: any;
  redirect?: string;
}

export interface RouterConfig {
  pushState: boolean;
  routes: Route[];
}
