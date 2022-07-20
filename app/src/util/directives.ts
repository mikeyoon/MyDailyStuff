export abstract class CompiledDirective {
  func: Function;

  constructor(expr: string, protected node: Element, protected parent: Element, args: string[] = []) {
    this.func = new Function(...args, `"use strict"; return ${expr};`);
  }

  abstract execute(context: any): void;
}

export abstract class CompiledDeferredDirective extends CompiledDirective {
  childDeferredDirectives: CompiledDeferredDirective[];
  
  constructor(expr: string, protected node: Element, protected parent: Element, args: string[] = []) {
    super(expr, node, parent, args);
    this.childDeferredDirectives = [];

    /**
     * 1. Find and "compile" all direct deferred children
     */
    node.remove();
  }

  execute(context: any): void {
    this.childDeferredDirectives.forEach((directive) => {
      directive.execute(context);
    });
    // Execute all non-deferred directives
  }
}

export class CompiledIfDirective extends CompiledDirective {
  /** 
   * if evaluates false -> true
   * mount the dom and then compile the subtree of directives below
   * 
   * if evaluates true -> false
   * then unmount the element
   * 
   * if true during execute, then execute all descendent directives
   **/

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

        // Find original position based on sibling positions and reinsert
        for (let ii = index + 1; ii < this.originalNodes.length; ii++) {
          const sibIndex = currentNodes.indexOf(this.originalNodes[ii]);
          if (sibIndex >= 0) {
            this.parent.insertBefore(this.node, currentNodes[sibIndex]);
            inserted = true;
            break;
          }
        }

        // If siblings are no longer present, or if no siblings, just insert
        if (!inserted) {
          this.parent.appendChild(this.node);
        }

        // compile children here
      } else {
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
      this.node.innerHTML = value;
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
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLElement).addEventListener('click', this.handler);
  }

  execute(context: any) {
    this.context = context;
  }
}

export class CompiledChangeDirective extends CompiledDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('change', this.handler);
  }

  execute(context: any) {
    this.context = context;
  }
}

export class CompiledInputDirective extends CompiledDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('input', this.handler);
  }

  execute(context: any) {
    this.context = context;
  }
}

export class CompiledBlurDirective extends CompiledDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('blur', this.handler);
  }

  execute(context: any) {
    this.context = context;
  }
}

export class CompiledFocusDirective extends CompiledDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('focus', this.handler);
  }

  execute(context: any) {
    this.context = context;
  }
}

export class CompiledKeypressDirective extends CompiledDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('keypress', this.handler);
  }

  execute(context: any) {
    this.context = context;
  }
}

export class CompiledSubmitDirective extends CompiledDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    if (node.tagName === 'FORM') {
      (node as HTMLFormElement).addEventListener('submit', this.handler);
    }
  }

  execute(context: any) {
    this.context = context;
  }
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