import { Observable } from '../util/observable.js';
import { CompiledBlurDirective, CompiledChangeDirective, CompiledClassDirective, CompiledClassesDirective, CompiledClickDirective, CompiledContentDirective, CompiledDirective, CompiledFocusDirective, CompiledIfDirective, CompiledSubmitDirective } from './directives.js';

const DIRECTIVE_SELECTOR = [
  '[\\[if\\]]',
  '[\\[content\\]]',
  '[\\[class\\]]',
  '[\\[classes\\]]',
  '[\\[click\\]]',
  '[\\[submit\\]]',
  '[\\[change\\]]',
  '[\\[blur\\]]',
  '[\\[focus\\]]',
].join(',');

const TEMPLATED_DIRECTIVE_SELECTOR = [
  '[\\[repeat\\]]',
].join(',');

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
    this.subscriptions.forEach((unsub) => unsub());
  }

  private compile(html: DocumentFragment) {
    const templated = html.querySelectorAll(TEMPLATED_DIRECTIVE_SELECTOR);
    templated.forEach((element) => {
      if (element.getAttribute('[repeat]')) {
        this.compiled.push(new CompiledIfDirective(
          element.getAttribute('[repeat]') || '',
          element,
          element.parentElement || this)
        );
      }
    });

    const directives = html.querySelectorAll(DIRECTIVE_SELECTOR);
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

      if (element.getAttribute('[class]')) {
        this.compiled.push(new CompiledClassDirective(
          element.getAttribute('[class]') || '',
          element,
          element.parentElement || this)
        );
      }

      if (element.getAttribute('[classes]')) {
        this.compiled.push(new CompiledClassesDirective(
          element.getAttribute('[classes]') || '',
          element,
          element.parentElement || this)
        );
      }

      if (element.getAttribute('[click]')) {
        this.compiled.push(new CompiledClickDirective(
          element.getAttribute('[click]') || '',
          element,
          element.parentElement || this,
          this)
        );
      }

      if (element.getAttribute('[change]')) {
        this.compiled.push(new CompiledChangeDirective(
          element.getAttribute('[change]') || '',
          element,
          element.parentElement || this,
          this)
        );
      }

      if (element.getAttribute('[submit]')) {
        this.compiled.push(new CompiledSubmitDirective(
          element.getAttribute('[submit]') || '',
          element,
          element.parentElement || this,
          this)
        );
      }

      if (element.getAttribute('[blur]')) {
        this.compiled.push(new CompiledBlurDirective(
          element.getAttribute('[blur]') || '',
          element,
          element.parentElement || this,
          this)
        );
      }

      if (element.getAttribute('[focus]')) {
        this.compiled.push(new CompiledFocusDirective(
          element.getAttribute('[focus]') || '',
          element,
          element.parentElement || this,
          this)
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