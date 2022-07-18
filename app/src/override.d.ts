declare interface Document {
  adoptedStyleSheets: CSSStyleSheet[];
}

declare interface ShadowRoot {
  adoptedStyleSheets: CSSStyleSheet[];
}

declare interface CSSStyleSheet {
  replaceSync(css: string): void;
}

declare interface Element {
  __digest?: () => void;
}
