import { importHtml } from '../../loader.js';
import { ChildComponent } from '../base.component.js';

// const css = await importCss(import.meta.url, 'journal.component.css');
const html = await importHtml(import.meta.url, 'entry.component.html');

export class EntryComponent extends ChildComponent {
  static get observedAttributes() {
    return ['entry'];
  }
  constructor(context: any) {
    super(context, html);
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
