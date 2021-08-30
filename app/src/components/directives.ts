export abstract class CompiledDirective {
  func: Function;

  constructor(expr: string, protected node: Element, protected parent: Element, args: string[] = []) {
    this.func = new Function(...args, `"use strict"; return ${expr};`);
  }

  abstract execute(context: any): void;
}


export class CompiledIfDirective extends CompiledDirective {
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

// TODO: Make this XSS safe
export class CompiledContentDirective extends CompiledDirective {
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

export class CompiledClassDirective extends CompiledDirective {
  value: string | null;
  originalClass: string | null;

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent);
    this.value = null;
    this.originalClass = node.getAttribute('class');
  }

  execute(context: any) {
    const value = this.func.call(context);
    if (this.value !== value) {
      this.node.setAttribute('class', (this.originalClass + ' ' + value).trim());
      this.value = value;
    }
  }
}

export class CompiledClassesDirective extends CompiledDirective {
  value: { [className: string]: boolean } | null;
  originalClass: string | null;

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent);
    this.value = null;
    this.originalClass = node.getAttribute('class');
  }

  execute(context: any) {
    const value = this.func.call(context);
    if (JSON.stringify(this.value) !== JSON.stringify(value)) {
      const classes = Object.keys(value).reduce((classes, className) => {
        if (value[className]) {
          classes.push(className);
        }

        return classes;
      }, [] as string[]);

      this.node.setAttribute('class', (this.originalClass + ' ' + classes.join(' ')).trim());
      this.value = value;
    }
  }
}

export class CompiledClickDirective extends CompiledDirective {
  handler: (event: MouseEvent) => void;

  constructor(expr: string, node: Element, parent: Element, scope: HTMLElement) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(scope, event);
    (node as HTMLElement).addEventListener('click', this.handler);
  }

  execute(context: any) {}
}

export class CompiledChangeDirective extends CompiledDirective {
  handler: (event: Event) => void;

  constructor(expr: string, node: Element, parent: Element, scope: HTMLElement) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(scope, event);
    (node as HTMLInputElement).addEventListener('change', this.handler);
  }

  execute(context: any) {}
}

export class CompiledBlurDirective extends CompiledDirective {
  handler: (event: Event) => void;

  constructor(expr: string, node: Element, parent: Element, scope: HTMLElement) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(scope, event);
    (node as HTMLInputElement).addEventListener('blur', this.handler);
  }

  execute(context: any) {}
}

export class CompiledFocusDirective extends CompiledDirective {
  handler: (event: Event) => void;

  constructor(expr: string, node: Element, parent: Element, scope: HTMLElement) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(scope, event);
    (node as HTMLInputElement).addEventListener('fpcus', this.handler);
  }

  execute(context: any) {}
}

export class CompiledSubmitDirective extends CompiledDirective {
  handler: (event: Event) => void;

  constructor(expr: string, node: Element, parent: Element, scope: HTMLElement) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(scope, event);
    if (node.tagName === 'FORM') {
      (node as HTMLFormElement).addEventListener('submit', this.handler);
    }
  }

  execute(context: any) {}
}

// export class CompiledRepeatDirective extends CompiledDirective {
//   value: any[] | null;
//   originalNodes: Element[];

//   constructor(expr: string, node: Element, parent: Element) {
//     super(expr, node, parent);
//     this.value = null;
//     this.originalNodes = Array.from(parent.children);
    
//     node.remove();
//   }

//   execute(context: any) {
//     const value = this.func.call(context);
//     if (this.value !== value) {
//       this.node.setAttribute('class', (this.originalClass + ' ' + value).trim());
//       this.value = value;
//     }
//   }
// }