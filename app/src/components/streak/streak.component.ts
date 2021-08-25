import { BaseComponent } from '../base.component.js';
import { importCss, importHtml } from '../../loader.js';

const css = await importCss(import.meta.url, 'streak.component.css');
const html = await importHtml(import.meta.url, 'streak.component.html');

export class StreakComponent extends BaseComponent {
  static get observedAttributes() {
    return ['streak'];
  }

  streak = 0;

  constructor() {
    super(html, css);
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (name === 'streak') {
      this.streak = Number.parseInt(newValue);
      this.digest();
    }
  }
}
