import { observable, action } from 'mobx';
import { RestClient } from './client';
import * as Requests from "../models/requests";
import page from 'page';
import moment from 'moment';
import { AnalyticsStore } from './analytics.store';

export class AuthStore {
    @observable loggingIn = false;
    @observable isLoggedIn = false
    @observable loginError: string | undefined;
    
    @observable streakLoading = false;
    @observable streak: number | undefined;
    @observable streakError: string | undefined;

    @observable sendingReset = false;
    @observable resetError: string | undefined;
    @observable resetSuccess: boolean | undefined;

    @observable gettingAccount = false;
    @observable getAccountError: string | undefined;
    @observable email: string | undefined;
    @observable user_id: number | undefined;

    @observable registering = false;
    @observable registerError: string | undefined;

    @observable saving = false;
    @observable saveError: string | undefined;

    constructor(private analyticsStore: AnalyticsStore) {
    }

    @action
    getStreak() {
        this.streakLoading = true;

        RestClient
            .get("/api/account/streak/" + moment(new Date()).format("YYYY-M-D"))
            .then(response => {
                
            })
            .catch(err => {
                console.error(err);
                this.streak = undefined;
            })
            .finally(() => this.streakLoading = false);
    }

    @action.bound
    getStreakSuccess(response: any) {
        let streak = response.entity.result;
        this.streak = streak;
    }

    getAccount() {
        this.gettingAccount = true;

        RestClient.get("/api/account")
            .then(response => {
                if (response.entity.success) {
                    this.isLoggedIn = true;
                    this.email = response.entity.result.email;
                    this.user_id = response.entity.result.user_id;
                } else {
                    this.isLoggedIn = false;
                }
            })
            .catch(err => this.getAccountError = err.message)
            .finally(() => this.gettingAccount = false);
    }

    clearPasswordReset() {
        this.sendingReset = false;
        this.resetError = undefined;
    }

    requestReset(email: string) {
        this.sendingReset = true;
        this.resetError = undefined;
        
        RestClient.post("/api/account/forgot/" + email)
            .then(response => {
                let result = response.entity;
                this.resetSuccess = result.success;
                this.resetError = result.error;
            })
            .catch(response => this.resetError = "Error contacting server. Please try again later.")
            .finally(() => this.sendingReset = false);
    }

    resetPassword(request: Requests.PasswordReset) {
        this.sendingReset = true;
        this.resetError = undefined;

        RestClient.post("/api/account/reset/", request)
            .then(response => {
                if (response.entity.success) {
                } else {
                    this.resetError = response.entity.error;
                }
            })
            .catch(err => this.resetError = err.message)
            .finally(() => this.sendingReset = false);
    }

    login(info: Requests.Login) {
        this.loggingIn = true;
        this.loginError = undefined;

        this.analyticsStore.onLogin(info);

        RestClient.post("/api/account/login", info)
            .then(response => {
                if (response.entity.success) {
                    this.isLoggedIn = true;
                    // GetAccount
                    page('/journal');
                } else {
                    this.loginError = response.entity.error;
                }
            })
            .catch(response => this.loginError = "Error contacting server. Please try again later.")
            .finally(() => this.loggingIn = false);
    }

    logout() {
        this.analyticsStore.onLogout();
        RestClient.post("/api/account/logout")
            .then(response => {
                if (response.entity.success) {
                    this.isLoggedIn = false;
                    this.email = undefined;
                    this.user_id = undefined;
                    page('/login');
                }
            });
    }

    register(request: Requests.Register) {
        this.registering = false;
        this.registerError = undefined;

        this.analyticsStore.onRegister(request);

        RestClient.post("/api/account/register", request)
            .then(response => {
                if (!response.entity.success) {
                    this.registerError = response.entity.error;
                }
            })
            .catch(err => this.registerError = err.message)
            .finally(() => this.registering = false);
    }

    verify(token: string) {
        this.analyticsStore.onVerify(token);
        RestClient.get("/api/account/verify/" + token)
            .then(response => {
                if (response.entity.success) {
                    this.isLoggedIn = true;
                    this.getAccount();
                    page('/journal');
                }
            })
            .catch(err => page('/login'));
    }

    updateProfile(request: Requests.SaveProfile) {
        this.saving = true;
        this.saveError = undefined;

        RestClient.put('/api/account', request)
            .then(response => {
                if (!response.entity.success) {
                    this.saveError = response.entity.error;
                }
            })
            .catch(err => this.saveError = err.message)
            .finally(() => this.saving = false);
    }
}
