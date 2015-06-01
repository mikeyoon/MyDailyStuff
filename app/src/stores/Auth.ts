/// <reference path='../../typings/page/page.d.ts' />
/// <reference path='../../typings/rest/rest.d.ts' />
/// <reference path='../../typings/fluxxor/fluxxor.d.ts' />

import rest = require('rest');
import mime = require('rest/interceptor/mime');
import errorCode = require('rest/interceptor/errorCode');
import Fluxxor = require('fluxxor');
import actions = require('../actions');
import Requests = require("../models/requests");
import Responses = require("../models/responses");
import page = require('page');

var AuthStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.ACCOUNT.LOGIN, this.onLogin,
            actions.constants.ACCOUNT.LOGOUT, this.onLogout,
            actions.constants.ACCOUNT.REGISTER, this.onRegister,
            actions.constants.ACCOUNT.VERIFY, this.onVerify,
            actions.constants.ACCOUNT.SEND_RESET, this.onResetSend,
            actions.constants.ACCOUNT.RESET_PASSWORD, this.onPasswordReset,
            actions.constants.ACCOUNT.SAVE_PROFILE, this.onSaveProfile,
            actions.constants.ACCOUNT.CLEAR_STORE, this.onClearResults
        );

        this.client = rest.wrap(mime).wrap(errorCode);
        this.isLoggedIn = null;
        this.loading = false;
        this.error = null;

        this.loginResult = {};
        this.registerResult = {};
        this.sendResetResult = {};
        this.resetPasswordResult = {};
        this.saveProfileResult = {};
        this.user = {};

        this.onGetAccount();
    },

    onClearResults: function() {
        this.loading = false;
        this.loginResult = {};
        this.registerResult = {};
        this.sendResetResult = {};
        this.resetPasswordResult = {};
        this.saveProfileResult = {};
        this.emit("change");
    },

    onGetAccount: function() {
        this.client({
            method: "GET",
            path: "/api/account"
        }).then(
            (response: rest.Response) => {
                if (response.entity.success) {
                    this.isLoggedIn = true;
                    this.user = response.entity.result
                } else {
                    this.isLoggedIn = false;
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.isLoggedIn = false;
                this.emit("change");
            })
    },

    onResetSend: function(email: string) {
        this.loading = true;
        this.sendResetResult = {};
        this.emit('change');

        this.client({
            method: "POST",
            path: "/api/account/forgot/" + email
        }).then(
            (response: rest.Response) => {
                this.loading = false;
                this.sendResetResult = response.entity;
                if (this.sendResetResult.success) {
                    this.error = null;
                } else {
                    this.error = this.sendResetResult.error;
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.loading = false;
                this.error = "Error contacting server. Please try again later.";
                this.emit("change");
            }
        );
    },

    onPasswordReset: function(req: Requests.PasswordReset) {
        this.loading = true;
        this.resetPasswordResult = {};
        this.emit('change');

        this.client({
            method: "POST",
            path: "/api/account/reset/",
            entity: JSON.stringify(req)
        }).then(
            (response: rest.Response) => {
                this.loading = false;
                this.resetPasswordResult = response.entity;
                if (this.resetPasswordResult.success) {
                    this.error = null;
                } else {
                    this.error = this.resetPasswordResult.error;
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.loading = false;
                this.error = "Error contacting server. Please try again later.";
                this.emit("change");
            }
        );
    },

    onRegister: function(params: Requests.Register) {
        this.loading = true;
        this.registerResult = {};

        this.emit('change');
        this.client({
            method: "POST",
            path: "/api/account/register",
            entity: JSON.stringify(params)
        }).then(
            (response: rest.Response) => {
                this.loading = false;
                this.registerResult = response.entity;
                if (this.registerResult.success) {
                    this.error = null;
                } else {
                    this.error = this.registerResult.error;
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);

                this.loading = false;
                this.error = "Error contacting server. Please try again later.";
                this.emit("change");
            }
        );
    },

    onLogout: function() {
        this.client({ path: "/api/account/logout", method: "POST" }).then(
            (response: rest.Response) => {
                if (response.entity.success) {
                    this.isLoggedIn = false;
                    this.user = null;
                    page('/login');
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.emit("change");
            }
        );
    },

    onLogin: function(payload: Requests.Login) {
        this.loading = true;
        this.loginResult = {};

        this.emit('change');

        this.client({
            method: "POST",
            path: "/api/account/login",
            entity: JSON.stringify(payload)
        }).then(
            (response: rest.Response) => {
                this.loading = false;

                this.loginResult = response.entity;
                if (this.loginResult.success) {
                    this.error = null;
                    this.isLoggedIn = true;
                    this.onGetAccount();
                    page('/');
                } else {
                    this.error = this.loginResult.error;
                }

                this.emit("change");
            },
            (response: rest.Response) => {
                this.loading = false;
                console.log(response);

                this.error = "Error contacting server. Please try again later.";
                this.emit("change");
            }
        );
    },

    onVerify: function(token: string) {
        this.client({
            method: "GET",
            path: "/api/account/verify/" + token
        }).then(
            (response: rest.Response) => {
                if (response.entity.success) {
                    this.isLoggedIn = true;
                    page('/');
                }

                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                page('/login');

                this.emit("change");
            }
        );
    },

    onSaveProfile: function(req: Requests.SaveProfile) {
        this.loading = true;
        this.saveProfileResult = {};
        this.emit('change');

        this.client({
            method: 'PUT',
            path: '/api/account',
            entity: JSON.stringify({
                password: req.password
            })
        }).then(
            (response: rest.Response) => {
                this.loading = false;
                this.saveProfileResult = response.entity;
                if (this.saveProfileResult.success) {
                    this.error = null;
                } else {
                    this.error = this.saveProfileResult.error;
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.loading = false;
                this.emit("change");
            }
        )
    }
});

export = AuthStore;