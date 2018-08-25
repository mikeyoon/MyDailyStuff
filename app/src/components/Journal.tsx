import * as React from "react";
import { observable, action, when } from "mobx";
import { observer } from "mobx-react";
import DayPicker from "react-day-picker";
import { Manager, Reference, Popper } from "react-popper";
import marked from "marked";
import moment from "moment";
import { GoChevronRight, GoChevronLeft, GoX } from "react-icons/go";

import * as Requests from "../models/requests";
import { StreakComponent } from "./Streak";
import { BaseProps } from "../types";

import "react-day-picker/lib/style.css";

@observer
export class JournalComponent extends React.Component<BaseProps> {
  @observable
  errors: { [field: string]: string } = {};
  @observable
  newEntry = "";
  @observable
  showCalendar = false;

  node: any;

  componentDidMount() {
    window.addEventListener("click", e => this.handleClickOutside(e), false);
    window.addEventListener("touchend", e => this.handleClickOutside(e), false);
  }

  componentWillUnmount() {
    window.removeEventListener("click", e => this.handleClickOutside(e), false);
    window.removeEventListener(
      "touchend",
      e => this.handleClickOutside(e),
      false
    );
  }

  @action
  handleClickOutside(ev: MouseEvent | TouchEvent) {
    if (this.node != null && !this.node.contains(ev.target)) {
      this.showCalendar = false;
    }
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

        when(
          () => !this.props.store.journalStore.editing,
          () => {
            if (this.props.store.journalStore.error == null) {
              this.newEntry = "";
            }
          }
        );
      } else {
        this.props.store.journalStore.add(this.newEntry);

        when(
          () => !this.props.store.journalStore.adding,
          () => {
            if (this.props.store.journalStore.error == null) {
              this.newEntry = "";
            }
          }
        );
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
    this.props.store.routeStore.setDate(date.subtract(1, "day").toDate());
  }

  handleNext(ev: React.MouseEvent) {
    ev.preventDefault();
    const date = moment(this.props.store.journalStore.date);
    this.props.store.routeStore.setDate(date.add(1, "day").toDate());
  }

  @action
  handleDateChange(date: Date) {
    date.setHours(0, 0, 0, 0);
    if (date <= new Date()) {
      this.props.store.routeStore.setDate(date);
      this.showCalendar = false;
    }
  }

  @action
  handleToggleCalendar(ev: React.MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    this.showCalendar = !this.showCalendar;
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
        <div className="journal mt-4">
          {this.props.store.journalStore.current.entries.map(
            (e: string, index: number) => (
              <div className="card" key={index}>
                <button
                  className="btn btn-outline-secondary btn-sm btn-journal-delete"
                  key="delete"
                  onClick={ev => this.handleDeleteEntry(index, ev)}
                >
                  <GoX />
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
        <div className="mt-4">
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
          <div className="text-center journal-header">
            <button
              className={
                "btn btn-link " +
                (this.props.store.journalStore.loading ? "disabled" : "")
              }
              key="prev"
              onClick={e => this.handlePrev(e)}
            >
              <GoChevronLeft />
            </button>

            <Manager>
              <Reference>
                {({ ref }) => (
                  <button
                    type="button"
                    className="btn btn-link date-toggle"
                    ref={ref}
                    onClick={e => this.handleToggleCalendar(e)}
                  >
                    <h2>{today.format("ddd, MMM Do YYYY")}</h2>
                  </button>
                )}
              </Reference>
              {this.showCalendar ? (
                <Popper placement="bottom" eventsEnabled={true}>
                  {({ ref, style, placement, arrowProps }) => (
                    <div
                      className="daypicker-container"
                      ref={node => (this.node = node) && ref(node)}
                      style={style}
                      data-placement={placement}
                    >
                      <DayPicker
                        toMonth={new Date()}
                        disabledDays={{ after: new Date() }}
                        selectedDays={this.props.store.journalStore.date}
                        onDayClick={e => this.handleDateChange(e)}
                      />
                      {/* <div
                        ref={arrowProps.ref}
                        style={arrowProps.style}
                        data-placement={placement}
                      /> */}
                    </div>
                  )}
                </Popper>
              ) : null}
            </Manager>

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
              <GoChevronRight />
            </button>
          </div>

          {this.renderEntries()}

          <hr className="mt-4" />

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
