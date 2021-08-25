import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'forgot.component.css');
const html = await importHtml(import.meta.url, 'forgot.component.html');

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class ForgotComponent extends BaseComponent {
  static get observedAttributes() {
    return ['test'];
  }

  private emailTextbox!: HTMLInputElement;
  private forgotForm!: HTMLFormElement;

  private email = '';

  emailError = '';

  resetSuccess = false;
  resetError: string | undefined;

  constructor() {
    super(html, css);

    this.resetSuccess = authStore.resetSuccess;

    this.subscribe(authStore.propChanged$, (prop) => {
      switch (prop) {
        case 'resetSuccess':
          this.resetSuccess = authStore.resetSuccess;
          break;
        case 'resetError':
          this.resetError = authStore.resetError;
          break;
      }

      this.digest();
    });
  }

  connectedCallback() {
    super.connectedCallback();

    this.emailTextbox = this.root.querySelector('#email') as HTMLInputElement;
    this.forgotForm = this.root.querySelector('#login_form') as HTMLFormElement;

    this.emailTextbox.addEventListener('change', (ev) => {
      this.email = this.emailTextbox.value;
      this.emailError = '';
    });
    this.emailTextbox.addEventListener('blur', () => this.validateEmail());

    this.forgotForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (!this.resetError && !this.emailError) {
        if (!this.emailError) {
          authStore.requestReset(this.email);
        }
      }
    });
  }

  validateEmail() {
    if (!this.email) {
      this.emailError = "Email is required";
    } else if (!emailRegex.test(this.email)) {
      this.emailError = "Email is invalid";
    }

    if (this.emailError) {
      this.emailTextbox.setAttribute('class', 'form-control is-invalid');
    } else {
      this.emailTextbox.setAttribute('class', 'form-control');
    }

    this.digest();
  }
}
