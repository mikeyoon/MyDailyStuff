/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import Responses = require("../models/responses");
import TypedReact = require('typed-react');
import moment = require('moment');
import marked = require('marked');
//import Pikaday = require('pikaday');
var d = jsnox(React);

export interface JournalProps {
    flux: any;
    date: Date;
}

export interface JournalState {
    current?: Responses.JournalEntry;
    date?: Date;
    hasEntry?: boolean;
    newEntry?: string;
    errors?: any;
}

export class JournalComponent extends TypedReact.Component<JournalProps, JournalState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    //calendar: Pikaday;

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux(): JournalState {
        var journal = this.getFlux().store("journal");
        return {
            current: journal.current,
            date: journal.date,
            hasEntry: journal.hasEntry,
            newEntry: '',
            errors: {}
        };
    }

    componentWillReceiveProps(nextProps: JournalProps) {
        this.getFlux().actions.journal.get(nextProps.date);
        this.getFlux().actions.search.date(nextProps.date);
        this.validate();
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

    validate(): boolean {
        var errors: any = {};

        if (this.state.newEntry.length > 500) {
            errors["newEntry"] = "Entry must be 500 characters or less";
        } else if (this.state.current && this.state.current.entries.length >= 10) {
            errors["newEntry"] = "Only 10 entries are allowed per day";
        }

        this.setState({ errors: errors });
        return !Object.keys(errors).length;
    }

    handleAddEntry(ev: any) {
        ev.preventDefault();

        if (this.validate()) {
            if (this.state.hasEntry) {
                this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(this.state.newEntry, this.state.current.entries.length));
            } else {
                this.getFlux().actions.journal.add(this.state.newEntry);
            }
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

    static handlePrev(ev: any) {
        ev.preventDefault();
        //this.getFlux().actions.journal.get(new Date('1/1/2001'))
    }

    static handleNext(ev: any) {
        ev.preventDefault();
        //this.getFlux().actions.journal.get(new Date('1/1/2002'))
    }

    handleKeyDown(ev: any) {
        if ((ev.keyCode == 10 || ev.keyCode == 13) && ev.ctrlKey) {
            this.handleAddEntry(ev);
        }
    }

    handleBlur(ev: any) {
        this.validate();
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
        var next = moment(this.props.date).add(1, 'day');
        var prev = moment(this.props.date).add(-1, 'day');

        return d("div.row", {}, [
            d("div.col-md-8.col-md-offset-2", {}, [
                d('h2.text-center', {}, [
                    d('small.margin-small', { key: "prev" },
                        d('a[href=/journal/' + prev.format("YYYY-M-D") + ']', { onClick: JournalComponent.handlePrev }, "< prev")),
                    today.format("ddd, MMM Do YYYY"),
                    d('small.margin-small', { style: { visibility: moment().diff(next) >= 0 ? 'visible' : 'hidden' }, key: "next" },
                        d('a[href=/journal/' + next.format("YYYY-M-D") + ']', { onClick: JournalComponent.handleNext }, "next >"))
                ]),

                this.state.hasEntry ? this.renderEntries() : d('h3.text-center', "No entries...try to remember!"),

                d('hr'),

                !this.state.current || this.state.current.entries.length < 7 ?
                    d("form", { onSubmit: this.handleAddEntry }, [
                        d("div.form-group" + (this.state.errors["newEntry"] ? '.has-error' : ''), {}, [
                            d("label.control-label", "Add a new entry (markdown)"),
                            d("textarea[placeholder=New entry...].form-control", {
                                rows: 4,
                                style: { width: "100%" },
                                value: this.state.newEntry,
                                onKeyDown: this.handleKeyDown,
                                onBlur: this.handleBlur,
                                maxLength: 500,
                                onChange: this.handleTextChange.bind(this, "newEntry") }),
                            this.state.errors["newEntry"] ? d("span.help-block", this.state.errors["newEntry"]) : null
                        ]),
                        d('button.btn.btn-primary[type=submit]' + (Object.keys(this.state.errors).length || !this.state.newEntry ? '.disabled' : ''),
                            { onClick: this.handleAddEntry }, "Add"),
                        d('span.margin-small', "(or press ctrl + enter)")
                    ]) : d('div.alert.alert-info', "You've got " + this.state.current.entries.length + " entries, that should cover it!"),
                //d("div#calendar", { ref: 'calendar'}, d('input#asdf'))
            ])
        ]);
    }
}
export var Component = TypedReact.createClass(JournalComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("journal")]);
