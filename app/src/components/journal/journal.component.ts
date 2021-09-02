import { compileFragment } from '../../util/compiler.js';
import { importCss, importHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';

import { journalStore } from '../../stores/journal.store.js';
import { router } from '../router.js';
import { toGoDateString } from '../../util/date-format.js';

const css = await importCss(import.meta.url, 'journal.component.css');
const html = await importHtml(import.meta.url, 'journal.component.html');

const ENTRY_TEMPLATE =  `
<div className="journal mt-4">
  <div className="card" key={index}>
      <button
          class="btn btn-outline-secondary btn-sm btn-journal-delete"
          key="delete"
          [click]="deleteEntry(event)"
      >
      x
      </button>
      <div class="card-body journal-entry"></div>
  </div>
</div>`;

export class JournalComponent extends BaseComponent {
  invalid = true;

  localDate = new Date();
  entry: string = '';

  constructor() {
    super(html, css);

    this.subscribe(journalStore.propChanged$, (prop) => {
      switch (prop) {
        case 'current':
        case 'error':
        case 'editing':
        case 'loading':
        case 'adding':
          this.digest();
          break;
      }
    });
  }

  get entries(): string[] {
    return journalStore.current?.entries || [];
  }

  get newEntryError() {
    return journalStore.error;
  }

  get editing() {
    return journalStore.editing;
  }

  get loading() {
    return journalStore.loading;
  }

  get adding() {
    return journalStore.adding;
  }

  get fullDate(): string {
    return this.localDate.toLocaleDateString('en-us', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }

  get isFull() {
    return this.entries.length >= 7;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!journalStore.started) {
      journalStore.get(this.localDate);
    }
    const fragment = this.ownerDocument.createElement('template');
    fragment.innerHTML = ENTRY_TEMPLATE;

    compileFragment(fragment.content, this);
  }

  addEntry(event: Event) {
    event.preventDefault();
    if (journalStore.current != null) {
      journalStore.edit({
        entry: this.entry,
        index: this.entries.length
      });
    } else {
      journalStore.add(this.entry);
    }
  }

  entryKeypress(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      this.addEntry(event);
    }
  }

  entryChanged(event: Event) {
    if (event.target instanceof HTMLTextAreaElement) {
      this.entry = event.target.value;
      this.invalid = this.entry.length > 500 || this.entry.length === 0;
      this.digest();
    }
  }

  handlePrev(event: PointerEvent) {
    this.localDate.setDate(this.localDate.getDate() - 1);
    router.navigate('/journal/' + toGoDateString(this.localDate));
    this.digest();
  }

  handleNext(event: PointerEvent) {
    this.localDate.setDate(this.localDate.getDate() + 1);
    router.navigate('/journal/' + toGoDateString(this.localDate));
    this.digest();
  }
}
