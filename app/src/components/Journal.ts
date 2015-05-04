/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import Responses = require("../models/responses");

var d = jsnox(React);

var Journal = React.createClass({
    mixins: [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("journal")],

    getStateFromFlux: function() {
        return {
            journal: this.getFlux().store("journal")
        };
    },

    componentDidMount: function() {
        var date: Date = this.props.date ? new Date(this.props.date) : new Date();
        console.log(date);
        this.getFlux().actions.journal.get(date);
    },

    handleAddEntry: function(entry: string, ev: any) {
        this.getFlux().actions.journal.add(entry);
    },

    handleEditEntry: function(entry: string, index: number, ev: any) {
        this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(entry, index));
    },

    handleDeleteEntry: function(index: number, ev: any) {

    },

    renderEntries: function() {
        console.log(this.state.journal.hasEntry);
        if (this.state.journal.hasEntry) {
            return this.state.journal.entries.map((e: Responses.JournalEntry, index: number) => {
                return d("div", { key: index }, e);
            });
        }
    },

    render: function() {
        return d("div.row", {}, [
            d("div.col-md-12", {}, [
                this.renderEntries()
            ])
        ]);
    }
});

export = Journal;