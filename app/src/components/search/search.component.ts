import { importCssAndHtml } from '../../loader.js';
import { BaseComponent } from '../base.component.js';

import { searchStore } from '../../stores/search.store.js';
import { toGoDateString, toLongDateString } from '../../util/date.js';

const [css, html] = await importCssAndHtml(import.meta.url, 'search.component');

export class SearchComponent extends BaseComponent {
  
  constructor() {
    super(html, css);

    this.subscribe(searchStore.propChanged$, (prop) => {
      switch (prop) {
        case 'searching':
        case 'searchResults':
        case 'searchError':
        case 'total':
        case 'offset':
          this.digest();
          break;
      }
    });
  }

  handlePageLink(offset: number, ev: MouseEvent) {
    if (offset == null) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  getShortDate(date: Date) {
    return toGoDateString(date);
  }

  getLongDate(date: Date) {
    return toLongDateString(date);
  }

  get nextOffset(): number | undefined { 
    return searchStore.nextOffset;
  }

  get prevOffset(): number | undefined { 
    return searchStore.prevOffset;
  }

  get offset(): number {
    return searchStore.offset;
  }

  get query(): string | null {
    return searchStore.query;
  }

  get searching(): boolean {
    return searchStore.searching;
  }

  get results() {
    return searchStore.searchResults;
  }

  get total() {
    return searchStore.total;
  }
}

customElements.define('mds-search', SearchComponent);
