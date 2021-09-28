import * as Responses from "../models/responses";
import { RestClient } from "./client";
import { SearchResult } from "../types";
import { journalStore, JournalStore } from "./journal.store";
import { readAsUtcMonth, readAsUtcDate } from "../date.util";
import { Router, router } from "../components/router";
import { BaseStore } from "./base.store";
import { BaseResponse } from "../util/fetch";

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

  private query: string;

  get monthYear() {
    return `${this.journal.localDate.getFullYear()}-${this.journal.localDate.getMonth() + 1}-1`;
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
    this.searching = true;
    this.notifyPropertyChanged('searching');

    try {
      const response = await fetch("/search", {
        method: 'POST',
        body: JSON.stringify({
          query: this.query,
          offset: offset,
          limit: LIMIT,
        })
      });

      if (response.ok) {
        const json = await response.json() as BaseResponse<Responses.QuerySearchResult>;
        if (json.success === true) {
          this.searchResults = json.result.entries.map((r) => ({
            entries: r.entries,
            id: r.id,
            date: r.date
          }));
          offset = offset || 0;

          this.total = json.result.total || 0;
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
