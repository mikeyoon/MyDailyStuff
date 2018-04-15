import { action, autorun, observable, reaction, when } from 'mobx';
import { types } from 'mobx-state-tree';
import { RestClient } from './client';
import actions from '../actions';
import * as Requests from "../models/requests";
import page from 'page';
import moment from 'moment';

class AuthStore {
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

    constructor() {
    }

    getStreak() {
        this.streakLoading = true;

        RestClient
            .get("/api/account/streak/" + moment(new Date()).format("YYYY-M-D"))
            .then(response => {
                let streak = response.entity.result;
                this.streak = streak;
            })
            .catch(err => {
                console.error(err);
                this.streak = undefined;
            })
            .finally(() => this.streakLoading = false);
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

    register(request: Requests.Register) {
        this.registering = false;
        this.registerError = undefined;

        RestClient.post("/api/account/register", request)
            .then(response => {
                if (!response.entity.success) {
                    this.registerError = response.entity.error;
                }
            })
            .catch(err => this.registerError = err.message)
            .finally(() => this.registering = false);
    }
}

// var AuthStore = Fluxxor.createStore({
//     initialize: function() {
//         this.bindActions(
//             actions.constants.ACCOUNT.LOGIN, this.onLogin,
//             actions.constants.ACCOUNT.LOGOUT, this.onLogout,
//             actions.constants.ACCOUNT.REGISTER, this.onRegister,
//             actions.constants.ACCOUNT.VERIFY, this.onVerify,
//             actions.constants.ACCOUNT.SEND_RESET, this.onResetSend,
//             actions.constants.ACCOUNT.RESET_PASSWORD, this.onPasswordReset,
//             actions.constants.ACCOUNT.SAVE_PROFILE, this.onSaveProfile,
//             actions.constants.ACCOUNT.CLEAR_STORE, this.onClearResults,
//             actions.constants.ACCOUNT.GET_STREAK, this.onGetStreak
//         );

//         this.client = rest.wrap(mime).wrap(errorCode).wrap(csrf);
//         this.isLoggedIn = null;
//         this.loading = false;
//         this.error = null;

//         this.loginResult = {};
//         this.registerResult = {};
//         this.sendResetResult = {};
//         this.resetPasswordResult = {};
//         this.saveProfileResult = {};
//         this.user = {};
//         this.csrf = null;

//         this.streak = null;

//         this.onGetAccount();
//     },

//     onGetStreak: function(force: boolean) {
//         if (force || this.streak == null) {
//             this.client({
//                 method: "GET",
//                 path: "/api/account/streak/" + moment(new Date()).format("YYYY-M-D"),
//             }).then(
//                 (response: rest.Response) => {
//                     this.streak = response.entity.result;
//                     this.emit('change');
//                 },
//                 (response: rest.Response) => {
//                     this.streak = null;
//                     console.log(response);
//                     this.emit('change');
//                 }
//             )
//         }
//     },

//     onClearResults: function() {
//         this.loading = false;
//         this.loginResult = {};
//         this.registerResult = {};
//         this.sendResetResult = {};
//         this.resetPasswordResult = {};
//         this.saveProfileResult = {};
//         this.error = null;
//         this.emit("change");
//     },

//     onGetAccount: function() {
//         this.client({
//             method: "GET",
//             path: "/api/account"
//         }).then(

//             (response: rest.Response) => {
//                 this.csrf = response.headers[CSRF_HEADER];

//                 if (response.entity.success) {
//                     this.isLoggedIn = true;
//                     this.user = response.entity.result;
//                 } else {
//                     this.isLoggedIn = false;
//                 }
//                 this.emit("change");
//             },
//             (response: rest.Response) => {
//                 //console.log(response);
//                 this.csrf = response.headers[CSRF_HEADER];
//                 this.isLoggedIn = false;
//                 this.emit("change");
//             })
//     },

//     onResetSend: function(email: string) {
//         this.loading = true;
//         this.sendResetResult = {};
//         this.emit('change');

//         this.client({
//             method: "POST",
//             path: "/api/account/forgot/" + email
//         }).then(
//             (response: rest.Response) => {
//                 this.loading = false;
//                 this.sendResetResult = response.entity;
//                 if (this.sendResetResult.success) {
//                     this.error = null;
//                 } else {
//                     this.error = this.sendResetResult.error;
//                 }
//                 this.emit("change");
//             },
//             (response: rest.Response) => {
//                 //console.log(response);
//                 this.loading = false;
//                 this.error = "Error contacting server. Please try again later.";
//                 this.emit("change");
//             }
//         );
//     },

//     onPasswordReset: function(req: Requests.PasswordReset) {
//         this.loading = true;
//         this.resetPasswordResult = {};
//         this.emit('change');

//         this.client({
//             method: "POST",
//             path: "/api/account/reset/",
//             entity: JSON.stringify(req)
//         }).then(
//             (response: rest.Response) => {
//                 this.loading = false;
//                 this.resetPasswordResult = response.entity;
//                 if (this.resetPasswordResult.success) {
//                     this.error = null;
//                 } else {
//                     this.error = this.resetPasswordResult.error;
//                 }
//                 this.emit("change");
//             },
//             (response: rest.Response) => {
//                 //console.log(response);
//                 this.loading = false;
//                 this.error = "Error contacting server. Please try again later.";
//                 this.emit("change");
//             }
//         );
//     },

//     onRegister: function(params: Requests.Register) {
//         this.loading = true;
//         this.registerResult = {};
//         this.error = null;

//         this.emit('change');
//         this.client({
//             method: "POST",
//             path: "/api/account/register",
//             entity: JSON.stringify(params)
//         }).then(
//             (response: rest.Response) => {
//                 this.loading = false;
//                 this.registerResult = response.entity;
//                 if (this.registerResult.success) {
//                     this.error = null;
//                 } else {
//                     this.error = this.registerResult.error;
//                 }
//                 this.emit("change");
//             },
//             (response: rest.Response) => {
//                 //console.log(response);

//                 this.loading = false;
//                 this.error = "Error contacting server. Please try again later.";
//                 this.emit("change");
//             }
//         );
//     },

//     onLogout: function() {
//         this.client({ path: "/api/account/logout", method: "POST" }).then(
//             (response: rest.Response) => {
//                 if (response.entity.success) {
//                     this.isLoggedIn = false;
//                     this.user = null;
//                     page('/login');
//                 }
//                 this.emit("change");
//             },
//             (response: rest.Response) => {
//                 //console.log(response);
//                 this.emit("change");
//             }
//         );
//     },

//     onLogin: function(payload: Requests.Login) {
//         this.loading = true;
//         this.loginResult = {};
//         this.error = null;

//         this.emit('change');

//         this.client({
//             method: "POST",
//             path: "/api/account/login",
//             entity: JSON.stringify(payload)
//         }).then(
//             (response: rest.Response) => {
//                 this.loading = false;

//                 this.loginResult = response.entity;
//                 if (this.loginResult.success) {
//                     this.error = null;
//                     this.isLoggedIn = true;
//                     this.onGetAccount();
//                     page('/journal');
//                 } else {
//                     this.error = this.loginResult.error;
//                 }

//                 this.emit("change");
//             },
//             (response: rest.Response) => {
//                 this.loading = false;
//                 //console.log(response);

//                 this.error = "Error contacting server. Please try again later.";
//                 this.emit("change");
//             }
//         );
//     },

//     onVerify: function(token: string) {
//         this.client({
//             method: "GET",
//             path: "/api/account/verify/" + token
//         }).then(
//             (response: rest.Response) => {
//                 if (response.entity.success) {
//                     this.isLoggedIn = true;
//                     this.onGetAccount();
//                     page('/journal');
//                 }

//                 this.emit("change");
//             },
//             (response: rest.Response) => {
//                 //console.log(response);
//                 page('/login');

//                 this.emit("change");
//             }
//         );
//     },

//     onSaveProfile: function(req: Requests.SaveProfile) {
//         this.loading = true;
//         this.saveProfileResult = {};
//         this.emit('change');

//         this.client({
//             method: 'PUT',
//             path: '/api/account',
//             csrfToken: this.csrf,
//             entity: JSON.stringify({
//                 password: req.password
//             })
//         }).then(
//             (response: rest.Response) => {
//                 this.loading = false;
//                 this.saveProfileResult = response.entity;
//                 this.csrf = response.headers[CSRF_HEADER];
//                 if (this.saveProfileResult.success) {
//                     this.error = null;
//                 } else {
//                     this.error = this.saveProfileResult.error;
//                 }
//                 this.emit("change");
//             },
//             (response: rest.Response) => {
//                 //console.log(response);
//                 this.csrf = response.headers[CSRF_HEADER];
//                 this.loading = false;
//                 this.error = "Unknown error updating your profile. Please refresh the page and try again.";

//                 this.emit("change");
//             }
//         )
//     }
// });

export default AuthStore;