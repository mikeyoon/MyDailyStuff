abstract class CompiledDirective {
  func: Function;

  constructor(expr: string, protected node: Element, protected parent: Element) {
    this.func = new Function(`"use strict"; return ${expr};`);
  }

  abstract execute(context: any): void;
} 

class CompiledIfDirective extends CompiledDirective {
  value: boolean;
  originalNodes: Element[];

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent);

    this.value = true;
    this.originalNodes = Array.from(parent.children);
  }

  execute(context: any) {
    const value = !!this.func.call(context);
    if (this.value !== value) {
      if (value) {
        const index = this.originalNodes.indexOf(this.node);
        const currentNodes = Array.from(this.parent.children);
        let inserted = false;

        for (let ii = index + 1; ii < this.originalNodes.length; ii++) {
          const sibIndex = currentNodes.indexOf(this.originalNodes[ii]);
          if (sibIndex >= 0) {
            this.parent.insertBefore(this.node, currentNodes[sibIndex]);
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          this.parent.appendChild(this.node);
        }
      } else {
        this.node.nextElementSibling
        this.node.remove();
      }

      this.value = value;
    }
  }
}

class CompiledContentDirective extends CompiledDirective {
  value: string | null;

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent);
    this.value = null;
  }

  execute(context: any) {
    const value = this.func.call(context);
    if (this.value !== value) {
      this.node.innerHTML = value || '';
      this.value = value;
    }
  }
}

export abstract class BaseComponent extends HTMLElement {
  private compiled: CompiledDirective[];

  constructor(private html: DocumentFragment, private css?: HTMLStyleElement) {
    super();
    this.compiled = [];
  }

  routeParamsChanged(params: any) {}

  connectedCallback() {
    if (this.css != null) {
      this.appendChild(this.css);
    }

    const html = this.html.cloneNode(true) as DocumentFragment;
    this.compile(html);
    this.appendChild(html);
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

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    switch (name) {
      case 'test':
        const element = this.querySelector('.test');
        if (element != null) {
          element.textContent = newValue;
        }
        break;
    }
  }
}