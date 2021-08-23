import { BehaviorSubject, Observable } from '../util/observable.js';

interface Route {
  route: string;
  regex: RegExp;
  component: new() => HTMLElement;
  canActivate?: () => boolean;
  title?: string;
}

export interface RouteParams { 
  [name: string]: string;
}

export class Router {
  private routes: Map<string, Route>;
  private resolved: {
    url: string;
    route: Route;
    params: RouteParams;
  } | null;

  constructor(private baseUrl: string) {
    this.routes = new Map();
    this.resolved = null;

    this.paramsNotifier = new BehaviorSubject<RouteParams>({});
    this.params$ = this.paramsNotifier;

    window.addEventListener('popstate', (event) => {
      this.navigate(window.document.location.href, false);
    });
  }

  private toRegex(route: string) {
    return new RegExp(route.replace(/:([a-z0-9_]+)(\/)?/gi, '(?<$1>[^\/]*)$2').replace('/', "\\/"), 'i');
  }

  paramsNotifier: BehaviorSubject<RouteParams>;
  params$: Observable<RouteParams>;

  on(route: string, options: {
    component: Route['component'],
    title?: string,
    canActivate?: () => boolean,
  }) {
    this.routes.set(route, {
      route: route,
      regex: this.toRegex(route),
      component: options.component,
      canActivate: options.canActivate,
      title: options.title,
    });
  }
  
  navigate(url: string, push = true) {
    if (this.resolved?.url !== url) {
      const routes = Array.from(this.routes.values());
      const route = routes.find((route) => route.regex.test(url));
      if (route != null) {
        const match = route.regex.exec(url);
        if (match != null) {
          this.resolve(url, route, match);
          if (push) {
            window.history.pushState(null, window.document.title, url);
          }

          document.title = 'My Daily Stuff' + (route.title ? ' - ' + route.title : '');
        }
      } else {
        console.error('404');
      }
    }
  }

  private resolve(url: string, route: Route, match: RegExpExecArray) {
    this.resolved = {
      url,
      route,
      params: match.groups || {}
    };

    if (route.canActivate && !route.canActivate) {
      // do nothing
    } else {
      this.paramsNotifier.next(this.resolved.params);
      const outlet = window.document.querySelector('router-outlet');
      if (outlet) {
        outlet.innerHTML = '';
        outlet.append(new route.component());
      }
    }
  }
}
