import { importCssAndHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';

const [css, html] = await importCssAndHtml(import.meta.url, 'about.component');

export class AboutComponent extends BaseComponent {
  constructor() {
    super(html, css);
  }
}

customElements.define('mds-about', AboutComponent);
