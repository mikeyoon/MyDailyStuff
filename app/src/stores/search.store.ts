import {
  action,
  computed,
  observable,
  runInAction,
  autorun,
  reaction,
  when
} from "mobx";
import moment from "moment";
import * as Requests from "../models/requests";
import * as Responses from "../models/responses";
import { RestClient } from "./client";
import { SearchResult } from "../types";
import { RouteStore, Routes } from "./route.store";
import { JournalStore } from "./journal.store";

const LIMIT = 10;

export class SearchStore {
  @observable
  searchError: string | undefined;
  @observable
  searchResults: ReadonlyArray<SearchResult>;
  @observable
  isoEntryDates: string[];
  @computed
  get query() {
    return this.router.route === Routes.Search ? this.router.params.query : "";
  }
  @observable
  lastQuery = "";
  @observable
  searching = false;
  @observable
  total: number | undefined;
  @observable
  nextOffset: number | undefined;
  @observable
  prevOffset: number | undefined;
  @observable
  offset: number;

  @computed
  get monthYear() {
    return `${this.journal.localDate.getMonth() +
      1}/1/${this.journal.localDate.getFullYear()}`;
  }

  constructor(private router: RouteStore, private journal: JournalStore) {
    this.searchResults = [];
    this.isoEntryDates = [];
    this.offset = 0;

    reaction(
      () => router.params,
      params => {
        if (router.route === Routes.Search && params.query) {
          this.search(parseInt(params.offset));
        }
      }
    );

    reaction(
      () => this.monthYear,
      () => {
        this.searchByMonth();
      },
      {
        fireImmediately: true
      }
    );

    reaction(
      () => this.journal.current,
      entry => {
        const date = new Date(
          Date.UTC(
            this.journal.localDate.getFullYear(),
            this.journal.localDate.getMonth(),
            this.journal.localDate.getDate()
          )
        ).toISOString();

        if (entry != null && entry.entries.length > 0) {
          if (this.isoEntryDates.indexOf(date) < 0) {
            this.isoEntryDates.push(date);
          }
        } else {
          const index = this.isoEntryDates.indexOf(date);
          if (index > 0) {
            this.isoEntryDates.splice(index, 1);
          }
        }
      }
    );
  }

  @action
  clear() {
    this.total = 0;
    this.nextOffset = 0;
    this.prevOffset = 0;
    this.searchResults = [];
  }

  @action
  async searchByMonth() {
    const response = await RestClient.get(
      `/search/date?start=${this.monthYear}`
    );
    runInAction(() => {
      if (response.entity.success) {
        this.isoEntryDates = response.entity.result.map((d: string) =>
          new Date(d).toISOString()
        );
      } else {
        this.searchError = response.entity.error;
      }
    });
  }

  @action
  async search(offset: number) {
    this.searching = true;

    try {
      const response = await RestClient.post("/search/", {
        query: this.query,
        offset: offset,
        limit: LIMIT
      });
      if (response.entity.success) {
        runInAction(() => {
          this.searchResults = response.entity.result.map(
            (r: Responses.JournalEntry) => ({
              entries: r.entries,
              id: r.id,
              date: r.date
            })
          );
          offset = offset || 0;

          this.total = response.entity.total || 0;
          this.searching = false;
          this.nextOffset =
            offset + LIMIT < (this.total || 0) ? offset + LIMIT : undefined;
          this.prevOffset = offset > 0 ? offset - LIMIT : undefined;

          this.offset = offset;
        });
      }
    } catch (err) {
      runInAction(() => {
        this.nextOffset = undefined;
        this.prevOffset = undefined;
        this.searchResults = [];
      });
    } finally {
      runInAction(() => (this.searching = false));
    }
  }
}
