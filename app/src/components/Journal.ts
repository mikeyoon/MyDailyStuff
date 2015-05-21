/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import Responses = require("../models/responses");
import TypedReact = require('typed-react');
import moment = require('moment');
import marked = require('marked');
import Pikaday = require('pikaday');
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

    calendar: Pikaday;

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

    componentWillReceiveProps(nextProps: JournalProps) {
        this.getFlux().actions.journal.get(nextProps.date);
        this.getFlux().actions.search.date(nextProps.date);
    }

    componentWillMount() {
        this.getFlux().actions.journal.get(this.props.date);
    }

    componentDidMount() {
        //this.calendar = new Pikaday({
        //    container: document.getElementById('calendar'), //this.refs['calendar']
        //    field: document.getElementById('asdf')
        //});
        //
        //this.calendar.show();
    }

    handleAddEntry(ev: any) {
        ev.preventDefault();
        if (!this.state.newEntry) return;

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
        if (this.state.current.entries.length > 1) {
            this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(null, index));
        } else {
            this.getFlux().actions.journal.delete();
        }
    }

    handleDeleteAll(ev: any) {
        this.getFlux().actions.journal.delete();
    }

    handleTextChange(name:string, ev:any) {
        var state:any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    handlePrev(ev: any) {
        ev.preventDefault();
        //this.getFlux().actions.journal.get(new Date('1/1/2001'))
    }

    handleNext(ev: any) {
        ev.preventDefault();
        //this.getFlux().actions.journal.get(new Date('1/1/2002'))
    }

    handleKeyDown(ev: any) {
        if ((ev.keyCode == 10 || ev.keyCode == 13) && ev.ctrlKey) {
            this.handleAddEntry(ev);
        }
    }

    renderEntries() {
        if (this.state.hasEntry) {
            return this.state.current.entries.map((e: string, index: number) => {
                return d("div.well", { key: index }, [
                    d('button.btn.btn-clear.pull-right', { key: "delete", onClick: this.handleDeleteEntry.bind(this, index) },
                        d('span.glyphicon.glyphicon-remove')),
                    //d('button.btn.btn-default.pull-right', { key: "edit", onClick: this.handleEditEntry.bind(this, index) },
                    //    d('span.glyphicon.glyphicon-edit')),

                    d("div.journal-entry", { dangerouslySetInnerHTML: { __html: marked(e) }})
                ]);
            });
        }
    }

    render() {
        var today = moment(this.props.date);
        var next = moment(this.props.date).add(1, 'day');//.format("YYYY-M-D");
        var prev = moment(this.props.date).add(-1, 'day');//.format("YYYY-M-D");

        return d("div.row", {}, [
            d("div.col-md-8.col-md-offset-2", {}, [
                d('h2.text-center', {}, [
                    d('small.margin-small', { key: "prev" }, d('a[href=/journal/' + prev.format("YYYY-M-D") + ']', { onClick: this.handlePrev }, "< prev")),
                    today.format("ddd, MMMM Do YYYY"),
                    d('small.margin-small', { style: { visibility: moment().diff(next) >= 0 ? 'visible' : 'hidden' }, key: "next" },
                        d('a[href=/journal/' + next.format("YYYY-M-D") + ']', { onClick: this.handleNext }, "next >"))
                ]),

                this.state.hasEntry ? this.renderEntries() : d('h3.text-center', "No entries...try to remember!"),

                d('hr'),

                d("form", { onSubmit: this.handleAddEntry }, [
                    d("div.form-group", {}, [
                        d("label", "Add a new entry (markdown)"),
                        d("textarea[placeholder=New entry...]", {
                            rows: 4,
                            style: { width: "100%" },
                            value: this.state.newEntry,
                            onKeyDown: this.handleKeyDown,
                            onChange: this.handleTextChange.bind(this, "newEntry") })
                    ]),
                    d('button.btn.btn-primary[type=submit]' + (!this.state.newEntry ? '.disabled' : ''),
                        { onClick: this.handleAddEntry }, "Add"),
                    d('span.margin-small', "(or press ctrl + enter)")
                ]),
                //d("div#calendar", { ref: 'calendar'}, d('input#asdf'))
            ])
        ]);
    }
}
export var Component = TypedReact.createClass(JournalComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("journal")]);
