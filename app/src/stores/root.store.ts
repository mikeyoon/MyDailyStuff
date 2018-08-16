import { AnalyticsStore } from "./analytics.store";
import { AuthStore } from "./auth.store";
import { JournalStore } from "./journal.store";
import { RouteStore } from "./route.store";
import { SearchStore } from "./search.store";

export class RootStore {
  public readonly analyticsStore: AnalyticsStore;
  public readonly authStore: AuthStore;
  public readonly journalStore: JournalStore;
  public readonly routeStore: RouteStore;
  public readonly searchStore: SearchStore;

  constructor() {
    this.analyticsStore = new AnalyticsStore();
    this.authStore = new AuthStore(this.analyticsStore);
    this.journalStore = new JournalStore(this.analyticsStore);
    this.routeStore = new RouteStore(this.authStore);
    this.searchStore = new SearchStore();
  }
}