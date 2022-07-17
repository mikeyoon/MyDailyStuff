import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'forgot.component.css');
const html = await importHtml(import.meta.url, 'forgot.component.html');

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class ForgotComponent extends BaseComponent {
  private email = '';
  emailError = '';

  constructor() {
    super(html, css);

    this.subscribe(authStore.propChanged$, (prop) => {
      switch (prop) {
        case 'resetSuccess':
        case 'resetError':
          this.digest();
          break;
      }
    });
  }

  get resetSuccess() {
    return authStore.resetSuccess;
  }

  get resetError() {
    return authStore.resetError;
  }

  emailChanged(event: Event) {
    this.email = (event.target as HTMLInputElement)?.value;
    this.emailError = '';
  }

  forgotPassword(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();

    if (!this.resetError && !this.emailError) {
      if (!this.emailError) {
        authStore.requestReset(this.email);
      }
    }
  }

  validateEmail() {
    if (!this.email) {
      this.emailError = "Email is required";
    } else if (!emailRegex.test(this.email)) {
      this.emailError = "Email is invalid";
    }

    this.digest();
  }
}

customElements.define('mds-forgot', ForgotComponent);
