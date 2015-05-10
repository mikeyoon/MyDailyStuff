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

var JournalStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.JOURNAL.GET, this.onGet,
            actions.constants.JOURNAL.DELETE, this.onDelete,
            actions.constants.JOURNAL.EDIT, this.onEdit,
            actions.constants.JOURNAL.ADD, this.onAdd
        );

        this.current = null;
        this.hasEntry = false;
        this.date = new Date();

        this.client = rest.wrap(mime).wrap(errorCode);
    },

    onAdd: function(entry: string) {

    },

    onEdit: function(req: Requests.EditJournalEntry) {
        if (!req.entry) {
            this.current.entries.splice(req.index, 1);
        } else {
            this.current.entries[req.index] = req.entry;
        }

        console.log(this.current.entries);
        this.client({
            method: "PUT",
            path: "/api/journal/" + this.current.id,
            entity: JSON.stringify({
                entries: this.current.entries
            })
        }).then(
            (response: rest.Response) => {
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
            }
        )
    },

    onDelete: function() {
        this.client({
            method: "DELETE",
            path: "/api/journal/" + this.current.id
        }).then(
            (response: rest.Response) => {
                this.hasEntry = false;
                this.current = null;
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
            }
        )
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
                    this.current = response.entity.result;

                    this.date = new Date(this.current.create_date);
                    this.hasEntry = true;

                } else {
                    this.hasEntry = false;
                    this.current = null;
                    this.date = date;
                }
                this.emit("change");
            },
            (response: rest.Response) => {
                console.log(response);
                this.emit("change");
            }
        );
    }
});

export = JournalStore;