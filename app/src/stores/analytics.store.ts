import * as Requests from "../models/requests";
import moment from "moment";

declare var _gaq: any;

function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: Number,
  nonInteraction?: boolean
) {
  _gaq.push(["_trackEvent", category, action, label, value, nonInteraction]);
}

export class AnalyticsStore {
  enabled: boolean;

  constructor() {
    this.enabled = typeof _gaq !== "undefined";
  }

  track(...args: any[]) {
    if (this.enabled) {
      trackEvent.call(null, args);
    }
  }

  onLogin(payload: Requests.Login) {
    this.track("account", "login");
  }

  onProfile() {
    this.track("account", "profile");
  }

  onLogout() {
    this.track("account", "logout");
  }

  onRegister(payload: Requests.Register) {
    this.track("account", "register");
  }

  onVerify(token: string) {
    this.track("account", "verify");
  }

  onSendReset(email: string) {
    this.track("account", "send_reset");
  }

  onReset(payload: Requests.PasswordReset) {
    this.track("account", "reset_password");
  }

  onSaveProfile(payload: Requests.SaveProfile) {
    this.track("account", "update_profile");
  }

  onClearStore() {}

  onJournalAdd(entry: string) {
    this.track("journal", "add");
  }

  onJournalEdit(entry: Requests.EditJournalEntry) {
    this.track("journal", "edit");
  }

  onJournalGet(date: Date) {
    this.track("journal", "get", moment(date).format("MM-DD-YYYY"));
  }

  onJournalDelete() {
    this.track("journal", "delete");
  }

  onSearchDate(date: Date) {
    //_this.track('journal', 'delete');
  }

  onSearchQuery(query: string) {
    this.track("search", "query", query);
  }
}
