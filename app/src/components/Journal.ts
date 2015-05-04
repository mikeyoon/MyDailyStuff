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

    handleAddEntry: function()

    renderEntries: function() {
        console.log(this.state.journal.hasEntry);
        if (this.state.journal.hasEntry) {
            return this.state.journal.entry.entries.map((e: Responses.JournalEntry) => {
                return d("div", e);
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