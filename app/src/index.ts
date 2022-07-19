/// <reference path="override.d.ts" />

import { AppComponent } from './components/app/app.component.js';
import { HeaderComponent } from './components/header/header.component.js';
import { router } from './components/router.js';
import { authStore } from './stores/auth.store.js';

customElements.define('mds-header', HeaderComponent);

router.on('/login', { lazyLoader: () => import('./components/login/login.component.js').then((m) => m.LoginComponent), title: 'Login' });
router.on('/register', { lazyLoader: () => import('./components/register/register.component.js').then((m) => m.RegisterComponent), title: 'Register' });
router.on('/forgot-password', { lazyLoader: () => import('./components/forgot/forgot.component.js').then((m) => m.ForgotComponent), title: 'Reset Password' });
router.on('/account/reset/:token', { lazyLoader: () => import('./components/reset/reset.component.js').then((m) => m.ResetComponent), title: 'Reset Password' });
router.on('/account/verify/:token', {
  canActivate: (params) => {
    return authStore.verify(params.token).then(() => false);
  }
});
router.on('/search/:query/:offset', { lazyLoader: () => import('./components/search/search.component.js').then((m) => m.SearchComponent), title: 'Search' });
router.on('/search/:query', { lazyLoader: () => import('./components/search/search.component.js').then((m) => m.SearchComponent), title: 'Search' });

router.on('/profile', {
  lazyLoader: () => import('./components/profile/profile.component.js').then((m) => m.ProfileComponent),
  title: 'Update Password',
  canActivate: (params) => {
    return authStore.isLoggedIn;
  }
});
router.on('/about', { lazyLoader: () => import('./components/about/about.component.js').then((m) => m.AboutComponent), title: 'About' });
router.on('/journal/:date', {
  lazyLoader: () => import('./components/journal/journal.component.js').then((m) => m.JournalComponent),
  title: '',
  canActivate: (params) => {
    return authStore.isLoggedIn;
  }
});
router.on('/journal', {
  lazyLoader: () => import('./components/journal/journal.component.js').then((m) => m.JournalComponent),
  title: '',
  canActivate: (params) => {
    return authStore.isLoggedIn;
  }
});

customElements.define('mds-main', AppComponent)

authStore.getAccount();

// Hijack anchor tags
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
