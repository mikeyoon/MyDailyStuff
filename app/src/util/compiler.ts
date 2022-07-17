import { BaseComponent } from "src/components/base.component";

export type CompiledGraph = Array<CompiledElement>;

const enum DirectiveType {
  Structural = 1,
  Action = 2,
  Attr = 10,
}

function compileDirectives(element: Element, root: Element) {
  const compiled: CompiledDirective[] = [];

  for (const attr of element.attributes) {
    switch (attr.name) {
      case '[content]':
        compiled.push(new CompiledContentDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[class]':
        compiled.push(new CompiledClassDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[classes]':
        compiled.push(new CompiledClassesDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[click]':
        compiled.push(new CompiledClickDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[change]':
        compiled.push(new CompiledChangeDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[input]':
        compiled.push(new CompiledInputDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[keypress]':
        compiled.push(new CompiledKeypressDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[submit]':
        compiled.push(new CompiledSubmitDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[blur]':
        compiled.push(new CompiledBlurDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[focus]':
        compiled.push(new CompiledFocusDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[if]':
        compiled.push(new CompiledIfDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
      case '[repeat]':
        compiled.push(new CompiledRepeatDirective(
          attr.value || '',
          element,
          element.parentElement || root)
        );
        break;
    }
  }

  if (compiled.filter((c) => c.type === DirectiveType.Structural).length > 1) {
    throw new Error('cannot have more than one structural directive on an element');
  }

  compiled.sort((a, b) => a.type - b.type);

  return compiled;
}

abstract class CompiledDirective {
  func: Function;
  readonly type: DirectiveType = DirectiveType.Attr;

  constructor(protected expr: string, protected node: Element, protected parent: Element, args: string[] = []) {
    this.func = new Function(...args, `"use strict"; return ${expr};`);
  }

  abstract execute(context: any): boolean;
}

abstract class CompiledActionDirective extends CompiledDirective {
  readonly type = DirectiveType.Action;
}

abstract class CompiledStructuralDirective extends CompiledDirective {
  readonly type = DirectiveType.Structural;

  constructor(expr: string, node: Element, parent: Element, args: string[] = []) {
    super(expr, node, parent, args);
  }

  abstract execute(context: any): boolean;

  reinsertElement(originalNodes: Element[], originalNode: Element, nodeToInsert: Element, parent: Element) {
    const index = originalNodes.indexOf(originalNode);
    const currentNodes = Array.from(parent.children);
    let inserted = false;

    // Find original position based on sibling positions and reinsert
    for (let ii = index + 1; ii < originalNodes.length; ii++) {
      const sibIndex = currentNodes.indexOf(originalNodes[ii]);
      if (sibIndex >= 0) {
        parent.insertBefore(nodeToInsert, currentNodes[sibIndex]);
        inserted = true;
        break;
      }
    }

    // If siblings are no longer present, or if no siblings, just insert
    if (!inserted) {
      parent.appendChild(nodeToInsert);
    }
  }
}

export class CompiledElement {
  private digestTimeout: number | null = null;
  hasStructuralDirective: boolean;

  constructor(protected html: Element, protected compiledDirectives: CompiledDirective[]) {
    this.hasStructuralDirective = compiledDirectives.some((d) => d.type === DirectiveType.Structural);
  }

  digest(context: any) {
    if (!this.digestTimeout) {
      this.digestTimeout = window.setTimeout(() => {
        this.digestTimeout = null;

        for (const c of this.compiledDirectives) {
          if (!c.execute(context)) {
            break;
          }
        }
      }, 10);
    }
  }
}

export function compileFragment(html: DocumentFragment, root: Element, graph: CompiledGraph = []) {
  Array.from(html.children).forEach((element) => {
    const compiledDirectives = compileDirectives(element, root);
    if (compiledDirectives.length > 0) {
      const compiledElement = new CompiledElement(element, compiledDirectives);
      graph.push(compiledElement);

      if (!compiledElement.hasStructuralDirective) {
        compileChildren(element, root, graph);
      }
    } else {
      compileChildren(element, root, graph);
    }
  });
}

function compileChildren(element: Element, root: Element, graph: CompiledGraph = []) {
  Array.from(element.children).forEach((child) => {
    // Compile all directives on immediate children
    const directives = compileDirectives(child, element);
    if (directives.length > 0) {
      const compiledElement = new CompiledElement(element, directives);
      graph.push(compiledElement);

      if (!compiledElement.hasStructuralDirective) {
        compileChildren(child, root, graph);
      }
    } else {
      compileChildren(child, root, graph);
    }
  });
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

    return true;
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

    return true;
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

    return true;
  }
}

export class CompiledClickDirective extends CompiledActionDirective {
  handler: (event: MouseEvent) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLElement).addEventListener('click', this.handler);
  }

  execute(context: any) {
    this.context = context;
    return true;
  }
}

export class CompiledChangeDirective extends CompiledActionDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('change', this.handler);
  }

  execute(context: any) {
    this.context = context;
    return true;
  }
}

export class CompiledInputDirective extends CompiledActionDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('input', this.handler);
  }

  execute(context: any) {
    this.context = context;
    return true;
  }
}

export class CompiledBlurDirective extends CompiledActionDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('blur', this.handler);
  }

  execute(context: any) {
    this.context = context;
    return true;
  }
}

export class CompiledFocusDirective extends CompiledActionDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('focus', this.handler);
  }

  execute(context: any) {
    this.context = context;
    return true;
  }
}

export class CompiledKeypressDirective extends CompiledActionDirective {
  handler: (event: Event) => void;
  context: any = {};

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent, ['event']);
    this.handler = (event) => this.func.call(this.context, event);
    (node as HTMLInputElement).addEventListener('keypress', this.handler);
  }

  execute(context: any) {
    this.context = context;
    return true;
  }
}

export class CompiledSubmitDirective extends CompiledActionDirective {
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
    return true;
  }
}

export class CompiledRepeatDirective extends CompiledStructuralDirective {
  value: any[] | null;
  generatedNodes: Element[] = [];
  originalNodes: Element[];

  constructor(protected expr: string, node: Element, parent: Element) {
    super('null', node, parent);
    this.value = null;
    this.originalNodes = Array.from(parent.children);

    node.remove();
  }

  execute(context: any) {
    const [key, arrExp] = this.expr.split(' of ');

    const values = new Function(`return ${arrExp}`).call(context) as Array<any>;
    if (this.value !== values) {
      if (this.generatedNodes.length > 0) {
        this.generatedNodes.forEach((node) => node.remove());
        this.generatedNodes = [];
      }

      values.forEach((value, index) => {
        const element = this.node.cloneNode(true) as BaseComponent;
        element.bindings = { entry: value };
        element.setAttribute('data-index', index.toString());

        // Insert element
        if (this.generatedNodes?.length) {
          this.generatedNodes[this.generatedNodes.length - 1].after(element);
        } else {
          // find closest prev sibling, otherwise insert into beginning
          this.reinsertElement(this.originalNodes, this.node, element, this.parent);
        }

        this.generatedNodes.push(element);
      });
    }

    this.value = values;
    return true;
  }
}

export class CompiledIfDirective extends CompiledStructuralDirective {
  value: boolean | undefined;
  originalNodes: Element[];
  children: CompiledGraph;

  constructor(expr: string, node: Element, parent: Element) {
    super(expr, node, parent);

    this.originalNodes = Array.from(parent.children);
    this.children = [];

    compileChildren(this.node, this.parent, this.children);
    this.node.remove();
  }

  execute(context: any) {
    const value = !!this.func.call(context);

    if (value) {
      this.children.forEach((child) => {
        child.digest(context);
      });
    }

    if (this.value !== value) {
      if (value) {
        this.reinsertElement(this.originalNodes, this.node, this.node, this.parent);
      } else {
        this.node.remove();
      }

      this.value = value;
    }

    return value;
  }
}

