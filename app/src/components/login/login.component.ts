import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'login.component.css');
const html = await importHtml(import.meta.url, 'login.component.html');

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class LoginComponent extends BaseComponent {
  private emailTextbox!: HTMLInputElement;
  private passwordTextbox!: HTMLInputElement;
  private rememberCheckbox!: HTMLInputElement;
  private loginForm!: HTMLFormElement;

  private persist = false;
  private password = '';
  private email = '';

  passwordError = '';
  emailError = '';

  constructor() {
    super(html, css);

    this.subscribe(authStore.propChanged$, (prop) => {
      switch (prop) {
        case 'isLoggedIn':
        case 'loginError':
          this.digest();
          break;
      }
    });
  }

  get isLoggedIn() {
    return authStore.isLoggedIn;
  }

  get loginError() {
    return authStore.loginError;
  }

  connectedCallback() {
    super.connectedCallback();

    this.emailTextbox = this.root.querySelector('#email') as HTMLInputElement;
    this.passwordTextbox = this.root.querySelector('#password') as HTMLInputElement;
    this.rememberCheckbox = this.root.querySelector('#rememberMe') as HTMLInputElement;
    this.loginForm = this.root.querySelector('#login_form') as HTMLFormElement;

    this.emailTextbox.addEventListener('blur', () => this.validateEmail());
    this.passwordTextbox.addEventListener('blur', () => this.validatePassword());
  }

  emailChanged(event: InputEvent) {
    this.email = this.emailTextbox.value;
    this.emailError = '';
  }

  passwordChanged(event: InputEvent) {
    this.passwordError = '';
    this.password = this.passwordTextbox.value;
  }

  rememberChanged(event: InputEvent) {
    if (event.target != null) {
      this.persist = this.rememberCheckbox.checked;
    }
  }

  login(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();

    this.validateEmail();
    this.validatePassword();

    if (!this.emailError && !this.passwordError) {
      authStore.login({
        email: this.email,
        password: this.password,
        persist: this.persist,
      });
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

  validatePassword() {
    if (!this.password || this.password.length < 6) {
      this.passwordError = "Password needs to be 6 or more characters";
    } else if (this.password && this.password.length > 50) {
      this.passwordError = "Password needs to be less than 50 characters";
    }

    this.digest();
  }
}
