import { AboutComponent } from './components/about/about.component.js';
import { HeaderComponent } from './components/header/header.component.js';
import { LoginComponent } from './components/login/login.component.js';
import { Router } from './components/router.js';
import { fetch } from './util/fetch.js';

customElements.define('mds-about', AboutComponent);
customElements.define('mds-header', HeaderComponent);
customElements.define('mds-login', LoginComponent);

const router = new Router('./');
await fetch('/csrf', {
  method: 'OPTIONS'
});

router.on('/login', { component: LoginComponent, title: 'Login' });
// router.on('/register', () => RegisterComponent);
// router.on('/forgot-password', () => ForgotPasswordComponent);
// router.on('/account/reset/:token', () => ForgotPasswordComponent);
// router.on('/account/verify/:token', () => ForgotPasswordComponent);
// router.on('/search/:query', () => SearchComponent);
// router.on('/search/:query/:offset', () => SearchComponent);

// router.on('/profile', () => ProfileComponent);
router.on('/about', { component: AboutComponent, title: 'About' });
// router.on('/journal', () => JournalComponent);
// router.on('/journal/:date', () => JournalComponent);

router.navigate(window.document.location.pathname + window.document.location.search, false);

document.body.addEventListener('click', (event) => {
  const target = event.composedPath()[0] as HTMLElement | undefined;
  if (target != null && target.tagName) {
    if (target.tagName === 'A') {
      const href =  target.getAttribute('href');
      if (target.getAttribute('target') !== '_blank' && href != null) {
        event.preventDefault();
        router.navigate(href);
      }
    }
  }
});

// class MyStore extends EventTarget {
//   constructor() {
//     super();
//   }

//   init() {
//     this.addEventListener('notify', );
//   }
// }

// customElements.define('app', )

