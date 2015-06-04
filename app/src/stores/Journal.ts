/// <reference path='../../typings/page/page.d.ts' />
/// <reference path='../../typings/rest/rest.d.ts' />
/// <reference path='../../typings/fluxxor/fluxxor.d.ts' />

import rest = require('rest');
import mime = require('rest/interceptor/mime');
import errorCode = require('rest/interceptor/errorCode');
import Fluxxor = require('fluxxor');
import actions = require('../actions');
import moment = require('moment');
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

        this.editing = false;
        this.loading = false;
        this.deleting = false;
        this.started = false; //Whether the journal page has loaded
        this.error = null;

        this.current = null;
        this.hasEntry = false;
        this.date = null;

        this.client = rest.wrap(mime).wrap(errorCode);
    },

    onAdd: function(entry: string) {
        this.editing = true;
        this.emit('change');

        this.client({
            method: "POST",
            path: "/api/journal",
            entity: JSON.stringify({
                entries: [ entry ],
                date: moment(this.date).format("YYYY-M-D")
            })
        }).then(
            (response: rest.Response) => {
                this.editing = false;
                if (response.entity.success) {
                    this.current = response.entity.result;
                    this.hasEntry = true;
                    this.error = null;
                } else {
                    this.error = response.entity.error;
                }

                this.emit('change');
            },
            (response: rest.Response) => {
                this.editing = false;
                console.log(response);
                this.emit('change');
            }
        )
    },

    onEdit: function(req: Requests.EditJournalEntry) {
        this.editing = true;
        this.emit('change');

        if (!req.entry) {
            this.current.entries.splice(req.index, 1);
        } else {
            this.current.entries[req.index] = req.entry;
        }

        //console.log(this.current.entries);
        this.client({
            method: "PUT",
            path: "/api/journal/" + this.current.id,
            entity: JSON.stringify({
                entries: this.current.entries
            })
        }).then(
            (response: rest.Response) => {
                this.editing = false;
                if (response.entity.success) {
                    //We're relying on the current to be updated client-side due to delays in indexing in ES
                    this.emit("change");
                    this.error = null;
                } else {
                    this.error = response.entity.error;
                }
            },
            (response: rest.Response) => {
                this.editing = false;
                console.log(response);
                this.emit('change');
            }
        )
    },

    onDelete: function() {
        this.deleting = true;
        this.emit('change');

        this.client({
            method: "DELETE",
            path: "/api/journal/" + this.current.id
        }).then(
            (response: rest.Response) => {
                this.deleting = false;

                if (response.entity.success) {
                    this.hasEntry = false;
                    this.current = null;
                    this.error = null;
                } else {
                    this.error = response.entity.error;
                }

                this.emit("change");
            },
            (response: rest.Response) => {
                this.deleting = false;
                console.log(response);
                this.emit('change');
            }
        )
    },

    onGet: function(date: Date) {
        this.loading = true;
        this.emit('change');

        this.client({
            method: "GET",
            path: "/api/journal/" + moment(date).format("YYYY-M-D")
        }).then(
            (response: rest.Response) => {
                this.loading = false;
                this.date = date;
                this.started = true;

                if (response.entity.success) {
                    this.current = response.entity.result;
                    this.hasEntry = true;

                } else {
                    this.hasEntry = false;
                    this.current = null;
                }

                this.emit("change");
            },
            (response: rest.Response) => {
                this.started = true;
                this.loading = false;
                console.log(response);
                this.hasEntry = false;
                this.current = null;

                this.emit("change");
            }
        );
    }
});

export = JournalStore;