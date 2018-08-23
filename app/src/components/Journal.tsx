import * as React from "react";
import { observable, action, when } from "mobx";
import { observer } from "mobx-react";
import DatePicker from "react-datepicker";
import marked from "marked";
import moment from "moment";

import * as Requests from "../models/requests";
import { StreakComponent } from "./Streak";
import { BaseProps } from "../types";

class ExampleCustomInput extends React.Component<{
  showCalendar: boolean;
  onClick: (ev: React.MouseEvent) => void;
  value: string;
}> {
  handleClick(ev: React.MouseEvent) {
    ev.preventDefault();
    this.props.onClick(ev);
  }

  render() {
    return (
      <a
        href="#"
        className={this.props.showCalendar ? "active" : ""}
        onClick={e => this.handleClick(e)}
      >
        {this.props.value}
      </a>
    );
  }
}

@observer
export class JournalComponent extends React.Component<BaseProps> {
  @observable
  errors: { [field: string]: string } = {};
  @observable
  newEntry = "";
  @observable
  showCalendar = false;
  componentWillUnmount() {
    // window.removeEventListener("click", this.closeCalendar, false);
    // window.removeEventListener("touchend", this.closeCalendar, false);
  }

  @action
  validate(): boolean {
    this.errors = {};

    if (this.newEntry.length > 500) {
      this.errors["newEntry"] = "Entry must be 500 characters or less";
    } else if (
      this.props.store.journalStore.current &&
      this.props.store.journalStore.current.entries.length >= 10
    ) {
      this.errors["newEntry"] = "Only 10 entries are allowed per day";
    }

    return Object.keys(this.errors).length <= 0;
  }

  @action
  newEntryChanged(text: string) {
    this.newEntry = text;
  }

  @action
  handleAddEntry = (ev: React.MouseEvent | React.FormEvent) => {
    ev.preventDefault();

    if (this.validate()) {
      if (this.props.store.journalStore.current != null) {
        this.props.store.journalStore.edit(
          new Requests.EditJournalEntry(
            this.newEntry,
            this.props.store.journalStore.current.entries.length
          )
        );

        const done = when(() => !this.props.store.journalStore.editing, () => {
          done();
          if (this.props.store.journalStore.error == null) {
            this.newEntry = '';
          }
        });
      } else {
        this.props.store.journalStore.add(this.newEntry);

        const done = when(() => !this.props.store.journalStore.adding, () => {
          done();
          if (this.props.store.journalStore.error == null) {
            this.newEntry = '';
          }
        });
      }
    }
  };

  handleEditEntry(entry: string, index: number, ev: Event) {
    this.props.store.journalStore.edit(
      new Requests.EditJournalEntry(entry, index)
    );
    
  }

  handleDeleteEntry(index: number, ev: React.MouseEvent) {
    if (this.props.store.journalStore.current != null) {
      if (this.props.store.journalStore.current.entries.length > 1) {
        this.props.store.journalStore.edit(
          new Requests.EditJournalEntry(null, index)
        );
      } else {
        this.props.store.journalStore.delete();
      }
    }
  }

  handleDeleteAll(ev: Event) {
    this.props.store.journalStore.delete();
  }

  handlePrev(ev: React.MouseEvent) {
    ev.preventDefault();
    const date = moment(this.props.store.journalStore.date);
    this.props.store.routeStore.setDate(date.subtract(1, "day"));
  }

  handleNext(ev: React.MouseEvent) {
    ev.preventDefault();
    const date = moment(this.props.store.journalStore.date);
    this.props.store.routeStore.setDate(date.add(1, "day"));
  }

  handleDateChange(date: moment.Moment) {
    this.props.store.routeStore.setDate(date);
  }

  handleToggleCalendar(show: boolean, ev: React.MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    if (!this.props.store.journalStore.showCalendar) {
      this.props.store.journalStore.toggleCalendar(show);
    }
  }

  handleKeyDown = (ev: any) => {
    if ((ev.keyCode == 10 || ev.keyCode == 13) && ev.ctrlKey) {
      this.handleAddEntry(ev);
    }
  };

  handleBlur = (ev: any) => {
    this.validate();
  };

  renderEntries() {
    if (this.props.store.journalStore.current != null) {
      return (
        <div className="margin-top-md journal">
          {this.props.store.journalStore.current.entries.map(
            (e: string, index: number) => (
              <div className="card" key={index}>
                <button
                  className="btn btn-clear btn-journal-delete"
                  key="delete"
                  onClick={ev => this.handleDeleteEntry(index, ev)}
                >
                  <span className="glyphicon glyphicon-remove" />
                </button>
                <div
                  className="card-body journal-entry"
                  dangerouslySetInnerHTML={{ __html: marked(e) }}
                />
              </div>
            )
          )}
        </div>
      );
    } else if (this.props.store.journalStore.started) {
      return <h3 className="text-center">No entries...try to remember!</h3>;
    } else {
      return (
        <div className="margin-top-md">
          <div className="progress">
            <div
              className="progress-bar progress-bar-striped active"
              role="progressbar"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      );
    }
  }

  render() {
    var today = moment(this.props.store.journalStore.date);
    var next = moment(this.props.store.journalStore.date).add(1, "day");
    var prev = moment(this.props.store.journalStore.date).add(-1, "day");

    return (
      <div className="row">
        <div className="col-lg-8 offset-lg-2 col-md-10 offset-md-1 col-sm-12">
          <h2 className="text-center">
            <button
              className={
                "btn btn-link " +
                (this.props.store.journalStore.loading ? "disabled" : "")
              }
              key="prev"
              onClick={e => this.handlePrev(e)}
            >
              <span className="glyphicon glyphicon-menu-left" />
            </button>

            <DatePicker
              customInput={<ExampleCustomInput />}
              dateFormat="ddd, MMM Do YYYY"
              maxDate={moment()}
              selected={today}
              onChange={date => date != null && this.handleDateChange(date)}
            />

            <button
              className={
                "btn btn-link " +
                (this.props.store.journalStore.loading ? "disabled" : "")
              }
              key="next"
              style={{
                visibility: moment().diff(next) >= 0 ? "visible" : "hidden"
              }}
              onClick={ev => this.handleNext(ev)}
            >
              <span className="glyphicon glyphicon-menu-right" />
            </button>
          </h2>

          <div
            className={
              "popover-container " +
              (this.props.store.journalStore.showCalendar ? "" : "hidden")
            }
          >
            <div
              className="popover bottom"
              ref="popover"
              style={{ display: "block", margin: "0 auto" }}
            >
              <div className="arrow" style={{ left: "50%" }} />
              <div className="popover-content" />
            </div>
          </div>

          {this.renderEntries()}

          <hr />

          {this.props.store.journalStore.error ? (
            <div className="alert alert-danger">
              {this.props.store.journalStore.error}
            </div>
          ) : null}

          {!this.props.store.journalStore.current ||
          this.props.store.journalStore.current.entries.length < 7 ? (
            <form onSubmit={this.handleAddEntry}>
              <div
                className={
                  "form-group " + (this.errors["newEntry"] ? "has-error" : "")
                }
              >
                <label className="control-label pull-left">
                  Add a new entry (markdown)
                </label>
                <label className="float-right">
                  <StreakComponent store={this.props.store} />
                </label>
                <textarea
                  placeholder="New entry..."
                  className="form-control"
                  rows={4}
                  style={{ width: "100%" }}
                  value={this.newEntry}
                  onKeyDown={this.handleKeyDown}
                  onBlur={this.handleBlur}
                  maxLength={500}
                  onChange={ev => this.newEntryChanged(ev.target.value)}
                />
                {this.errors["newEntry"] ? (
                  <span className="help-block">{this.errors["newEntry"]}</span>
                ) : null}
              </div>

              <button
                className={
                  "btn btn-primary " +
                  (Object.keys(this.errors).length || !this.newEntry
                    ? "disabled"
                    : "")
                }
                type="submit"
                onClick={this.handleAddEntry}
              >
                Add
              </button>
              <span className="margin-small">(or press ctrl + enter)</span>
            </form>
          ) : (
            <div className="alert alert-info">
              You've got {this.props.store.journalStore.current.entries.length}{" "}
              entries, that should cover it!
            </div>
          )}
        </div>
      </div>
    );
  }
}
