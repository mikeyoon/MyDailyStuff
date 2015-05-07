/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import Responses = require("../models/responses");
import TypedReact = require('typed-react');

var d = jsnox(React);

export interface JournalProps {
    flux: any;
    date: Date;
}

export interface JournalState {
    journal: any;
}

export class JournalComponent extends TypedReact.Component<JournalProps, JournalState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux() {
        return {
            journal: this.getFlux().store("journal")
        };
    }

    componentDidMount() {
        var date: Date = this.props.date ? this.props.date : new Date();
        console.log(date);
        this.getFlux().actions.journal.get(date);
    }

    handleAddEntry(entry: string, ev: any) {
        this.getFlux().actions.journal.add(entry);
    }

    handleEditEntry(entry: string, index: number, ev: any) {
        this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(entry, index));
    }

    handleDeleteEntry(index: number, ev: any) {

    }

    renderEntries() {
        console.log(this.state.journal.hasEntry);
        if (this.state.journal.hasEntry) {
            return this.state.journal.entries.map((e: Responses.JournalEntry, index: number) => {
                return d("div", { key: index }, e);
            });
        }
    }

    render() {
        return d("div.row", {}, [
            d("div.col-md-12", {}, [
                this.renderEntries()
            ])
        ]);
    }
}
export var Component = TypedReact.createClass(JournalComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("journal")]);
