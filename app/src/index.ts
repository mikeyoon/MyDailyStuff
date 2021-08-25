import { AppComponent } from './components/app/app.component.js';
import { AboutComponent } from './components/about/about.component.js';
import { ForgotComponent } from './components/forgot/forgot.component.js';
import { HeaderComponent } from './components/header/header.component.js';
import { LoginComponent } from './components/login/login.component.js';
import { ProfileComponent } from './components/profile/profile.component.js';
import { RegisterComponent } from './components/register/register.component.js';
import { ResetComponent } from './components/reset/reset.component.js';
import { StreakComponent } from './components/streak/streak.component.js';
import { router } from './components/router.js';
import { fetch } from './util/fetch.js';
import { authStore } from './stores/auth.store.js';

customElements.define('mds-about', AboutComponent);
customElements.define('mds-header', HeaderComponent);
customElements.define('mds-login', LoginComponent);
customElements.define('mds-register', RegisterComponent);
customElements.define('mds-profile', ProfileComponent);
customElements.define('mds-forgot', ForgotComponent);
customElements.define('mds-reset', ResetComponent);
customElements.define('mds-streak', StreakComponent);

router.on('/login', { component: LoginComponent, title: 'Login' });
router.on('/register', { component: RegisterComponent, title: 'Register' });
router.on('/forgot-password', { component: ForgotComponent, title: 'Reset Password' });
router.on('/account/reset/:token', { component: ResetComponent, title: 'Reset Password' });
router.on('/account/verify/:token', { 
  component: LoginComponent,
  canActivate: (params) => {
    return authStore.verify(params.token).then(() => false);
  }
});
// router.on('/search/:query', () => SearchComponent);
// router.on('/search/:query/:offset', () => SearchComponent);

router.on('/profile', { component: ProfileComponent, title: 'Update Password' });
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
