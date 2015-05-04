/// <reference path='../../typings/page/page.d.ts' />
/// <reference path='../../typings/rest/rest.d.ts' />
/// <reference path='../../typings/fluxxor/fluxxor.d.ts' />

import rest = require('rest');
import mime = require('rest/interceptor/mime');
import errorCode = require('rest/interceptor/errorCode');
import Fluxxor = require('fluxxor');
import actions = require('../actions');
import Requests = require("../models/requests");

var JournalStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.JOURNAL.GET, this.onGet
            //actions.constants.JOURNAL.DELETE, this.onDelete,
            //actions.constants.JOURNAL.EDIT, this.onEdit
        );

        this.entries = [];
        this.hasEntry = false;
        this.date = new Date();
        this.userId = null;

        this.client = rest.wrap(mime).wrap(errorCode);
    },

    onGet: function(date: Date) {
        console.log("onGet " + date);
        this.client({
            method: "GET",
            //TODO: Use momentjs or something
            path: "/api/journal/" + date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate()
        }).then(
            (response: rest.Response) => {
                if (response.entity.success) {
                    this.hasEntry = true;
                    var result = response.entity.result;
                    this.entries = result.entries;
                    this.date = result.date;
                    this.userId = result.userId;
                } else {
                    this.hasEntry = false;
                    this.entries = [];
                    this.date = date;
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                //this.registerResult = {
                //    success: false,
                //    message: "Failed"
                //};
                this.emit("change");
            }
        );
    }
});

export = JournalStore;