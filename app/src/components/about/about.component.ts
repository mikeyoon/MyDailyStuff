import { importCss, importHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'about.component.css');
const html = await importHtml(import.meta.url, 'about.component.html');

export class AboutComponent extends BaseComponent {
  static get observedAttributes() {
    return ['test'];
  }

  constructor() {
    super(html, css);
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    switch (name) {
      case 'test':
        const element = this.querySelector('.test');
        if (element != null) {
          element.textContent = newValue;
        }
        break;
    }
  }
}
