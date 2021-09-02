import { importCss, importHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'journal.component.css');
const html = await importHtml(import.meta.url, 'journal.component.html');

export class EntryComponent extends BaseComponent {
  static get observedAttributes() {
    return ['entry'];
  }

  constructor() {
    super(html, css);
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
