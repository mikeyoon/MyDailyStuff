class ScopeTree {
  getByElement(element: HTMLElement) {
    
  }

  destroy(element: HTMLElement) {

  }
}

export const scopes = new ScopeTree();

export class Scope {
  constructor(parent: Scope) {

  }

  data: any;

  attach(element: HTMLElement) {

  }

  createChildScope() {
    return new Scope(this);
  }

  destroy() {

  }
}