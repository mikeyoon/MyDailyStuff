import * as Requests from "../models/requests.js";
import * as Responses from "../models/responses.js";
import { BaseStore } from "./base.store.js";
import { analyticsStore, AnalyticsStore } from "./analytics.store.js";
import { router, Router } from '../components/router.js';
import { BaseResponse, fetch } from '../util/fetch.js';
import { parseDate, toGoDateString } from "../util/date.js";
import { authStore } from "./auth.store.js";

interface StoreProps {
  editing: boolean;
  adding: boolean;
  loading: boolean;
  deleting: boolean;
  initialized: boolean;
  error: string | undefined;

  current: Responses.JournalEntry | null;
  currentDate: Date;
  showCalendar: boolean;
}

export class JournalStore extends BaseStore<StoreProps> implements StoreProps {
  editing = false;
  adding = false;
  loading = true;
  deleting = false;
  initialized = false; //Whether the journal page has loaded
  error: string | undefined;

  current: Responses.JournalEntry | null = null;
  /**
   * The selected date at midnight, in UTC timezone
   */
  currentDate: Date;
  showCalendar = false;

  get hasEntry() {
    return this.current != null;
  }

  get today() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  constructor(
    router: Router,
    private analyticsStore: AnalyticsStore,
  ) {
    super();
    this.currentDate = this.today;
    
    router.activeRoute$.subscribe((activated) => {
      if (activated.route && activated.route.startsWith('/journal')) {
        const date = activated.params.date ? parseDate(activated.params.date) : this.today;
        this.get(date);
      }
    });
  }

  async add(entry: string) {
    this.adding = true;
    this.error = undefined;
    this.notifyPropertyChanged('error', 'adding');

    this.analyticsStore.onJournalAdd(entry);

    try {
      const response = await fetch("/journal", {
        method: 'POST',
        body: JSON.stringify({ entries: [entry], date: toGoDateString(this.currentDate) }),
      });

      if (response.ok) {
        const json = await response.json() as BaseResponse<Responses.JournalEntry>;
        if (json.success === true) {
          this.current = json.result;
        } else {
          this.error = json.error;
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        this.error = err.message;
      }
    } finally {
      this.adding = false;
      this.notifyPropertyChanged('current', 'error', 'adding');
    }
  }

  async edit(req: Requests.EditJournalEntry) {
    this.editing = true;
    this.error = undefined;
    this.notifyPropertyChanged('error', 'editing');

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
      const response = await fetch("/journal/" + this.current.id, {
        body: JSON.stringify({ entries }),
        method: 'PUT'
      });

      if (response.ok) {
        const json = await response.json() as BaseResponse<Responses.JournalEntry>;
        if (json.success === true) {
          this.current.entries = entries;
        } else {
          this.error = json.error;
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        this.error = err.message;
      }
    } finally {
      this.editing = false;
      this.notifyPropertyChanged('error', 'editing', 'current');
    }
  }

  async delete() {
    this.deleting = true;
    this.error = undefined;
    this.notifyPropertyChanged('error', 'deleting');

    this.analyticsStore.onJournalDelete();

    if (this.current == null) {
      return;
    }

    try {
      const response = await fetch("/journal/" + this.current.id, { method: 'DELETE' });
      if (response.ok) {
        const json = await response.json() as BaseResponse<void>;
        if (json.success === true) {
          this.current = null;
        } else {
          this.error = json.error;
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        this.error = err.message;
      }
    } finally {
      this.deleting = false;
      this.notifyPropertyChanged('error', 'deleting', 'current');
    }
  }

  async get(date: Date) {
    this.loading = true;
    this.error = undefined;
    this.currentDate = date;
    this.notifyPropertyChanged('loading', 'error', 'currentDate');

    try {
      const response = await fetch("/journal/" + toGoDateString(date));

      this.initialized = true;
      this.showCalendar = false;

      if (response.ok) {
        const json = await response.json() as BaseResponse<Responses.JournalEntry>;
        if (json.success === true) {
          this.current = json.result;
          await authStore.getStreak();
        } else {
          this.error = json.error;
        }
      }
    } catch (err) {
      this.current = null;
      if (err instanceof Error) {
        this.error = err.message;
      }
    } finally {
      this.initialized = true;
      this.loading = false;
      this.showCalendar = false;
      this.notifyPropertyChanged('initialized', 'loading', 'error', 'showCalendar', 'current');
    }
  }

  toggleCalendar(show: boolean) {
    this.showCalendar = show;
    this.notifyPropertyChanged('showCalendar');
  }
}

export const journalStore = new JournalStore(router, analyticsStore);
