import { BaseComponent } from '../base.component.js';
import { importCssAndHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';

const [css, html] = await importCssAndHtml(import.meta.url, 'streak.component');

export class StreakComponent extends BaseComponent {
  constructor() {
    super(html, css);
  }

  get streak() {
    return authStore.streak;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.subscribe(authStore.propChanged$, (prop) => {
      switch (prop) {
        case 'streakLoading':
        case 'streak':
          this.digest();
          break;
      }
    });
  }
}

customElements.define('mds-streak', StreakComponent);
