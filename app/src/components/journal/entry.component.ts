import { importCssAndHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';
import { toHtml } from '../../util/markdown.js';

const [css, html] = await importCssAndHtml(import.meta.url, 'entry.component');

import { journalStore } from '../../stores/journal.store.js';

export class EntryComponent extends BaseComponent {
  static get observedAttributes() {
    return ['let-entry'];
  }

  constructor() {
    super(html, css);
  }

  entryHtml: string | undefined;
  index: number | undefined;

  connectedCallback(): void {
    this.entryHtml = toHtml(this.bindings[this.getAttribute('let-entry') || ''] as string);
    this.index = parseInt(this.getAttribute('data-index') || '0');
    super.connectedCallback();
  }

  get entries(): string[] {
    return journalStore.current?.entries || [];
  }

  deleteEntry(event: Event) {
    if (this.entries.length > 1) {
      journalStore.edit({
        index: this.index || 0,
        entry: null
      });
    } else {
      journalStore.delete();
    }
  }
}

customElements.define('mds-entry', EntryComponent);
