import { Observable } from '../util/observable.js';
import { CompiledContentDirective, CompiledDirective, CompiledIfDirective } from './directives.js';

export abstract class BaseComponent extends HTMLElement {
  private compiled: CompiledDirective[];
  private subscriptions: Array<Function>;
  protected root: ShadowRoot;

  private digestTimeout: number | null = null;

  constructor(private html: DocumentFragment, private css?: HTMLStyleElement) {
    super();
    this.compiled = [];
    this.subscriptions = [];

    this.root = this.attachShadow({ mode: 'open' });
  }

  routeParamsChanged(params: any) {}

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
    this.subscriptions.forEach((unsub) => unsub());
  }

  private compile(html: DocumentFragment) {
    const directives = html.querySelectorAll('[\\[if\\]],[\\[content\\]]');
    directives.forEach((element) => {
      if (element.getAttribute('[if]')) {
        this.compiled.push(new CompiledIfDirective(
          element.getAttribute('[if]') || '',
          element,
          element.parentElement || this)
        );
      }
      
      if (element.getAttribute('[content]')) {
        this.compiled.push(new CompiledContentDirective(
          element.getAttribute('[content]') || '',
          element,
          element.parentElement || this)
        );
      }
    });

    this.digest();
  }

  protected digest() {
    if (!this.digestTimeout) {
      this.digestTimeout = window.setTimeout(() => {
        this.digestTimeout = null;
        
        this.compiled.forEach((c) => {
          c.execute(this);
        });
      }, 10);
    }
  }
}