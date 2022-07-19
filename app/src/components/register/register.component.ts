import { importCssAndHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { BaseComponent } from '../base.component.js';

const [css, html] = await importCssAndHtml(import.meta.url, 'register.component');

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class RegisterComponent extends BaseComponent {
  private emailTextbox!: HTMLInputElement;
  private passwordTextbox!: HTMLInputElement;
  private confirmTextbox!: HTMLInputElement;
  private registerForm!: HTMLFormElement;

  private confirm = '';
  private password = '';
  private email = '';

  passwordError = '';
  confirmError = '';
  emailError = '';

  constructor() {
    super(html, css);

    this.subscribe(authStore.propChanged$, (prop) => {
      switch (prop) {
        case 'registered':
        case 'registerError':
          this.digest();
          break;
      }
    });
  }

  get registered() {
    return authStore.registered;
  }

  get registerError() {
    return authStore.registerError;
  }

  connectedCallback() {
    super.connectedCallback();

    this.emailTextbox = this.root.querySelector('#email') as HTMLInputElement;
    this.passwordTextbox = this.root.querySelector('#password') as HTMLInputElement;
    this.confirmTextbox = this.root.querySelector('#confirm') as HTMLInputElement;
    this.registerForm = this.root.querySelector('#register_form') as HTMLFormElement;
  }

  emailChanged(event: InputEvent) {
    this.email = this.emailTextbox.value;
    this.emailError = '';
  }

  emailBlurred(event: Event) {
    this.validateEmail();
  }

  passwordChanged(event: InputEvent) {
    this.passwordError = '';
    this.password = this.passwordTextbox.value;
  }

  passwordBlurred(event: Event) {
    this.validatePassword();
  }

  confirmChanged(event: InputEvent) {
    this.confirm = this.confirmTextbox.value;
    this.confirmError = '';
  }

  confirmBlurred(event: Event) {
    this.validatePassword();
  }

  confirmFocused(event: Event) {
    this.confirmError = '';
    this.confirmTextbox.setAttribute('class', 'form-control');
    this.digest();
  }

  register(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();

    this.validateEmail();
    this.validatePassword();

    if (!this.emailError && !this.passwordError && !this.confirmError) {
      authStore.register({
        email: this.email,
        password: this.password,
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

    if (!this.passwordError && this.password !== this.confirm) {
      this.confirmError = "Passwords must match";
    }

    this.digest();
  }
}

customElements.define('mds-register', RegisterComponent);
