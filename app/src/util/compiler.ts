import { BaseComponent } from "../components/base.component.js";

export type CompiledGraph = Array<CompiledElement>;

const enum DirectiveType {
  Structural = 1,
  Action = 2,
  Attr = 10,
}

let keyCounter = 0;

function compileDirectives(element: Element, root: BaseComponent) {
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
        compiled.push(new CompiledAttrDirective(
          'class',
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
      case '[href]':
        compiled.push(new CompiledAttrDirective(
          'href',
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
          element.parentElement || root,
          root as BaseComponent)
        );
        break;
      case '[repeat]':
        compiled.push(new CompiledRepeatDirective(
          attr.value || '',
          element,
          element.parentElement || root,
          root as BaseComponent)
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

  constructor(expr: string, node: Element, parent: Element, protected compiledAncestor: BaseComponent, args: string[] = []) {
    super(expr, node, parent, args);
  }
}

export class CompiledElement {
  private digestTimeout: number | null = null;
  hasStructuralDirective: boolean;

  constructor(protected html: Element, protected compiledDirectives: CompiledDirective[]) {
    this.hasStructuralDirective = compiledDirectives.some((d) => d.type === DirectiveType.Structural);
  }

  digest(context: any, immediate = false) {
    if (!this.digestTimeout) {
      if (immediate) {
        this.execute(context);
      } else {
        this.digestTimeout = window.setTimeout(() => {
          this.execute(context);
          this.digestTimeout = null;
        }, 5);
      }
    }
  }

  private execute(context: any) {
    for (const c of this.compiledDirectives) {
      if (!c.execute(context)) {
        break;
      }
    }
  }
}

export function compileFragment(html: DocumentFragment, root: BaseComponent, graph: CompiledGraph = []) {
  Array.from(html.children).forEach((element) => {
    const compiledDirectives = compileDirectives(element, root);
    if (compiledDirectives.length > 0) {
      const compiledElement = new CompiledElement(element, compiledDirectives);
      graph.push(compiledElement);

      if (!compiledElement.hasStructuralDirective) {
        compileChildren(element, root, root, graph);
      }
    } else {
      compileChildren(element, root, root, graph);
    }
  });
}

function compileChildren(element: Element, root: Element, compiledAncestor: BaseComponent, graph: CompiledGraph = []) {
  Array.from(element.children).forEach((child) => {
    // Compile all directives on immediate children
    const directives = compileDirectives(child, compiledAncestor);
    if (directives.length > 0) {
      const compiledElement = new CompiledElement(element, directives);
      graph.push(compiledElement);

      if (!compiledElement.hasStructuralDirective) {
        compileChildren(child, root, compiledAncestor, graph);
      }
    } else {
      compileChildren(child, root, compiledAncestor,graph);
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

export class CompiledAttrDirective extends CompiledDirective {
  value: string | null;
  originalValue: string | null;

  constructor(private name: string, expr: string, node: Element, parent: Element) {
    super(expr, node, parent);
    this.value = null;
    this.originalValue = node.getAttribute(name) || '';
  }

  execute(context: any) {
    const value = this.func.call(context);
    if (this.value !== value) {
      this.node.setAttribute(this.name, (this.originalValue + ' ' + value).trim());
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
  placeholder: HTMLTemplateElement;

  constructor(protected expr: string, node: Element, parent: Element, compiledAncestor: BaseComponent) {
    super('null', node, parent, compiledAncestor);
    this.value = null;
    this.originalNodes = Array.from(parent.children);

    this.placeholder = document.createElement('template');
    node.before(this.placeholder);
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

      // TODO: Passing values to elements this way is really hacky. Should use a scope tree instead.
      values.forEach((value, index) => {
        const element = this.node.cloneNode(true) as Element;
        // if node is a webcomponent and hasn't been mounted, the cloned node won't be instantiated until mounted
        if (element.tagName.startsWith('MDS-')) {
          (element as BaseComponent).bindings = { [key]: value };
          element.setAttribute('data-index', index.toString());
        } else {
          const childGraph: CompiledGraph = [];
          // To handle any regular DOM elements with directives
          compileChildren(element, this.parent, this.compiledAncestor, childGraph);
          element.__digest = () => {
            childGraph.forEach((ce, index) => {
              // Hacks all the way down
              const context = Object.create(this.compiledAncestor);
              Object.assign(context, {
                [key]: value,
                __index: index
              });
               
              ce.digest(context, true);
            });
          }
        }

        // Insert element
        if (this.generatedNodes?.length) {
          this.generatedNodes[this.generatedNodes.length - 1].after(element);
        } else {
          this.placeholder.after(element);
        }

        this.generatedNodes.push(element);
      });
    }

    this.generatedNodes.forEach((node) => {
      if (node.__digest) { 
        node.__digest();
      } else if (node instanceof BaseComponent) {
        node.digest();
      }
    });

    this.value = values;
    return true;
  }
}

export class CompiledIfDirective extends CompiledStructuralDirective {
  value: boolean | undefined;
  originalNodes: Element[];
  children: CompiledGraph;
  placeholder: HTMLTemplateElement;

  constructor(expr: string, node: Element, parent: Element, compiledAncestor: BaseComponent) {
    super(expr, node, parent, compiledAncestor);

    this.originalNodes = Array.from(parent.children);
    this.children = [];

    this.placeholder = document.createElement('template');
    this.node.before(this.placeholder);
    this.node.remove();

    compileChildren(this.node, this.parent, compiledAncestor, this.children);
  }

  execute(context: any) {
    const value = !!this.func.call(context);

    if (value) {
      this.children.forEach((child) => {
        child.digest(context, true);
      });
    }

    if (this.value !== value) {
      if (value) {
        this.placeholder.after(this.node);
      } else {
        this.node.remove();
      }

      this.value = value;
    }

    return value;
  }
}

