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

var AuthStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.ACCOUNT.LOGIN, this.onLogin,
            actions.constants.ACCOUNT.LOGOUT, this.onLogout,
            actions.constants.ACCOUNT.REGISTER, this.onRegister
        );

        this.client = rest.wrap(mime).wrap(errorCode);
        this.isLoggedIn = false;
    },

    onRegister: function(params: Requests.Register) {
        this.client({
            method: "POST",
            path: "/api/account/register",
            entity: JSON.stringify(params)
        }).then(
            (response: rest.Response) => {
                this.registerResult = response.entity;
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
        this.client({ path: "/api/account/logout" }).then(
            (response: rest.Response) => {
                if (response.entity.success) {
                    this.isLoggedIn = false;
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log("Error");
                console.log(response);
            }
        );
    },

    onLogin: function(payload: Requests.Login) {
        console.log(payload);
        this.client({
            method: "POST",
            path: "/api/account/login",
            entity: JSON.stringify(payload)
        }).then(
            (response: rest.Response) => {
                this.loginResult = response.entity;
                if (this.loginResult.success) {
                    this.isLoggedIn = true;
                }

                this.emit("change");
            },
            (response: rest.Response) => {
                this.loginResult = response.entity;
                this.emit("change");
            }
        );
    }
});

export = AuthStore;