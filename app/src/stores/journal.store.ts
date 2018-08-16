import { observable } from 'mobx';
import moment from 'moment';

import * as Requests from "../models/requests";
import * as Responses from "../models/responses";
import { RestClient } from "./client";
import { AnalyticsStore } from './analytics.store'; 

export class JournalStore {
    editing = false;
    adding = false;
    loading = false;
    deleting = false;
    started = false; //Whether the journal page has loaded
    error: string | undefined;

    @observable
    current: Responses.JournalEntry | null = null;
    hasEntry = false;
    @observable
    date: Date | undefined;
    @observable
    showCalendar = false;

    constructor(private analyticsStore: AnalyticsStore) {
    }

    add(entry: string) {
        this.adding = true;
        this.error = undefined;

        this.analyticsStore.onJournalAdd(entry);

        RestClient.post("/api/journal", {
            entries: [ entry ],
            date: moment(this.date).format("YYYY-M-D")
        })
        .then(response => {
            this.adding = false;
            if (response.entity.success) {
                this.current = response.entity.result;
                this.hasEntry = true;
            } else {
                this.error = response.entity.error;
            }
        })
        .catch(err => this.error = err.message)
        .finally(() => this.adding = false);
    }

    edit(req: Requests.EditJournalEntry) {
        this.editing = true;
        this.error = undefined;

        this.analyticsStore.onJournalEdit(req);

        if (this.current == null) {
            return;
        }

        let entries = this.current.entries.slice(0);

        if (!req.entry) {
            entries.splice(req.index, 1);
        } else {
            entries[req.index] = req.entry;
        }

        RestClient.put("/api/journal/" + this.current.id, {
            entries: entries
        })
        .then(response => {
            this.editing = false;
            if (response.entity.success) {
                //We're relying on the current to be updated client-side due to delays in indexing in ES
                if (this.current != null) {
                    this.current.entries = entries;
                } else {
                    this.error = "Something went wrong, please refresh";
                }
            } else {
                this.error = response.entity.error;
            }
        })
        .catch(err => this.error = err.message)
        .finally(() => this.editing = false);
    }

    delete() {
        this.deleting = true;
        this.error = undefined;

        this.analyticsStore.onJournalDelete();

        if (this.current == null) {
            return;
        }

        RestClient.del("/api/journal/" + this.current.id)
            .then(response => {
                if (response.entity.success) {
                    this.hasEntry = false;
                    this.current = null;
                    
                } else {
                    this.error = response.entity.error;
                }
            })
            .catch(err => this.error = err.message)
            .finally(() => this.deleting = false);
    }

    get(date: Date) {
        this.loading = true;
        this.error = undefined;

        RestClient.get("/api/journal/" + moment(date).format("YYYY-M-D"))
            .then(response => {
                this.loading = false;
                this.date = date;
                this.started = true;
                this.showCalendar = false;

                if (response.entity.success) {
                    this.current = response.entity.result;
                    this.hasEntry = true;
                } else {
                    this.hasEntry = false;
                    this.current = null;
                }
            })
            .catch(err => {
                this.started = true;
                this.loading = false;
                this.showCalendar = false;
                this.hasEntry = false;
                this.current = null;
                this.error = err.message;
            })
            .finally(() => this.loading = false);
    }

    toggleCalendar(show: boolean) {
        this.showCalendar = show;
    }
}
