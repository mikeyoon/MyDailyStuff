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

var SearchJournalStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.SEARCH.DATE, this.onDateSearch,
            actions.constants.SEARCH.QUERY, this.onQuerySearch
        );

        this.searchResults = [];
        this.dates = [];
        this.monthYear = null;
        this.client = rest.wrap(mime).wrap(errorCode);
    },

    onDateSearch: function(date: Date) {
        var month = date.getMonth() + 1;
        var year = date.getFullYear();

        if (this.monthYear != (month + '-' + year)) {
            this.client({
                method: "POST",
                path: "/api/search/date",
                entity: JSON.stringify({
                    start: year + '-' + month + '-1',
                    end: moment(year + '-' + month + '-1', 'YYYY-M-D').add(1, 'months').format('YYYY-M-D')
                })
            }).then(
                (response: rest.Response) => {
                    if (response.entity.success) {
                        this.dates = response.entity.result;
                        this.monthYear = month + '-' + year;
                        this.emit('change');
                    }
                },
                (response: rest.Response) => {
                    console.log(response);
                }
            )
        }
    },

    onQuerySearch: function(query: string) {
        //console.log(this.current.entries);
        this.client({
            method: "POST",
            path: "/api/search/",
            entity: JSON.stringify({
                query: query
            })
        }).then(
            (response: rest.Response) => {
                if (response.entity.success) {
                    this.searchResults = response.entity.result;
                    this.emit("change");
                }
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
    }
});

export = SearchJournalStore;