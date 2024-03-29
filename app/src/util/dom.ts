// Check if `child` is a descendant of `parent`
export function isDescendent(parent: Element, child: Element) {
  let node = child.parentNode;
  while (node) {
      if (node === parent) {
          return true;
      }

      // Traverse up to the parent
      node = node.parentNode;
  }

  // Go up until the root but couldn't find the `parent`
  return false;
};

export const SUPPORTS_CON_CSS = typeof CSSStyleSheet.prototype.replaceSync !== 'undefined';

export class DomQueue {
  private patches: Array<Function> = [];

  add(patch: Function) {
    this.patches.push(patch);
  }

  execute() {
    this.patches.forEach((patch) => {
      patch();
    })
  }
}
