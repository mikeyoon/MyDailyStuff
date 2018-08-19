import { action, computed, observable, runInAction } from "mobx";
import moment from "moment";
import * as Requests from "../models/requests";
import * as Responses from "../models/responses";
import { RestClient } from "./client";

const LIMIT = 10;

export class SearchStore {
  @observable
  searchError: string | undefined;
  @observable
  searchResults: any[];
  @observable
  dates: any[];
  @observable
  query = "";
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
  offset: number | undefined;
  @observable
  month: number | undefined;
  @observable
  year: number | undefined;

  @computed
  get monthYear() {
    return this.month + "-" + this.year;
  }

  constructor() {
    this.searchResults = [];
    this.dates = [];
  }

  @action
  clear() {
    this.query = "";
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
      const response = await RestClient.post("/api/search/date", {
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
  async search(request: Requests.Search) {
    this.searching = true;

    try {
      const response = await RestClient.post("/api/search/", {
        query: this.query,
        offset: request.offset,
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

          this.total = response.entity.total || 0;
          this.searching = false;
          this.nextOffset =
            request.offset + LIMIT < (this.total || 0)
              ? request.offset + LIMIT
              : undefined;
          this.prevOffset =
            request.offset > 0 ? request.offset - LIMIT : undefined;
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
