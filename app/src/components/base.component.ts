import { Observable } from '../util/observable.js';
import { compileFragment, CompiledGraph } from '../util/compiler.js';
import { importRelative } from '../loader.js';

const bsCss = new CSSStyleSheet();
bsCss.replaceSync(await importRelative(import.meta.url, '../bootstrap.min.css'));
document.adoptedStyleSheets = [bsCss];

export abstract class BaseComponent extends HTMLElement {
  protected subscriptions: Array<Function>;
  protected root: ShadowRoot;
  protected compiled: CompiledGraph = [];
  public bindings: any;

  private digestTimeout: number | null = null;

  constructor(private html: DocumentFragment, private css?: HTMLStyleElement) {
    super();

    this.subscriptions = [];

    this.root = this.attachShadow({ mode: 'open' });
  }

  routeParamsChanged(params: any) { }

  connectedCallback() {
    this.root.adoptedStyleSheets = [bsCss];
    if (this.css != null) {
      this.root.appendChild(this.css.cloneNode(true));
    }

    const html = this.html.cloneNode(true) as DocumentFragment;
    this.compile(html);
    this.root.appendChild(html);
  };

  protected subscribe<T>(obs: Observable<T>, onSuccess: (val: T) => void) {
    this.subscriptions.push(obs.subscribe(onSuccess));
  }

  disconnectedCallback() {
    this.root.replaceChildren();
    this.subscriptions.forEach((unsub) => unsub());
  }

  setBindings(bindings: any) {
    this.bindings = bindings;
  }

  private compile(html: DocumentFragment) {
    compileFragment(html, this.root.host || this, this.compiled);
    this.digest();
  }

  public digest() {
    this.compiled.forEach((ce) => {
      ce.digest(this);
    });
  }
}

// export abstract class ChildComponent extends HTMLElement {
//   protected subscriptions: Array<Function>;
//   protected scope!: CompiledElement;

//   constructor(protected context: any, private html: DocumentFragment, private css?: HTMLStyleElement) {
//     super();
//     this.subscriptions = [];
//   }

//   connectedCallback() {
//     if (this.css != null) {
//       this.appendChild(this.css);
//     }

//     const html = this.html.cloneNode(true) as DocumentFragment;
//     this.compile(html);
//   }

//   disconnectedCallback() {
//     this.subscriptions.forEach((unsub) => unsub());
//   }

//   private compile(html: DocumentFragment) {
//     this.scope = compileDirectives(html, this);
//   }

//   protected digest(context: any) {
//     this.scope.digest(context);
//   }
// }
