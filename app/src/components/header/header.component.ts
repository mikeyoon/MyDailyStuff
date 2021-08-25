import { BaseComponent } from '../base.component.js';
import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { Observable } from '../../util/observable.js';

const css = await importCss(import.meta.url, 'header.component.css');
const html = await importHtml(import.meta.url, 'header.component.html');

export class HeaderComponent extends BaseComponent {
  constructor() {
    super(html, css);

    this.subscribe(authStore.propChanged$, (key) => {
      switch (key) {
        case 'isLoggedIn':
          this.digest();
          break;
      }
    });
  }

  get isLoggedIn(): boolean {
    return authStore.isLoggedIn;
  }
}
