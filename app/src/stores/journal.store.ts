import * as Requests from "../models/requests";
import * as Responses from "../models/responses";
import { AnalyticsStore } from "./analytics.store";
import { router } from '../components/router';

export class JournalStore {
  editing = false;
  adding = false;
  loading = false;
  deleting = false;
  started = false; //Whether the journal page has loaded
  error: string | undefined;

  current: Responses.JournalEntry | null = null;
  localDate: Date;
  showCalendar = false;

  get hasEntry() {
    return this.current != null;
  }

  constructor(
    private analyticsStore: AnalyticsStore,
  ) {
    this.localDate = new Date();
    router.params$.subscribe((params) => {
    });
    reaction(
      () => this.router.params,
      params => {
        if (this.router.route === Routes.Journal) {
          this.localDate = params.date != null ? moment(params.date, 'YYYY-M-D').toDate() : new Date();
          this.get(this.localDate);
        }
      }
    );
  }

  async add(entry: string) {
    this.adding = true;
    this.error = undefined;

    this.analyticsStore.onJournalAdd(entry);

    try {
      const response = await RestClient.post("/journal", {
        entries: [entry],
        date: moment(this.localDate).format("YYYY-M-D")
      });
      runInAction(() => {
        this.adding = false;
        if (response.entity.success) {
          this.current = response.entity.result;
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
      const response = await RestClient.put("/journal/" + this.current.id, {
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

  async delete() {
    this.deleting = true;
    this.error = undefined;

    this.analyticsStore.onJournalDelete();

    if (this.current == null) {
      return;
    }

    try {
      const response = await RestClient.del("/journal/" + this.current.id);
      runInAction(() => {
        if (response.entity.success) {
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

  async get(date: Date) {
    this.loading = true;
    this.error = undefined;

    try {
      const response = await RestClient.get(
        "/journal/" + moment(date).format("YYYY-M-D")
      );
      runInAction(() => {
        this.loading = false;
        this.started = true;
        this.showCalendar = false;

        if (response.entity.success) {
          this.current = response.entity.result;
        } else {
          this.current = null;
        }
      });
    } catch (err) {
      runInAction(() => {
        this.started = true;
        this.loading = false;
        this.showCalendar = false;
        this.current = null;
        this.error = err.message;
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  toggleCalendar(show: boolean) {
    this.showCalendar = show;
  }
}
