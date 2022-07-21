import { toGoDateString } from "../util/date.js";
import { BaseResponse } from "../util/fetch.js";
import { AnalyticsStore, analyticsStore } from "./analytics.store.js";
import { BaseStore } from "./base.store.js";
import { fetch } from '../util/fetch.js';
import * as Requests from '../models/requests.js';
import { router } from "../components/router.js";

interface StoreProps {
  loggingIn: boolean;
  isLoggedIn: boolean;
  loginError: string | undefined;

  streakLoading: boolean;
  streak: number | undefined;
  streakError: string | undefined;

  sendingReset: boolean;
  resetError: string | undefined;
  resetSuccess: boolean;

  getAccountLoading: boolean;
  getAccountError: string | undefined;
  email: string | undefined;
  user_id: string | undefined;

  registering: boolean;
  registerError: string | undefined;
  registered: boolean;

  saving: boolean;
  saveError: string | undefined;
  saved: boolean;
}

export class AuthStore extends BaseStore<StoreProps> implements StoreProps  {
  loggingIn = false;
  isLoggedIn = false;
  loginError: string | undefined;

  streakLoading = false;
  streak: number | undefined;
  streakError: string | undefined;

  sendingReset = false;
  resetError: string | undefined;
  resetSuccess = false;

  getAccountRequest: Promise<void> | null = null;
  getAccountError: string | undefined;
  email: string | undefined;
  user_id: string | undefined;

  registering = false;
  registerError: string | undefined;
  registered = false;

  saving = false;
  saveError: string | undefined;
  saved = false;

  constructor(private analyticsStore: AnalyticsStore) {
    super();

    this.streak = 0;
  }

  get getAccountLoading() {
    return this.getAccountRequest != null;
  }

  async getStreak() {
    this.streakLoading = true;
    this.notifyPropertyChanged('streakLoading');

    try {
      const response = await fetch(`/account/streak/${toGoDateString(new Date())}`);
      if (response.ok) {
        const json = await response.json() as BaseResponse<number>;
        if (json.success === true) {
          this.streak = json.result;
        } else {
          this.streakError = json.error;
        }
      }
    } catch (err) {
      this.streak = undefined;
      if (err instanceof Error) {
        this.streakError = err.message;
      }
    } finally {
      this.streakLoading = false;
      this.notifyPropertyChanged('streak', 'streakLoading', 'streakError');
    }
  }

  async getAccount(refresh = false) {
    if (this.getAccountRequest != null) {
      return this.getAccountRequest;
    }

    if (!refresh && (this.isLoggedIn || this.getAccountError)) {
      return  Promise.resolve();
    }

    this.getAccountError = undefined;
    this.notifyPropertyChanged('getAccountLoading', 'getAccountError');

    return this.getAccountRequest = (async () => {
      try {
        const response = await fetch("/account");
        if (response.ok) {
          const json = await response.json() as BaseResponse<{ email: string; id: string; }>;
          if (json.success === true) {
            this.isLoggedIn = true;
            this.email = json.result.email;
            this.user_id = json.result.id;
          } else {
            this.isLoggedIn = false;
            this.getAccountError = json.error;
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          this.getAccountError = err.message;
        }
      } finally {
        this.getAccountRequest = null;
        this.notifyPropertyChanged('getAccountLoading', 'getAccountError', 'isLoggedIn');
      }
    })();
  }

  clearPasswordReset() {
    this.sendingReset = false;
    this.resetError = undefined;
    this.notifyPropertyChanged('sendingReset', 'resetError');
  }

  async requestReset(email: string) {
    this.sendingReset = true;
    this.resetError = undefined;
    this.notifyPropertyChanged('sendingReset', 'resetError');

    try {
      const response = await fetch("/account/forgot/" + email, { method: 'POST' });
      if (response.ok) {
        const json = await response.json() as BaseResponse<any>;
        if (json.success === true) {
          this.resetSuccess = json.success;
        } else {
          this.resetError = json.error;
        }
      }
    } catch (err) {
      this.resetError = "Error contacting server. Please try again later.";
    } finally {
      this.sendingReset = false;
      this.notifyPropertyChanged('resetError', 'sendingReset', 'resetSuccess');
    }
  }

  async resetPassword(request: Requests.PasswordReset) {
    this.sendingReset = true;
    this.resetError = undefined;
    this.notifyPropertyChanged('sendingReset', 'resetError');

    try {
      const response = await fetch("/account/reset/", { method: 'POST' });
      if (response.ok) {
        const json = await response.json() as BaseResponse;
        if (json.success === true) {
          this.resetSuccess = true;
        } else {
          this.resetError = json.error;
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        this.resetError = err.message;
      }
    } finally {
      this.sendingReset = false;
      this.notifyPropertyChanged('sendingReset', 'resetError', 'resetSuccess');
    }
  }

  async login(info: Requests.Login) {
    this.loggingIn = true;
    this.loginError = undefined;
    this.notifyPropertyChanged('loggingIn', 'loginError');

    this.analyticsStore.onLogin(info);

    try {
      const response = await fetch("/account/login", { method: 'POST', body: JSON.stringify(info) });
      if (response.ok) {
        const json = await response.json() as BaseResponse;
        if (json.success === true) {
          this.isLoggedIn = true;
          await this.getAccount();
          router.navigate('/journal');
        } else {
          this.loginError = json.error;
        }
      }
    } catch (err) {
      this.loginError = "Error contacting server. Please try again later.";
    } finally {
      this.loggingIn = false;
      this.notifyPropertyChanged('loggingIn', 'loginError', 'isLoggedIn');
    }
  }

  async logout() {
    this.analyticsStore.onLogout();
    const response = await fetch("/account/logout", { method: 'POST' });
    if (response.ok) {
      const json = await response.json() as BaseResponse;
      if (json.success) {
        this.isLoggedIn = false;
        this.email = undefined;
        this.user_id = undefined;
        this.notifyPropertyChanged('isLoggedIn', 'email', 'user_id');

        window.location.href = "/login";
      }
    }
  }

  async register(request: Requests.Register) {
    this.registering = false;
    this.registerError = undefined;
    this.email = request.email;
    this.notifyPropertyChanged('registering', 'registerError');

    this.analyticsStore.onRegister(request);

    try {
      const response = await fetch("/account/register", { method: 'POST', body: JSON.stringify(request) });
      if (response.ok) {
        const json = await response.json() as BaseResponse;
        if (json.success === true) {
          this.registered = true;
        } else {
          this.registerError = json.error;
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        this.registerError = err.message;
      }
    } finally {
      this.registering = false;
      this.notifyPropertyChanged('registerError', 'registering', 'registered');
    }
  }

  async verify(token: string) {
    this.analyticsStore.onVerify(token);

    try {
      const response = await fetch("/account/verify/" + token);
      if (response.ok) {
        const json = await response.json() as BaseResponse;
        if (json.success) {
          this.isLoggedIn = true;
          this.getAccount();
          router.navigate('/journal');
        } else {
          this.loginError = 'Verification link invalid'
          router.navigate('/login');
        }
      }
    } catch (err) {
      router.navigate('/login');
    }
  }

  async updateProfile(password: string) {
    this.saving = true;
    this.saved = false;
    this.saveError = undefined;
    this.notifyPropertyChanged('saving', 'saved', 'saveError');

    if (this.email == null) {
      this.saveError = "Email is null";
      return;
    }

    try {
      const response = await fetch("/account", { method: 'PUT', body: JSON.stringify(new Requests.SaveProfile(this.email, password)) });
      if (response.ok) {
        const json = await response.json() as BaseResponse;
        if (json.success === true) {
          this.saved = true;
        } else {
          this.saveError = json.error;
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        this.saveError = err.message;
      }
    } finally {
      this.saving = false;
      this.notifyPropertyChanged('saving', 'saved', 'saveError');
    }
  }
}

export const authStore = new AuthStore(analyticsStore);
