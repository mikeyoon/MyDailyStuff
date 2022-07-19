import { importCssAndHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';

import { journalStore } from '../../stores/journal.store.js';
import { router } from '../router.js';
import { toGoDateString } from '../../util/date-format.js';

import '../streak/streak.component.js';
import './entry.component.js';

const [css, html] = await importCssAndHtml(import.meta.url, 'journal.component');

export class JournalComponent extends BaseComponent {
  invalid = true;

  newEntry: string = '';

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

  get showNext(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return journalStore.utcDate < today;
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
    return journalStore.utcDate.toLocaleDateString('en-us', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'utc'
    });
  }

  get isFull() {
    return this.entries.length >= 7;
  }

  addEntry(event: Event) {
    event.preventDefault();

    const submitForm = this.root.querySelector('form') as HTMLFormElement;
    if (journalStore.current != null) {
      journalStore.edit({
        entry: this.newEntry,
        index: this.entries.length
      }).then(() => {
        if (!journalStore.error) {
          this.newEntry = '';
          submitForm.reset();
          this.digest();
        }
      });
    } else {
      journalStore.add(this.newEntry).then(() => {
        if (!journalStore.error) {
          this.newEntry = '';
          submitForm.reset();
          this.digest();
        }
      });
    }
  }

  entryKeypress(event: KeyboardEvent) {
    if (event.ctrlKey && event.code === 'Enter' && this.newEntry) {
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
    const newDate = new Date(journalStore.utcDate);
    newDate.setDate(journalStore.utcDate.getDate() - 1);
    router.navigate('/journal/' + toGoDateString(newDate));
    this.digest();
  }

  handleNext(event: PointerEvent) {
    const newDate = new Date(journalStore.utcDate);
    newDate.setDate(journalStore.utcDate.getDate() + 1);
    router.navigate('/journal/' + toGoDateString(newDate));
    this.digest();
  }
}

customElements.define('mds-journal', JournalComponent);
