import { observable, action, runInAction } from "mobx";
import { RestClient } from "./client";
import * as Requests from "../models/requests";
import page from "page";
import moment from "moment";
import { AnalyticsStore } from "./analytics.store";

export class AuthStore {
  @observable
  loggingIn = false;
  @observable
  isLoggedIn = false;
  @observable
  loginError: string | undefined;

  @observable
  streakLoading = false;
  @observable
  streak: number | undefined;
  @observable
  streakError: string | undefined;

  @observable
  sendingReset = false;
  @observable
  resetError: string | undefined;
  @observable
  resetSuccess = false;

  @observable
  gettingAccount = false;
  @observable
  getAccountError: string | undefined;
  @observable
  email: string | undefined;
  @observable
  user_id: string | undefined;

  @observable
  registering = false;
  @observable
  registerError: string | undefined;
  @observable
  registered = false;

  @observable
  saving = false;
  @observable
  saveError: string | undefined;
  @observable
  saved = false;

  constructor(private analyticsStore: AnalyticsStore) {
    this.streak = 0;
  }

  @action
  async getStreak() {
    this.streakLoading = true;

    try {
      const response = await RestClient.get(
        "/account/streak/" + moment(new Date()).format("YYYY-M-D")
      );
      this.getStreakSuccess(response);
    } catch (err) {
      console.error(err);
      runInAction(() => (this.streak = undefined));
    } finally {
      runInAction(() => (this.streakLoading = false));
    }
  }

  @action.bound
  getStreakSuccess(response: any) {
    let streak = response.entity.result;
    this.streak = streak;
  }

  @action
  async getAccount() {
    this.gettingAccount = true;

    try {
      const response = await RestClient.get("/account");
      runInAction(() => {
        if (response.entity.success) {
          this.isLoggedIn = true;
          this.email = response.entity.result.email;
          this.user_id = response.entity.result.id;
        } else {
          this.isLoggedIn = false;
        }
      });
    } catch (err) {
      runInAction(() => (this.getAccountError = err.message));
    } finally {
      runInAction(() => (this.gettingAccount = false));
    }
  }

  @action
  clearPasswordReset() {
    this.sendingReset = false;
    this.resetError = undefined;
  }

  @action
  async requestReset(email: string) {
    this.sendingReset = true;
    this.resetError = undefined;

    try {
      const response = await RestClient.post("/account/forgot/" + email);
      runInAction(() => {
        let result = response.entity;
        this.resetSuccess = result.success;
        this.resetError = result.error;
      });
    } catch (err) {
      runInAction(
        () =>
          (this.resetError = "Error contacting server. Please try again later.")
      );
    } finally {
      runInAction(() => (this.sendingReset = false));
    }
  }

  @action
  async resetPassword(request: Requests.PasswordReset) {
    this.sendingReset = true;
    this.resetError = undefined;

    try {
      const response = await RestClient.post("/account/reset/", request);
      runInAction(() => {
        if (response.entity.success) {
          this.resetSuccess = true;
        } else {
          this.resetError = response.entity.error;
        }
      });
    } catch (err) {
      runInAction(() => (this.resetError = err.message));
    } finally {
      runInAction(() => (this.sendingReset = false));
    }
  }

  @action
  async login(info: Requests.Login) {
    this.loggingIn = true;
    this.loginError = undefined;

    this.analyticsStore.onLogin(info);

    try {
      const response = await RestClient.post("/account/login", info);
      if (response.entity.success) {
        runInAction(() => (this.isLoggedIn = true));
        await this.getAccount();
        // GetAccount
        page("/journal");
      } else {
        runInAction(() => (this.loginError = response.entity.error));
      }
    } catch (err) {
      runInAction(
        () =>
          (this.loginError = "Error contacting server. Please try again later.")
      );
    } finally {
      runInAction(() => (this.loggingIn = false));
    }
  }

  @action
  async logout() {
    this.analyticsStore.onLogout();
    const response = await RestClient.post("/account/logout");
    if (response.entity.success) {
      runInAction(() => {
        this.isLoggedIn = false;
        this.email = undefined;
        this.user_id = undefined;
      });
      page("/login");
    }
  }

  @action
  async register(request: Requests.Register) {
    this.registering = false;
    this.registerError = undefined;

    this.analyticsStore.onRegister(request);

    try {
      const response = await RestClient.post("/account/register", request);
      runInAction(() => {
        if (!response.entity.success) {
          this.registerError = response.entity.error;
        } else {
          this.registered = true;
        }
      });
    } catch (err) {
      runInAction(() => (this.registerError = err.message));
    } finally {
      runInAction(() => () => (this.registering = false));
    }
  }

  @action
  async verify(token: string) {
    this.analyticsStore.onVerify(token);
    try {
      const response = await RestClient.get("/account/verify/" + token);
      if (response.entity.success) {
        runInAction(() => (this.isLoggedIn = true));
        this.getAccount();
        page("/journal");
      }
    } catch (err) {
      page("/login");
    }
  }

  @action
  async updateProfile(password: string) {
    this.saving = true;
    this.saved = false;
    this.saveError = undefined;

    if (this.email == null) {
      this.saveError = "Email is null";
      return;
    }

    try {
      const response = await RestClient.put("/account", new Requests.SaveProfile(this.email, password));
      runInAction(() => {
        if (!response.entity.success) {
          this.saveError = response.entity.error;
        } else {
          this.saved = true;
        }
      });
    } catch (err) {
      runInAction(() => (this.saveError = err.message));
    } finally {
      runInAction(() => (this.saving = false));
    }
  }
}
