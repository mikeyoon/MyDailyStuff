import * as Responses from "../models/responses";
import { SearchResult } from "../types";
import { journalStore, JournalStore } from "./journal.store.js";
import { BaseErrorResponse, fetch } from '../util/fetch.js';
import { Router, router } from "../components/router.js";
import { BaseStore } from "./base.store.js";

const LIMIT = 10;

interface StoreProps {
  searchError: string | undefined;
  searchResults: ReadonlyArray<SearchResult>;
  isoEntryDates: string[];

  lastQuery: string;
  searching: boolean;
  total: number | undefined;
  nextOffset: number | undefined;
  prevOffset: number | undefined;
  offset: number;
}

export class SearchStore extends BaseStore<StoreProps> {
  searchError: string | undefined;
  searchResults: ReadonlyArray<SearchResult>;
  isoEntryDates: string[];

  // get query() {
  //   return this.router.route === Routes.Search ? this.router.params.query : "";
  // }

  lastQuery = "";
  searching = false;
  total: number | undefined;
  nextOffset: number | undefined;
  prevOffset: number | undefined;
  offset: number;

  query: string | null = null;

  get monthYear() {
    return `${this.journal.currentDate.getFullYear()}-${this.journal.currentDate.getMonth() + 1}-1`;
  }

  constructor(private router: Router, private journal: JournalStore) {
    super();

    this.searchResults = [];
    this.isoEntryDates = [];
    this.offset = 0;

    router.activeRoute$.subscribe((active) => {
      if (active.route && active.route.startsWith('/search') && active.params.query) {
        this.query = active.params.query;
        this.search(parseInt(active.params.offset));
      }
    });

    // reaction(
    //   () => this.monthYear,
    //   () => {
    //     this.searchByMonth();
    //   },
    //   {
    //     fireImmediately: true
    //   }
    // );

    // reaction(
    //   () => this.journal.current,
    //   entry => {
    //     const date = readAsUtcDate(this.journal.localDate).toISOString();

    //     if (entry != null && entry.entries.length > 0) {
    //       if (this.isoEntryDates.indexOf(date) < 0) {
    //         this.isoEntryDates.push(date);
    //       }
    //     } else {
    //       const index = this.isoEntryDates.indexOf(date);
    //       if (index > 0) {
    //         this.isoEntryDates.splice(index, 1);
    //       }
    //     }
    //   }
    // );
  }

  clear() {
    this.total = 0;
    this.nextOffset = 0;
    this.prevOffset = 0;
    this.searchResults = [];
  }

  // async searchByMonth() {
  //   const response = await RestClient.get(
  //     `/search/date?start=${this.monthYear}`
  //   );
  //   runInAction(() => {
  //     if (response.entity.success) {
  //       this.isoEntryDates = response.entity.result.map((d: string) =>
  //         new Date(d).toISOString()
  //       );
  //     } else {
  //       this.searchError = response.entity.error;
  //     }
  //   });
  // }

  async search(offset: number) {
    if (!this.query) {
      return;
    }

    this.searching = true;
    this.notifyPropertyChanged('searching');

    try {
      const response = await fetch("/search", {
        method: 'POST',
        body: JSON.stringify({
          query: decodeURI(this.query),
          offset: offset,
          limit: LIMIT,
        })
      });

      if (response.ok) {
        const json = await response.json() as Responses.QuerySearchResult | BaseErrorResponse;
        if (json.success === true) {
          this.searchResults = json.result.map((r) => {
            // Dates for entries come back in UTC time. Need to make a local date.
            const utcDate = new Date(r.date);
            return {
              entries: r.entries,
              id: r.id,
              date: new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
            };
          });
          offset = offset || 0;

          this.total = json.total || 0;
          this.searching = false;
          this.nextOffset =
            offset + LIMIT < (this.total || 0) ? offset + LIMIT : undefined;
          this.prevOffset = offset > 0 ? offset - LIMIT : undefined;

          this.offset = offset;
        } else {
          this.searchError = json.error;
        }
      }      
    } catch (err) {
      this.nextOffset = undefined;
      this.prevOffset = undefined;
      this.searchResults = [];
    } finally {
      this.searching = false;
      this.notifyPropertyChanged('searching', 'nextOffset', 'offset', 'total', 'prevOffset', 'searchResults', 'searchError');
    }
  }
}

export const searchStore = new SearchStore(router, journalStore);
