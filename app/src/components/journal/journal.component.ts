import { importCss, importHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';

const css = await importCss(import.meta.url, 'journal.component.css');
const html = await importHtml(import.meta.url, 'journal.component.html');

export class JournalComponent extends BaseComponent {
  entries: string[];
  invalid = true;
  newEntryError = 'asdf';

  localDate = new Date();

  constructor() {
    super(html, css);

    this.entries = [];
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

  handlePrev(event: PointerEvent) {
    this.localDate.setDate(this.localDate.getDate() - 1);
    this.digest();
  }

  handleNext(event: PointerEvent) {
    this.localDate.setDate(this.localDate.getDate() + 1);
    this.digest();
  }

  updateEntryText(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log(input.value);
  }
}
