import { importCss, importHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';
import { router } from '../router.js';

const css = await importCss(import.meta.url, 'app.component.css');
const html = await importHtml(import.meta.url, 'app.component.html');

export class AppComponent extends BaseComponent {
  constructor() {
    super(html, css);
    router.init(this.root);
  }

  connectedCallback() {
    super.connectedCallback();
    router.navigate(window.document.location.pathname + window.document.location.search, false);
  }
}
