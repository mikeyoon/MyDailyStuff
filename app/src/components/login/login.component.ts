import { importCssAndHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { BaseComponent } from '../base.component.js';

const [css, html] = await importCssAndHtml(import.meta.url, 'login.component');

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class LoginComponent extends BaseComponent {
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

  emailChanged(event: InputEvent) {
    this.email = (event.target as HTMLInputElement)?.value;
    this.emailError = '';
  }

  passwordChanged(event: InputEvent) {
    this.passwordError = '';
    this.password = (event.target as HTMLInputElement)?.value;
  }

  rememberChanged(event: InputEvent) {
    if (event.target != null) {
      this.persist = (event.target as HTMLInputElement).checked;
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

customElements.define('mds-login', LoginComponent);
