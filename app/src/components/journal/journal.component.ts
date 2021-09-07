import { CompiledElement, compileFragment } from '../../util/compiler.js';
import { importCss, importHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';
import { toHtml } from '../../util/markdown.js';

import { journalStore } from '../../stores/journal.store.js';
import { router } from '../router.js';
import { toGoDateString } from '../../util/date-format.js';

const css = await importCss(import.meta.url, 'journal.component.css');
const html = await importHtml(import.meta.url, 'journal.component.html');

const ENTRY_TEMPLATE =  `
<div class="journal mt-4">
  <div class="card">
      <button
          class="btn btn-outline-secondary btn-sm btn-journal-delete"
          [click]="this.deleteEntry(this.index, event)"
      >
      x
      </button>
      <div class="card-body journal-entry" [content]="this.entry"></div>
  </div>
</div>`;

// customElements.define('mds-entry', EntryComponent);

export class JournalComponent extends BaseComponent {
  invalid = true;

  submitForm!: HTMLFormElement;
  newEntry: string = '';
  compiledEntries: CompiledElement[] = [];
  entriesContainer!: HTMLElement;

  constructor() {
    super(html, css);

    this.subscribe(journalStore.propChanged$, (prop) => {
      switch (prop) {
        case 'current':
          this.compileEntries();
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
    return journalStore.localDate.toLocaleDateString('en-us', {
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
    this.entriesContainer = this.root.querySelector('#entries') as HTMLElement;
    this.submitForm = this.root.querySelector('form') as HTMLFormElement;
  }

  digest() {
    super.digest();
    this.compiledEntries.forEach((compiled, index) => {
      compiled.digest({
        deleteEntry: this.deleteEntry.bind(this),
        entry: toHtml(this.entries[index]),
        index
      });
    });
  }

  compileEntries() {
    this.compiledEntries = [];
    const children: Node[] = [];

    this.entries.forEach((entry) => {
      const fragment = this.ownerDocument.createElement('template');
      fragment.innerHTML = ENTRY_TEMPLATE;

      //this.appendChild(fragment.content);
      children.push(fragment.content);
      const compiled = compileFragment(fragment.content, this.root.host);
      this.compiledEntries.push(compiled);
    });

    this.entriesContainer.replaceChildren(...children);
  }

  addEntry(event: Event) {
    event.preventDefault();
    if (journalStore.current != null) {
      journalStore.edit({
        entry: this.newEntry,
        index: this.entries.length
      }).then(() => {
        if (!journalStore.error) {
          this.newEntry = '';
          this.submitForm.reset();
        }
      });
    } else {
      journalStore.add(this.newEntry).then(() => {
        if (!journalStore.error) {
          this.newEntry = '';
          this.submitForm.reset();
        }
      });
    }
  }

  deleteEntry(index: number, event: Event) {
    if (this.entries.length > 1) {
      journalStore.edit({
        index,
        entry: null
      });
    } else {
      journalStore.delete();
    }
  }

  entryKeypress(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      this.addEntry(event);
    }
  }

  entryChanged(event: Event) {
    if (event.target instanceof HTMLTextAreaElement) {
      this.newEntry = event.target.value;
      this.invalid = this.newEntry.length > 500 || this.newEntry.length === 0;
      this.digest();
    }
  }

  handlePrev(event: PointerEvent) {
    const newDate = new Date(journalStore.localDate);
    newDate.setDate(journalStore.localDate.getDate() - 1);
    router.navigate('/journal/' + toGoDateString(newDate));
    this.digest();
  }

  handleNext(event: PointerEvent) {
    const newDate = new Date(journalStore.localDate);
    newDate.setDate(journalStore.localDate.getDate() + 1);
    router.navigate('/journal/' + toGoDateString(newDate));
    this.digest();
  }
}
