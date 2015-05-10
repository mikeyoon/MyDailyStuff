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
    current: Responses.JournalEntry;
    date: Date;
    hasEntry: boolean;
    newEntry: string;
}

export class JournalComponent extends TypedReact.Component<JournalProps, JournalState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux(): JournalState {
        var journal = this.getFlux().store("journal");
        return {
            current: journal.current,
            date: journal.date,
            hasEntry: journal.hasEntry,
            newEntry: ''
        };
    }

    componentDidMount() {
        var date: Date = this.props.date ? this.props.date : new Date();
        console.log(date);
        this.getFlux().actions.journal.get(date);
    }

    handleAddEntry(ev: any) {
        if (this.state.hasEntry) {
            this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(this.state.newEntry, this.state.current.entries.length));
        } else {
            this.getFlux().actions.journal.add(this.state.newEntry);
        }
    }

    handleEditEntry(entry: string, index: number, ev: any) {
        this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(entry, index));
    }

    handleDeleteEntry(index: number, ev: any) {
        this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(null, index));
    }

    handleDeleteAll(ev: any) {

    }

    handleTextChange(name:string, ev:any) {
        var state:any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    renderEntries() {
        if (this.state.hasEntry) {
            return this.state.current.entries.map((e: string, index: number) => {
                return d("li.list-group-item", { key: index }, [
                    d('span', e),
                    d('button.btn.btn-default.pull-right', { onClick: this.handleDeleteEntry.bind(this, index) },
                        d('span.glyphicon.glyphicon-remove'))
                ]);
            });
        }
    }

    render() {
        return d("div.row", {}, [
            d("div.col-md-12", {}, [
                d("ul.list-group", {}, [
                    this.state.hasEntry ? this.renderEntries() : null,
                    d("li.list-group-item", {},
                        d('div.input-group', {}, [
                            d('input.form-control[placeholder=New entry...][type=text]', { onChange: this.handleTextChange.bind(this, "newEntry") }),
                            d('span.input-group-btn', {}, [
                                d('button.btn.btn-default[type=button]', { onClick: this.handleAddEntry }, "Add")
                            ])
                        ])
                    )
                ]),
                d("button.btn.btn-danger", "Delete All")
            ])
        ]);
    }
}
export var Component = TypedReact.createClass(JournalComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("journal")]);
