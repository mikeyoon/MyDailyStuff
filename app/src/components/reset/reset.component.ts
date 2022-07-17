import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { BaseComponent } from '../base.component.js';
import { router } from '../router.js';

const css = await importCss(import.meta.url, 'reset.component.css');
const html = await importHtml(import.meta.url, 'reset.component.html');

export class ResetComponent extends BaseComponent {
  private passwordTextbox!: HTMLInputElement;
  private confirmTextbox!: HTMLInputElement;
  private resetForm!: HTMLFormElement;

  private confirm = '';
  private password = '';

  passwordError = '';
  confirmError = '';
  resetToken: string | undefined;

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

    this.subscribe(router.activeRoute$, (params) => {
      //this.resetToken = params?.params;
    })
  }

  get resetSuccess() {
    return authStore.resetSuccess;
  }

  get resetError() {
    return authStore.resetError;
  }

  connectedCallback() {
    super.connectedCallback();

    this.passwordTextbox = this.root.querySelector('#password') as HTMLInputElement;
    this.confirmTextbox = this.root.querySelector('#confirm') as HTMLInputElement;
    this.resetForm = this.root.querySelector('#register_form') as HTMLFormElement;

    this.passwordTextbox.addEventListener('change', (ev) => {
      this.passwordError = '';
      this.password = this.passwordTextbox.value;
    });
    this.passwordTextbox.addEventListener('blur', () => this.validatePassword());

    this.confirmTextbox.addEventListener('change', (ev) => {
      this.confirm = this.confirmTextbox.value;
      this.confirmError = '';
    });
    this.confirmTextbox.addEventListener('blur', () => this.validatePassword());
    this.confirmTextbox.addEventListener('focus', () => {
      this.confirmError = '';
      this.confirmTextbox.setAttribute('class', 'form-control');
      this.digest();
    });

    this.resetForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (!this.passwordError && !this.confirmError && this.resetToken) {
        authStore.resetPassword({
          token: this.resetToken,
          password: this.password
        });
      }
    });
  }

  validatePassword() {
    if (!this.password || this.password.length < 6) {
      this.passwordError = "Password needs to be 6 or more characters";
    } else if (this.password && this.password.length > 50) {
      this.passwordError = "Password needs to be less than 50 characters";
    }

    if (this.passwordError) {
      this.passwordTextbox.setAttribute('class', 'form-control is-invalid');
    } else {
      this.passwordTextbox.setAttribute('class', 'form-control');
    }

    if (!this.passwordError && this.password !== this.confirm) {
      this.confirmError = "Passwords must match";
    }

    if (this.confirmError) {
      this.confirmTextbox.setAttribute('class', 'form-control is-invalid');
    } else {
      this.confirmTextbox.setAttribute('class', 'form-control');
    }

    this.digest();
  }
}

customElements.define('mds-reset', ResetComponent);
