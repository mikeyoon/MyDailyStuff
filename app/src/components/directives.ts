export abstract class CompiledDirective {
  func: Function;

  constructor(expr: string, protected node: Element, protected parent: Element) {
    this.func = new Function(`"use strict"; return ${expr};`);
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