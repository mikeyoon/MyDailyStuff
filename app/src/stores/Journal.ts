import rest = require('rest');
import mime = require('rest/interceptor/mime');
import errorCode = require('rest/interceptor/errorCode');
import * as Fluxxor from 'fluxxor';
import actions from '../actions';
import moment = require('moment');
import * as Requests from "../models/requests";

var JournalStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.JOURNAL.GET, this.onGet,
            actions.constants.JOURNAL.DELETE, this.onDelete,
            actions.constants.JOURNAL.EDIT, this.onEdit,
            actions.constants.JOURNAL.ADD, this.onAdd,
            actions.constants.JOURNAL.TOGGLE_CALENDAR, this.onToggleCalendar
        );

        this.editing = false;
        this.adding = false;
        this.loading = false;
        this.deleting = false;
        this.started = false; //Whether the journal page has loaded
        this.error = null;

        this.current = null;
        this.hasEntry = false;
        this.date = null;
        this.showCalendar = false;

        this.client = rest.wrap(mime).wrap(errorCode);
    },

    onAdd: function(entry: string) {
        this.adding = true;
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
                this.adding = false;
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
                this.adding = false;
                console.log(response);
                this.emit('change');
            }
        )
    },

    onEdit: function(req: Requests.EditJournalEntry) {
        this.editing = true;
        this.emit('change');

        var entries = this.current.entries.slice(0);

        if (!req.entry) {
            entries.splice(req.index, 1);
        } else {
            entries[req.index] = req.entry;
        }

        this.client({
            method: "PUT",
            path: "/api/journal/" + this.current.id,
            entity: JSON.stringify({
                entries: entries
            })
        }).then(
            (response: rest.Response) => {
                this.editing = false;
                if (response.entity.success) {
                    //We're relying on the current to be updated client-side due to delays in indexing in ES
                    this.error = null;
                    this.current.entries = entries;
                } else {
                    this.error = response.entity.error;
                }
                this.emit("change");
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
                this.showCalendar = false;

                if (response.entity.success) {
                    this.current = response.entity.result;
                    this.hasEntry = true;
                    this.error = null;
                } else {
                    this.hasEntry = false;
                    this.current = null;
                }

                this.emit("change");
            },
            (response: rest.Response) => {
                this.started = true;
                this.loading = false;
                this.showCalendar = false;
                console.log(response);
                this.hasEntry = false;
                this.current = null;

                this.emit("change");
            }
        );
    },

    onToggleCalendar: function(show: boolean) {
        this.showCalendar = show;
        this.emit('change');
    }
});

export default JournalStore;