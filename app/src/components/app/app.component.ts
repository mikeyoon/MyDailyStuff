import { importCss, importHtml } from '../../loader.js';

const css = await importCss(import.meta.url, 'app.component.css');
const html = await importHtml(import.meta.url, 'app.component.html');

export class AboutComponent extends HTMLElement {
  root: ShadowRoot;

  static get observedAttributes() {
    return ['test'];
  }

  constructor() {
    super();

    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.root.appendChild(css);
    this.root.appendChild(html.cloneNode(true));
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    switch (name) {
      case 'test':
        const element = this.root.querySelector('.test');
        if (element != null) {
          element.textContent = newValue;
        }
        break;
    }
  }
}
