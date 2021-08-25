import { CompiledContentDirective, CompiledDirective, CompiledIfDirective } from './directives.js';

export abstract class BaseComponent extends HTMLElement {
  private compiled: CompiledDirective[];
  protected root: ShadowRoot;

  constructor(private html: DocumentFragment, private css?: HTMLStyleElement) {
    super();
    this.compiled = [];

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
    this.compiled.forEach((c) => {
      c.execute(this);
    });
  }
}