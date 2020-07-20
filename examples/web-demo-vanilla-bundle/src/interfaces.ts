export interface Route {
  route: string;
  name?: string;
  title?: string;
  moduleId?: string;
  redirect?: string;
}

export interface RouterConfig {
  pushState: boolean;
  routes: Route[];
}
