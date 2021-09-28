import { BaseComponent } from '../base.component.js';
import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';

const css = await importCss(import.meta.url, 'streak.component.css');
const html = await importHtml(import.meta.url, 'streak.component.html');

export class StreakComponent extends BaseComponent {
  constructor() {
    super(html, css);

    this.subscribe(authStore.propChanged$, (prop) => {
      switch (prop) {
        case 'streakLoading':
        case 'streak':
          this.digest();
          break;
      }
    });
  }

  get streak() {
    return authStore.streak;
  }
}

customElements.define('mds-streak', StreakComponent);
