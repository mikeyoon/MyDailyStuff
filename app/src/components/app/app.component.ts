import { importCssAndHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';
import { router } from '../router.js';

const [css, html] = await importCssAndHtml(import.meta.url, 'app.component');

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
