import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'profile.component.css');
const html = await importHtml(import.meta.url, 'profile.component.html');

export class ProfileComponent extends BaseComponent {
  private emailTextbox!: HTMLInputElement;
  private passwordTextbox!: HTMLInputElement;
  private confirmTextbox!: HTMLInputElement;
  private profileForm!: HTMLFormElement;

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
    this.passwordTextbox = this.root.querySelector('#password') as HTMLInputElement;
    this.confirmTextbox = this.root.querySelector('#confirm') as HTMLInputElement;
    this.profileForm = this.root.querySelector('#profile_form') as HTMLFormElement;

    this.emailTextbox.value = authStore.email || '';

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

    this.profileForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (!this.profileError && !this.passwordError) {
        authStore.updateProfile(this.password);
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

    this.digest();
  }
}
