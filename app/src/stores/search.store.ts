import { action, computed, observable, runInAction, autorun, reaction, when } from "mobx";
import moment from "moment";
import * as Requests from "../models/requests";
import * as Responses from "../models/responses";
import { RestClient } from "./client";
import { SearchResult } from "../types";
import { RouteStore, Routes } from "./route.store";

const LIMIT = 10;

export class SearchStore {
  @observable
  searchError: string | undefined;
  @observable
  searchResults: ReadonlyArray<SearchResult>;
  @observable
  dates: any[];
  @computed
  get query() { return this.router.route === Routes.Search ? this.router.params.query : ''; }
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
  @computed
  get offset() { return this.router.route === Routes.Search ? parseInt(this.router.params.offset) : 0; }
  @observable
  month: number | undefined;
  @observable
  year: number | undefined;

  @computed
  get monthYear() {
    return this.month + "-" + this.year;
  }

  constructor(private router: RouteStore) {
    this.searchResults = [];
    this.dates = [];
    
    reaction(() => router.route === Routes.Search && router.params, params => {
      if (params) {
        this.search();
      }
    });
  }

  @action
  clear() {
    this.total = 0;
    this.nextOffset = 0;
    this.prevOffset = 0;
    this.searchResults = [];
  }

  @action
  async searchByMonth(date: Date) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    if (this.month !== month || this.year !== year) {
      const response = await RestClient.post("/search/date", {
        start: year + "-" + month + "-1",
        end: moment(year + "-" + month + "-1", "YYYY-M-D")
          .add(1, "months")
          .format("YYYY-M-D")
      });
      runInAction(() => {
        if (response.entity.success) {
          this.dates = response.entity.result;
          this.month = month;
          this.year = year;
        } else {
          this.searchError = response.entity.error;
        }
      });
    }
  }

  @action
  async search() {
    this.searching = true;

    try {
      const response = await RestClient.post("/search/", {
        query: this.query,
        offset: this.offset,
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
          const offset = this.offset || 0;

          this.total = response.entity.total || 0;
          this.searching = false;
          this.nextOffset =
            offset + LIMIT < (this.total || 0)
              ? offset + LIMIT
              : undefined;
          this.prevOffset =
          offset > 0 ? offset - LIMIT : undefined;
        });
      }
    } catch (err) {
      runInAction(() => {
        this.nextOffset = undefined;
        this.prevOffset = undefined;
      });
    } finally {
      runInAction(() => (this.searching = false));
    }
  }
}
