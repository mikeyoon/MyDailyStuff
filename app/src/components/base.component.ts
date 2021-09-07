import { Observable } from '../util/observable.js';
import { compileFragment, CompiledElement } from '../util/compiler.js';

export abstract class BaseComponent extends HTMLElement {
  protected subscriptions: Array<Function>;
  protected root: ShadowRoot;
  protected scope!: CompiledElement;

  private digestTimeout: number | null = null;

  constructor(private html: DocumentFragment, private css?: HTMLStyleElement) {
    super();

    this.subscriptions = [];

    this.root = this.attachShadow({ mode: 'open' });
  }

  routeParamsChanged(params: any) { }

  connectedCallback() {
    if (this.css != null) {
      this.root.appendChild(this.css);
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

  private compile(html: DocumentFragment) {
    this.scope = compileFragment(html, this.root.host || this);
    this.digest();
  }

  protected digest() {
    this.scope.digest(this);
  }
}

export abstract class ChildComponent extends HTMLElement {
  protected subscriptions: Array<Function>;
  protected scope!: CompiledElement;

  constructor(protected context: any, private html: DocumentFragment, private css?: HTMLStyleElement) {
    super();
    this.subscriptions = [];
  }

  connectedCallback() {
    if (this.css != null) {
      this.appendChild(this.css);
    }

    const html = this.html.cloneNode(true) as DocumentFragment;
    this.compile(html);
  }

  disconnectedCallback() {
    this.subscriptions.forEach((unsub) => unsub());
  }

  private compile(html: DocumentFragment) {
    this.scope = compileFragment(html, this);
  }

  protected digest(context: any) {
    this.scope.digest(context);
  }
}
