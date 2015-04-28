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
            actions.constants.ACCOUNT.LOGOUT, this.onLogout
        );

        this.client = rest.wrap(mime).wrap(errorCode);
    },

    onRegister: function(params) {

    },

    onLogout: function() {
        this.client({ path: "/api/account/logout" }).then(
            (response) => {
                console.log(response);
            },
            (response) => {
                console.log("Error");
                console.log(response);
            }
        );
    },

    onLogin: function(email, password) {
        this.client({
            method: "POST",
            path: "/api/account/login",
            entity: {
                email: email,
                password: password
            }
        }).then(
            (response) => {
                console.log(response);
            },
            (response) => {
                console.log("Error");
                console.log(response);
            }
        );
    }
});