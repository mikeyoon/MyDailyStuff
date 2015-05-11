/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import Responses = require("../models/responses");
import TypedReact = require('typed-react');
import moment = require('moment');
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

    componentWillReceiveProps(nextProps: JournalProps) {
        this.getFlux().actions.journal.get(nextProps.date);
    }

    componentDidMount() {
        //var date: Date = this.props.date ? this.props.date : new Date();
        //console.log(date);
        //this.getFlux().actions.journal.get(date);
    }

    handleAddEntry(ev: any) {
        ev.preventDefault();
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

    renderEntries() {
        if (this.state.hasEntry) {
            return this.state.current.entries.map((e: string, index: number) => {
                return d("div.panel.panel-default", { key: index },
                    d("div.panel-body", {}, [
                        d('span', e),
                        d('button.btn.btn-default.pull-right', { onClick: this.handleDeleteEntry.bind(this, index) },
                            d('span.glyphicon.glyphicon-remove'))
                    ])
                );
                //return d("li.list-group-item", { key: index }, [
                //    d('span', e),
                //    d('button.btn.btn-default.pull-right', { onClick: this.handleDeleteEntry.bind(this, index) },
                //        d('span.glyphicon.glyphicon-remove'))
                //]);
            });
        }
    }

    render() {
        var today = moment(this.props.date).format("MMM Do YYYY");
        var next = moment(this.props.date).add(1, 'day').format("YYYY-M-D");
        var prev = moment(this.props.date).add(-1, 'day').format("YYYY-M-D");

        return d("div.row", {}, [
            d("div.col-md-8.col-md-offset-2", {}, [
                d('h2.text-center', {}, [
                    d('small.margin-small', { key: "prev" }, d('a[href=/journal/' + prev + ']', { onClick: this.handlePrev }, "prev")),
                    today,
                    d('small.margin-small', { key: "next" }, d('a[href=/journal/' + next + ']', { onClick: this.handleNext }, "next"))
                ]),
                //d('div', {}, [
                //    d('div-col-md-2', 'prev'),
                //    d('div-col-md-4', {},
                //        ,
                //    d('div-col-md-2', 'next')
                //]),

                this.state.hasEntry ? this.renderEntries() : null,

                d("form", { onSubmit: this.handleAddEntry }, [
                    d("div.form-group", {}, [
                        d("label", "Add a new entry"),
                        d("textarea[placeholder=New entry...]", {
                            rows: 4,
                            style: { width: "100%" },
                            value: this.state.newEntry,
                            onChange: this.handleTextChange.bind(this, "newEntry") })
                    ]),
                    d('button.btn.btn-primary[type=submit]', { onClick: this.handleAddEntry }, "Add")
                ])

                //d('div.panel.panel-default', {},
//                    d('div.panel-body', {},
//                        d('div.input-group', {}, [
//                            d('input.form-control[placeholder=New entry...][type=text]', { onChange: this.handleTextChange.bind(this, "newEntry") }),
//                            d('span.input-group-btn', {}, [
//                                d('button.btn.btn-default[type=button]', { onClick: this.handleAddEntry }, "Add")
//                            ])
//                        ]),
//                    )),

                //d("ul.list-group", {}, [
                //    this.state.hasEntry ? this.renderEntries() : null,
                //    d("li.list-group-item", {},
                //        d('div.input-group', {}, [
                //            d('input.form-control[placeholder=New entry...][type=text]', { onChange: this.handleTextChange.bind(this, "newEntry") }),
                //            d('span.input-group-btn', {}, [
                //                d('button.btn.btn-default[type=button]', { onClick: this.handleAddEntry }, "Add")
                //            ])
                //        ])
                //    )
                //]),
                //d("button.btn.btn-danger", { onClick: this.handleDeleteAll }, "Delete All")

            ])
        ]);
    }
}
export var Component = TypedReact.createClass(JournalComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("journal")]);
