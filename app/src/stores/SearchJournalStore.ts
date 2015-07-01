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

const LIMIT = 10;

var SearchJournalStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.SEARCH.DATE, this.onDateSearch,
            actions.constants.SEARCH.QUERY, this.onQuerySearch,
            actions.constants.SEARCH.CLEAR, this.onClear
        );

        this.searchResults = [];
        this.dates = [];
        this.query = "";
        this.searching = false;
        this.total = null;
        this.nextOffset = null;
        this.prevOffset = null;
        this.offset = 0;
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

    onQuerySearch: function(req: Requests.Search) {
        //console.log(this.current.entries);
        this.searching = true;
        this.emit("change");

        //Set query after the change so it won't update until after the request completes
        this.query = req.query;
        this.offset = req.offset;

        this.client({
            method: "POST",
            path: "/api/search/",
            entity: JSON.stringify({
                query: req.query,
                offset: req.offset,
                limit: LIMIT,
            })
        }).then(
            (response: rest.Response) => {
                if (response.entity.success) {
                    this.searchResults = response.entity.result.map(function(r: Responses.JournalEntry) {
                        return {
                            entries: r.entries,
                            id: r.id,
                            date: r.date
                        };
                    });
                    this.total = response.entity.total || 0;
                    this.searching = false;
                    this.nextOffset = (req.offset + LIMIT) < this.total ? req.offset + LIMIT : null;
                    this.prevOffset = req.offset > 0 ? req.offset - LIMIT : null;

                    this.emit("change");
                }
            },
            (response: rest.Response) => {
                console.log(response);
                this.nextOffset = null;
                this.prevOffset = null;
                this.searching = false;

                this.emit("change")
            }
        )
    },

    onClear: function() {
        this.query = "";
        this.total = 0;
        this.nextOffset = 0;
        this.prevOffset = 0;
        this.searchResults = [];
        this.emit('change');
    }
});

export = SearchJournalStore;