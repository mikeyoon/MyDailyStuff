/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import Responses = require("../models/responses");
import TypedReact = require('typed-react');
import moment = require('moment');
import marked = require('marked');
import page = require('page');
import DatePicker = require('react-date-picker');

declare var $: any;

import Streak = require('./Streak');

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
    loading?: boolean;
    adding?: boolean;
    editing?: boolean;
    deleting?: boolean;
    started?: boolean;
    streak?: number;
    serviceError?: string;
    showCalendar?: boolean;
}

export class JournalComponent extends TypedReact.Component<JournalProps, JournalState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    //calendar: Pikaday;

    getFlux: () => Fluxxor.Flux;

    refreshStreak: boolean;

    getStateFromFlux(): JournalState {
        var journal = this.getFlux().store("journal");

        return {
            current: journal.current,
            date: journal.date,
            hasEntry: journal.hasEntry,
            newEntry: '',
            errors: {},
            serviceError: journal.error,
            adding: journal.adding,
            loading: journal.loading,
            editing: journal.editing,
            deleting: journal.deleting,
            started: journal.started,
            showCalendar: journal.showCalendar
        };
    }

    componentWillReceiveProps(nextProps: JournalProps) {
        this.getFlux().actions.journal.get(nextProps.date);
        //this.getFlux().actions.search.date(nextProps.date);
        this.validate();
    }

    componentWillMount() {
        this.getFlux().actions.journal.get(this.props.date);
    }

    componentWillUpdate(_: any, nextState: JournalState) {
        this.refreshStreak = !nextState.deleting && this.state.deleting
            || !nextState.adding && this.state.adding;
    }

    componentDidMount() {
        $('.calendar-picker').popup({
            position: 'bottom center',
            preserve: true,
            on: 'click',
            popup: '.popup',
            setFluidWidth: true
        });

        $(document).on('touchend', this.closeCalendar);
        $(document).on('click', this.closeCalendar);
    }

    componentWillUnmount() {
        $(document).off('touchend', this.closeCalendar);
        $(document).off('click', this.closeCalendar);
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

    static handlePrev(date: moment.Moment, ev: any) {
        ev.preventDefault();
        page('/journal/' + date.format("YYYY-M-D"));
    }

    static handleNext(date: moment.Moment, ev: any) {
        ev.preventDefault();
        page('/journal/' + date.format("YYYY-M-D"));
    }

    handleDateChange(dateText: string, date: moment.Moment, ev: any) {
        $('.calendar-picker').popup('hide');
        page('/journal/' + date.format("YYYY-M-D"));
    }

    closeCalendar(ev: any) {
        if (this.state.showCalendar && !$(ev.target).closest('.popover').length) {
            this.getFlux().actions.journal.toggleCalendar(false);
        }
    }

    handleToggleCalendar(show: boolean, ev: any) {
        //ev.preventDefault();
        //if (!this.state.showCalendar) this.getFlux().actions.journal.toggleCalendar(show);
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
            return d('div.margin-top-md', {}, this.state.current.entries.map((e: string, index: number) => {
                return d("div.ui.raised.clearing.segment", { key: index }, [
                    d("div.journal-entry", { dangerouslySetInnerHTML: { __html: marked(e) }}),

                    d('button.ui.clear.right.floated.button.icon', { key: "delete", onClick: this.handleDeleteEntry.bind(this, index) },
                        d('i.remove.icon')),
                    //d('button.btn.btn-default.pull-right', { key: "edit", onClick: this.handleEditEntry.bind(this, index) },
                    //    d('span.glyphicon.glyphicon-edit')),


                ]);
            }));
        } else if (this.state.started) {
            return d('div.ui.container.center.aligned.margin-top-md', {}, d('h2.ui.header', "No entries...try to remember!"));
        } else {
            return d('div.margin-top-md', {},
                d('div.ui.active.inverted.dimmer', {}, d('div.ui.text.loader', 'Loading'))
            );
        }
    }

    render() {
        var today = moment(this.state.date || this.props.date);
        var next = moment(this.state.date || this.props.date).add(1, 'day');
        var prev = moment(this.state.date || this.props.date).add(-1, 'day');

        return d("div", {}, [
            d('div.ui.container.center.aligned', {}, [
                d('h2', {}, [
                    d('a[href=#]' + (this.state.loading ? '.disabled' : ''),
                        { key: 'prev', onClick: JournalComponent.handlePrev.bind(this, prev) },
                        d('i.icon.angle.left')),
                    d('a[href=#].calendar-picker' + (this.state.showCalendar ? '.active' : ''), { }, today.format("ddd, MMM Do YYYY")),

                    d('a[href=#]' + (this.state.loading ? '.disabled' : ''),
                        { key: 'next',  style: {visibility: moment().diff(next) >= 0 ? 'visible' : 'hidden'}, onClick: JournalComponent.handleNext.bind(this, next) },
                        d('i.icon.angle.right')),
                ]),
            ]),

            d('div.entries', { key: 2 }, this.renderEntries()),

            d('div.ui.divider'),

            this.state.serviceError ? d("div.alert.alert-danger", this.state.serviceError) : null,

            !this.state.current || this.state.current.entries.length < 7 ?
                d("form.ui.form", { onSubmit: this.handleAddEntry }, [
                    d('div', {style:{'margin-bottom':'2px'}}, [
                        d('div', { key: '1', style:{float:'left'} }, d("label", "Add a new entry (markdown)")),
                        d('div', { key: '2', style:{float:'right'} }, d("label", {}, d(Streak.Component, { flux: this.getFlux(), update: this.refreshStreak })))
                    ]),
                    d('div.spacer', {key: 'spacer'}),
                    d("div.field" + (this.state.errors["newEntry"] ? '.has-error' : ''), {}, [
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
                    d('button.ui.primary.button[type=submit]' + (Object.keys(this.state.errors).length || !this.state.newEntry ? '.disabled' : ''),
                        { onClick: this.handleAddEntry }, "Add"),
                    d('span.margin-small', "(or press ctrl + enter)")
                ]) : d('div.alert.alert-info', "You've got " + this.state.current.entries.length + " entries, that should cover it!"),

            d('div.ui.small.popup', { style: {'min-width':'330px'} }, d(DatePicker, { maxDate: new Date(), date: today, onChange: this.handleDateChange }))
        ]);
    }
}
export var Component = TypedReact.createClass(JournalComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("journal")]);
