import { Observable } from '../util/observable.js';
import { compileFragment, CompiledGraph } from '../util/compiler.js';
import { importRelative } from '../loader.js';
import { DomQueue, SUPPORTS_CON_CSS } from '../util/dom.js';

const bsCssText = await importRelative(import.meta.url, '../bootstrap.min.css');

let bsCss: CSSStyleSheet | undefined;
if (SUPPORTS_CON_CSS) {
  bsCss = new CSSStyleSheet();
  bsCss.replaceSync(bsCssText);
  document.adoptedStyleSheets = [bsCss];
} else {
  const css = document.createElement('style');
  css.textContent = bsCssText;
  document.head.appendChild(css);
}

export abstract class BaseComponent extends HTMLElement {
  protected subscriptions: Array<Function>;
  protected root: ShadowRoot;
  protected compiled: CompiledGraph = [];
  protected content: DocumentFragment;
  public bindings: any;
  
  protected domQueue: DomQueue | null = null;

  constructor(private html: DocumentFragment, private css?: HTMLStyleElement) {
    super();

    this.subscriptions = [];

    this.root = this.attachShadow({ mode: 'open' });
    this.content = html.cloneNode(true) as DocumentFragment;
    this.compile(this.content);
  }

  routeParamsChanged(params: any) { }

  connectedCallback() {
    this.digest(true);

    if (bsCss != null) {
      const componentCss = new CSSStyleSheet();
      if (this.css?.textContent) {
        componentCss.replaceSync(this.css.textContent);
      }
      
      this.root.adoptedStyleSheets = [bsCss, componentCss];
    } else {
      const bs = document.createElement('style');
      bs.textContent = bsCssText;
      this.root.appendChild(bs);

      if (this.css?.textContent) {
        this.root.appendChild(this.css.cloneNode(true));
      }
    }

    this.root.appendChild(this.content);
  };

  protected subscribe<T>(obs: Observable<T>, onSuccess: (val: T) => void) {
    this.subscriptions.push(obs.subscribe(onSuccess));
  }

  disconnectedCallback() {
    this.root.replaceChildren();
    this.subscriptions.forEach((unsub) => unsub());
  }

  private compile(html: DocumentFragment) {
    compileFragment(html, (this.root.host as BaseComponent) || this, this.compiled);
  }

  public digest(immediate = false) {
    if (this.domQueue) {
      return;
    }

    const queue = new DomQueue();
    this.domQueue = queue;

    const run = () => {
      this.compiled.forEach((ce) => {
        ce.digest(this, queue, true);
      });
      queue.execute();
  
      this.domQueue = null;
    };

    if (immediate) {
      run();
    } else {
      setTimeout(run, 10);
    }
  }
}
