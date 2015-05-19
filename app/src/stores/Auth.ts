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
            actions.constants.ACCOUNT.RESET_PASSWORD, this.onPasswordReset
        );

        this.client = rest.wrap(mime).wrap(errorCode);
        this.isLoggedIn = null;
        this.loginResult = {};
        this.registerResult = {};
        this.sendResetResult = {};
        this.resetPasswordResult = {};
        this.user = {};

        this.onGetAccount();
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
        this.client({
            method: "POST",
            path: "/api/account/forgot/" + email
        }).then(
            (response: rest.Response) => {
                this.sendResetResult = response.entity;
                if (this.sendResetResult.success) {
                    console.log('Reset email sent');
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.sendResetResult = {
                    success: false,
                    message: "Failed"
                };
                this.emit("change");
            }
        );
    },

    onPasswordReset: function(req: Requests.PasswordReset) {
        this.client({
            method: "POST",
            path: "/api/account/reset/",
            entity: JSON.stringify(req)
        }).then(
            (response: rest.Response) => {
                this.resetPasswordResult = response.entity;
                if (this.resetPasswordResult.success) {
                    console.log('Reset email sent');
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.resetPasswordResult = {
                    success: false,
                    message: "Failed"
                };
                this.emit("change");
            }
        );
    },

    onRegister: function(params: Requests.Register) {
        this.client({
            method: "POST",
            path: "/api/account/register",
            entity: JSON.stringify(params)
        }).then(
            (response: rest.Response) => {
                this.registerResult = response.entity;
                if (this.registerResult.success) {
                    console.log('Verify email sent');
                    //this.isLoggedIn = true;
                    //page('/register/verify');
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.registerResult = {
                    success: false,
                    message: "Failed"
                };
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
                console.log("Error");
                console.log(response);
                this.emit("change");
            }
        );
    },

    onLogin: function(payload: Requests.Login) {
        this.client({
            method: "POST",
            path: "/api/account/login",
            entity: JSON.stringify(payload)
        }).then(
            (response: rest.Response) => {
                this.loginResult = response.entity;
                if (this.loginResult.success) {
                    this.isLoggedIn = true;
                    page('/');
                }

                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.loginResult = {
                    success: false,
                    message: "Unexpected error authenticating with server."
                };

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
    }
});

export = AuthStore;