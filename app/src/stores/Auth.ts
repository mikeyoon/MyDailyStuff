/// <reference path='../../typings/page/page.d.ts' />
/// <reference path='../../typings/rest/rest.d.ts' />
/// <reference path='../../typings/fluxxor/fluxxor.d.ts' />

import rest = require('rest');
import mime = require('rest/interceptor/mime');
import errorCode = require('rest/interceptor/errorCode');
import Fluxxor = require('fluxxor');
import actions = require('../actions');

var AuthStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.ACCOUNT.LOGIN, this.onLogin,
            actions.constants.ACCOUNT.LOGOUT, this.onLogout,
            actions.constants.ACCOUNT.REGISTER, this.onRegister
        );

        this.client = rest.wrap(mime).wrap(errorCode);
    },

    onRegister: function(params: any) {
        this.client({
            method: "POST",
            path: "/api/account/register",
            entity: params
        }).then(
            (response: rest.Response) => {
                console.log(response);
            },
            (response: rest.Response) => {
                console.log("Error");
                console.log(response);
            }
        );
    },

    onLogout: function() {
        this.client({ path: "/api/account/logout" }).then(
            (response: rest.Response) => {
                console.log(response);
            },
            (response: rest.Response) => {
                console.log("Error");
                console.log(response);
            }
        );
    },

    onLogin: function(email: string, password: string) {
        this.client({
            method: "POST",
            path: "/api/account/login",
            entity: {
                email: email,
                password: password
            }
        }).then(
            (response: rest.Response) => {
                console.log(response);
            },
            (response: rest.Response) => {
                console.log("Error");
                console.log(response);
            }
        );
    }
});

export = AuthStore;