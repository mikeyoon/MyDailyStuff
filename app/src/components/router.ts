import { BehaviorSubject, Observable } from '../util/observable.js';

type ElementConstructor = new() => HTMLElement;

interface Route {
  route: string;
  regex: RegExp;
  component?: ElementConstructor;
  lazyLoader?: () => Promise<ElementConstructor>;
  canActivate?: (params: RouteParams) => boolean | Promise<boolean>;
  title?: string;
}

export interface ActiveRoute {
  params: RouteParams;
  route: string | undefined;
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

  private root!: ShadowRoot;

  constructor(private baseUrl: string) {
    this.routes = new Map();
    this.resolved = null;

    this.routeNotifier = new BehaviorSubject<ActiveRoute>({ params: {}, route: undefined });
    this.activeRoute$ = this.routeNotifier;

    window.addEventListener('popstate', (event) => {
      this.navigate(window.document.location.href, false);
    });
  }

  private toRegex(route: string) {
    return new RegExp(route.replace(/:([a-z0-9_]+)(\/)?/gi, '(?<$1>[^\/]*)$2').replace('/', "\\/"), 'i');
  }

  private routeNotifier: BehaviorSubject<ActiveRoute>;
  activeRoute$: Observable<ActiveRoute>;

  on(route: string, options: {
    component?: Route['component'],
    lazyLoader?: Route['lazyLoader'],
    title?: string,
    canActivate?: (params: RouteParams) => boolean | Promise<boolean>,
  }) {
    this.routes.set(route, {
      route: route,
      regex: this.toRegex(route),
      component: options.component,
      lazyLoader: options.lazyLoader,
      canActivate: options.canActivate,
      title: options.title,
    });
  }

  init(root: ShadowRoot) {
    this.root = root;
  }
  
  navigate(url: string, push = true) {
    if (this.resolved?.url !== url) {
      const routes = Array.from(this.routes.values());
      const route = routes.find((route) => route.regex.test(url));
      if (route != null) {
        const match = route.regex.exec(url);
        if (match != null) {
          this.resolve(url, route, match, push);
        }
      } else {
        console.error('404');
      }
    }
  }

  private resolve(url: string, route: Route, match: RegExpExecArray, push: boolean) {
    const params = match.groups || {};

    const process = async () => {
      this.resolved = {
        url,
        route,
        params
      };

      let Element = route.component;

      if (route.lazyLoader) {
        Element = await route.lazyLoader();
      }

      if (Element) {
        if (push) {
          window.history.pushState(null, window.document.title, url);
        }
  
        document.title = 'My Daily Stuff' + (route.title ? ' - ' + route.title : '');
  
        this.routeNotifier.next({
          params: this.resolved.params,
          route: route.route
        });

        const outlet = this.root.querySelector('router-outlet');
  
        if (outlet && !(outlet.firstElementChild instanceof Element)) {
          outlet.innerHTML = '';
          outlet.append(new Element());
        }
      }      
    }

    if (route.canActivate) {
      const result = route.canActivate(params);
      if (result instanceof Promise) {
        result.then((can) => {
          if (can) {
            process();
          }
        })
      } else {
        if (result) {
          process();
        }
      }
    } else {
      process();
    }
  }
}

export const router = new Router('./');
