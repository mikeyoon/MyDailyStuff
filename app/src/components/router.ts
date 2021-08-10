type Resolver = (params: { [key: string]: string }) => HTMLElement;

interface Route {
  route: string;
  regex: RegExp;
  resolver: Resolver;
}

export class Router {
  private routes: Map<string, Route>;

  constructor(private baseUrl: string) {
    this.routes = new Map();
  }

  private matchRoute(to: string) {
    this.routes.keys()
  }

  private toRegex(route: string) {
    return new RegExp(route.replace(/\/:(.+?)(\/|$)/gi, '/(?<$1>.*)$2').replace('/', "\\/"), 'i');
  }

  on(route: string, resolver: Resolver) {
    this.routes.set(route, {
      route: route,
      regex: this.toRegex(route),
      resolver,
    });
  }
  
  navigate(route: string) {

  }

  resolve() {

  }
}