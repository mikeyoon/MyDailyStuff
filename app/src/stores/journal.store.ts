import { observable, action, runInAction } from "mobx";
import moment from "moment";

import * as Requests from "../models/requests";
import * as Responses from "../models/responses";
import { RestClient } from "./client";
import { AnalyticsStore } from "./analytics.store";

export class JournalStore {
  @observable
  editing = false;
  @observable
  adding = false;
  @observable
  loading = false;
  @observable
  deleting = false;
  @observable
  started = false; //Whether the journal page has loaded
  @observable
  error: string | undefined;

  @observable
  current: Responses.JournalEntry | null = null;
  @observable
  hasEntry = false;
  @observable
  date: Date | undefined;
  @observable
  showCalendar = false;

  constructor(private analyticsStore: AnalyticsStore) {}

  @action
  async add(entry: string) {
    this.adding = true;
    this.error = undefined;

    this.analyticsStore.onJournalAdd(entry);

    try {
      const response = await RestClient.post("/api/journal", {
        entries: [entry],
        date: moment(this.date).format("YYYY-M-D")
      });
      runInAction(() => {
        this.adding = false;
        if (response.entity.success) {
          this.current = response.entity.result;
          this.hasEntry = true;
        } else {
          this.error = response.entity.error;
        }
      });
    } catch (err) {
      runInAction(() => (this.error = err.message));
    } finally {
      runInAction(() => (this.adding = false));
    }
  }

  @action
  async edit(req: Requests.EditJournalEntry) {
    this.editing = true;
    this.error = undefined;

    this.analyticsStore.onJournalEdit(req);

    if (this.current == null) {
      return;
    }

    let entries = this.current.entries.slice(0);

    if (!req.entry) {
      entries.splice(req.index, 1);
    } else {
      entries[req.index] = req.entry;
    }

    try {
      const response = await RestClient.put("/api/journal/" + this.current.id, {
        entries: entries
      });
      runInAction(() => {
        this.editing = false;
        if (response.entity.success) {
          //We're relying on the current to be updated client-side due to delays in indexing in ES
          if (this.current != null) {
            this.current.entries = entries;
          } else {
            this.error = "Something went wrong, please refresh";
          }
        } else {
          this.error = response.entity.error;
        }
      });
    } catch (err) {
      runInAction(() => (this.error = err.message));
    } finally {
      runInAction(() => (this.editing = false));
    }
  }

  @action
  async delete() {
    this.deleting = true;
    this.error = undefined;

    this.analyticsStore.onJournalDelete();

    if (this.current == null) {
      return;
    }

    try {
      const response = await RestClient.del("/api/journal/" + this.current.id);
      runInAction(() => {
        if (response.entity.success) {
          this.hasEntry = false;
          this.current = null;
        } else {
          this.error = response.entity.error;
        }
      });
    } catch (err) {
      runInAction(() => (this.error = err.message));
    } finally {
      runInAction(() => (this.deleting = false));
    }
  }

  @action
  async get(date: Date) {
    this.loading = true;
    this.error = undefined;

    try {
      const response = await RestClient.get(
        "/api/journal/" + moment(date).format("YYYY-M-D")
      );
      runInAction(() => {
        this.loading = false;
        this.date = date;
        this.started = true;
        this.showCalendar = false;

        if (response.entity.success) {
          this.current = response.entity.result;
          this.hasEntry = true;
        } else {
          this.hasEntry = false;
          this.current = null;
        }
      });
    } catch (err) {
      runInAction(() => {
        this.started = true;
        this.loading = false;
        this.showCalendar = false;
        this.hasEntry = false;
        this.current = null;
        this.error = err.message;
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  @action
  toggleCalendar(show: boolean) {
    this.showCalendar = show;
  }
}
