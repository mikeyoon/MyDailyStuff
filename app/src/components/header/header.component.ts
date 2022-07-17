import { BaseComponent } from '../base.component.js';
import { importCss, importHtml } from '../../loader.js';
import { authStore } from '../../stores/auth.store.js';
import { isDescendent } from '../../util/dom.js';

const css = await importCss(import.meta.url, 'header.component.css');
const html = await importHtml(import.meta.url, 'header.component.html');

export class HeaderComponent extends BaseComponent {
  isDropdownOpen = false;
  showCollapsedMenu = false;

  constructor() {
    super(html, css);

    this.subscribe(authStore.propChanged$, (key) => {
      switch (key) {
        case 'isLoggedIn':
        case 'email':
          this.digest();
          break;
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();

    document.body.addEventListener('click', (event) => {
      const dropdown = this.root.querySelector('.dropdown') as HTMLElement;
      const target = event.composedPath()[0] as HTMLElement | undefined;
      if (target != null && target != dropdown && !isDescendent(dropdown, target)) {
        this.isDropdownOpen = false;
        this.digest();
      }
    });
  }

  toggleCollapsedMenu() {
    this.showCollapsedMenu = !this.showCollapsedMenu;
    this.digest();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.digest();
  }

  logout(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    authStore.logout();
  }

  get email(): string | undefined {
    return authStore.email;
  }

  get isLoggedIn(): boolean {
    return authStore.isLoggedIn;
  }
}
