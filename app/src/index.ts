import { AppComponent } from './components/app/app.component.js';
import { AboutComponent } from './components/about/about.component.js';
import { HeaderComponent } from './components/header/header.component.js';
import { LoginComponent } from './components/login/login.component.js';
import { RegisterComponent } from './components/register/register.component.js';
import { router } from './components/router.js';
import { fetch } from './util/fetch.js';

customElements.define('mds-about', AboutComponent);
customElements.define('mds-header', HeaderComponent);
customElements.define('mds-login', LoginComponent);
customElements.define('mds-register', RegisterComponent);

router.on('/login', { component: LoginComponent, title: 'Login' });
router.on('/register', { component: RegisterComponent, title: 'Register' });
// router.on('/forgot-password', () => ForgotPasswordComponent);
// router.on('/account/reset/:token', () => ForgotPasswordComponent);
// router.on('/account/verify/:token', () => ForgotPasswordComponent);
// router.on('/search/:query', () => SearchComponent);
// router.on('/search/:query/:offset', () => SearchComponent);

// router.on('/profile', () => ProfileComponent);
router.on('/about', { component: AboutComponent, title: 'About' });
// router.on('/journal', () => JournalComponent);
// router.on('/journal/:date', () => JournalComponent);

customElements.define('mds-main', AppComponent)

await fetch('/csrf', {
  method: 'OPTIONS'
});

document.body.addEventListener('click', (event) => {
  const target = event.composedPath()[0] as HTMLElement | undefined;
  if (target != null && target.tagName) {
    if (target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (target.getAttribute('target') !== '_blank' && href != null) {
        event.preventDefault();
        router.navigate(href);
      }
    }
  }
});
