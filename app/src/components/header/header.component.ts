import { BaseComponent } from '../base.component.js';
import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { Observable } from '../../util/observable.js';

const css = await importCss(import.meta.url, 'header.component.css');
const html = await importHtml(import.meta.url, 'header.component.html');

export class HeaderComponent extends BaseComponent {
  propSubscription: ReturnType<Observable<any>['subscribe']>;

  static get observedAttributes() {
    return ['test'];
  }

  constructor() {
    super(html, css);

    this.propSubscription = authStore.propChanged$.subscribe((key) => {
      switch (key) {
        case 'isLoggedIn':
          this.digest();
          break;
      }
    });
  }

  disconnectedCallback() {
    this.propSubscription?.();
  }

  get isLoggedIn(): boolean {
    return authStore.isLoggedIn;
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
