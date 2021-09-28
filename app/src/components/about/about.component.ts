import { importCss, importHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'about.component.css');
const html = await importHtml(import.meta.url, 'about.component.html');

export class AboutComponent extends BaseComponent {
  constructor() {
    super(html, css);
  }
}

customElements.define('mds-about', AboutComponent);
