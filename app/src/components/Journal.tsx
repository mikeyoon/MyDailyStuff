/// <reference path='../../typings/browser.d.ts' />

import * as React from 'react';
import * as Requests from "../models/requests";
import * as Responses from "../models/responses";
import * as moment from 'moment';
import * as page from 'page';
import DatePicker from 'react-date-picker';
import Streak from './Streak';
import BaseFluxxorComponent from "./BaseFluxxorComponent";

declare var $:any;

export interface JournalProps {
    flux: any;
    date: Date;
}

interface JournalState {
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

export default class JournalComponent extends BaseFluxxorComponent<JournalProps, JournalState> {
    getWatchers() { return ['journal']; }

    refreshStreak:boolean;

    getStateFromFlux():JournalState {
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

    componentWillReceiveProps(nextProps:JournalProps) {
        this.getFlux().actions.journal.get(nextProps.date);
        //this.getFlux().actions.search.date(nextProps.date);
        this.validate();
    }

    componentWillMount() {
        this.getFlux().actions.journal.get(this.props.date);
    }

    componentWillUpdate(_:any, nextState:JournalState) {
        this.refreshStreak = !nextState.deleting && this.state.deleting
            || !nextState.adding && this.state.adding;
    }

    componentDidMount() {
        window.addEventListener('touchend', this.closeCalendar, false);
        window.addEventListener('click', this.closeCalendar, false);
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.closeCalendar, false);
        window.removeEventListener('touchend', this.closeCalendar, false);
    }

    validate():boolean {
        var errors:any = {};

        if (this.state.newEntry.length > 500) {
            errors["newEntry"] = "Entry must be 500 characters or less";
        } else if (this.state.current && this.state.current.entries.length >= 10) {
            errors["newEntry"] = "Only 10 entries are allowed per day";
        }

        this.setState({errors: errors});
        return !Object.keys(errors).length;
    }

    handleAddEntry(ev:any) {
        ev.preventDefault();

        if (this.validate()) {
            if (this.state.hasEntry) {
                this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(this.state.newEntry, this.state.current.entries.length));
            } else {
                this.getFlux().actions.journal.add(this.state.newEntry);
            }
        }
    }

    handleEditEntry(entry:string, index:number, ev:any) {
        this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(entry, index));
    }

    handleDeleteEntry(index:number, ev:any) {
        if (this.state.current.entries.length > 1) {
            this.getFlux().actions.journal.edit(new Requests.EditJournalEntry(null, index));
        } else {
            this.getFlux().actions.journal.delete();
        }
    }

    handleDeleteAll(ev:any) {
        this.getFlux().actions.journal.delete();
    }

    handleTextChange(name:string, ev:any) {
        var state:any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    handlePrev(date:moment.Moment, ev:any) {
        ev.preventDefault();
        page('/journal/' + date.format("YYYY-M-D"));
    }

    handleNext(date:moment.Moment, ev:any) {
        ev.preventDefault();
        page('/journal/' + date.format("YYYY-M-D"));
    }

    handleDateChange(dateText:string, date:moment.Moment, ev:any) {
        page('/journal/' + date.format("YYYY-M-D"));
    }

    closeCalendar(ev:any) {
        if (this.state.showCalendar && !$(ev.target).closest('.popover').length) {
            this.getFlux().actions.journal.toggleCalendar(false);
        }
    }

    handleToggleCalendar(show:boolean, ev:any) {
        ev.preventDefault();
        if (!this.state.showCalendar) this.getFlux().actions.journal.toggleCalendar(show);
    }

    handleKeyDown(ev:any) {
        if ((ev.keyCode == 10 || ev.keyCode == 13) && ev.ctrlKey) {
            this.handleAddEntry(ev);
        }
    }

    handleBlur(ev:any) {
        this.validate();
    }

    renderEntries() {
        if (this.state.hasEntry) {
            return <div className="margin-top-md">
                {this.state.current.entries.map((e:string, index:number) =>
                    <div className="well" key={index}>
                        <button className="btn btn-clear pull-right" key="delete"
                                onClick={(ev) => this.handleDeleteEntry(index, ev)}>
                            <span className="glyphicon glyphicon-remove"/>
                        </button>
                    </div>)
                }
            </div>;
        } else if (this.state.started) {
            return <h3 className="text-center">No entries...try to remember!</h3>;
        } else {
            return <div className="margin-top-md">
                <div className="progress">
                    <div className="progress-bar progress-bar-striped active" role="progressbar"
                         style={{width: "100%"}}></div>
                </div>
            </div>;
        }
    }

    render() {
        var today = moment(this.state.date || this.props.date);
        var next = moment(this.state.date || this.props.date).add(1, 'day');
        var prev = moment(this.state.date || this.props.date).add(-1, 'day');

        return <div className="row">
            <div className="col-md-8 col-md-offset-2">
                <h2 className="text-center">
                    <button className={"btn btn-link " + this.state.loading ? "disabled" : ""} key="prev"
                            onClick={(ev) => this.handlePrev(prev, ev)}>
                        <span className="glyphicon glyphicon-menu-left"/>
                    </button>
                    <a href="#" className={this.state.showCalendar ? "active" : ""}
                       onClick={(ev) => this.handleToggleCalendar(true, ev)}>
                        {today.format("ddd, MMM Do YYYY")}
                    </a>
                    <button className={"btn btn-link " + this.state.loading ? "disabled" : ""} key="next"
                            style={{visibility: moment().diff(next) >= 0 ? 'visible' : 'hidden'}}
                            onClick={(ev) => this.handleNext(next, ev)}>
                        <span className="glyphicon glyphicon-menu-right"/>
                    </button>
                </h2>

                <div className={"popover-container " + this.state.showCalendar ? "" : "hidden"}>
                    <div className="popover bottom" ref="popover" style={{display: "block", margin: "0 auto"}}>
                        <div className="arrow" style={{left: "50%"}}></div>
                        <div className="popover-content">
                            <DatePicker maxDate={new Date()} date={today.toDate()} onChange={this.handleDateChange}/>
                        </div>
                    </div>
                </div>

                {this.renderEntries()}

                <hr />

                {this.state.serviceError ? <div className="alert alert-danger">{this.state.serviceError}</div> : null}

                {(!this.state.current || this.state.current.entries.length < 7) ?
                <form onSubmit={this.handleAddEntry}>
                    <div className={"form-group " + this.state.errors["newEntry"] ? "has-error" : ""}>
                        <label className="control-label pull-left">Add a new entry (markdown)</label>
                        <label className="pull-right"><Streak flux={this.getFlux()} update={this.refreshStreak}/></label>
                        <textarea placeholder="New entry..." className="form-control"
                                  rows="4" style={{width: "100%"}} value={this.state.newEntry}
                                  onKeyDown={this.handleKeyDown} onBlur={this.handleBlur}
                                  maxLength="500" onChange={(ev) => this.handleTextChange("newEntry", ev)}/>
                        {this.state.errors["newEntry"] ? <span className="help-block">{this.state.errors["newEntry"]}</span> : null}
                    </div>

                    <button
                        className={"btn btn-primary " + (Object.keys(this.state.errors).length || !this.state.newEntry) ? 'disabled' : ''}
                        type="submit" onClick={this.handleAddEntry}>
                        Add
                    </button>
                    <span className="margin-small">(or press ctrl + enter)</span>
                </form> :
                <div className="alert alert-info">You've got {this.state.current.entries.length} entries, that should cover it!</div>
                }
            </div>
        </div>
    }
}