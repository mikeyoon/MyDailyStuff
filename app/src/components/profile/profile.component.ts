import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'profile.component.css');
const html = await importHtml(import.meta.url, 'profile.component.html');

export class ProfileComponent extends BaseComponent {
  private emailTextbox!: HTMLInputElement;
  
  private confirm = '';
  private password = '';
  private email = '';

  passwordError = '';
  confirmError = '';

  constructor() {
    super(html, css);

    this.subscribe(authStore.propChanged$, (prop) => {
      switch (prop) {
        case 'saved':
        case 'saveError':
          this.digest();
          break;
      }
    });
  }

  get saved() {
    return authStore.saved;
  }

  get profileError() {
    return authStore.saveError;
  }

  connectedCallback() {
    super.connectedCallback();

    this.emailTextbox = this.root.querySelector('#email') as HTMLInputElement;
    this.emailTextbox.value = authStore.email || '';  
  }

  passwordChanged(ev: Event) {
    this.password = (ev.target as HTMLInputElement)?.value;
  }

  confirmChanged(ev: Event) {
    this.confirm = (ev.target as HTMLInputElement)?.value;
  }

  passwordFocused() {
    this.passwordError = '';
    this.confirmError = '';
    this.digest();
  }

  confirmFocused() {
    this.confirmError = '';
    this.digest();
  }

  validatePassword() {
    if (!this.password || this.password.length < 6) {
      this.passwordError = "Password needs to be 6 or more characters";
    } else if (this.password && this.password.length > 50) {
      this.passwordError = "Password needs to be less than 50 characters";
    }

    if (this.password !== this.confirm) {
      this.confirmError = "Passwords do not match";
    }

    this.digest();
  }

  updateProfile(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();

    if (!this.profileError && !this.passwordError) {
      authStore.updateProfile(this.password);
      (ev.target as HTMLFormElement)?.reset();
    }
  }
}

customElements.define('mds-profile', ProfileComponent);
