import Requests = require("./models/requests");

var c = {
    ACCOUNT: {
        LOGIN: "ACCOUNT:LOGIN",
        PROFILE: "ACCOUNT:PROFILE",
        REGISTER: "ACCOUNT:REGISTER",
        LOGOUT: "ACCOUNT:LOGOUT",
        VERIFY: "ACCOUNT:VERIFY",
        RESET_PASSWORD: "ACCOUNT:RESET_PASSWORD",
        SEND_RESET: "ACCOUNT:SEND_RESET",
        SAVE_PROFILE: "ACCOUNT:SAVE_PROFILE",
        CLEAR_STORE: "ACCOUNT:CLEAR_STORE",
        GET_STREAK: "ACCOUNT:GET_STREAK"
    },

    JOURNAL: {
        GET: "JOURNAL:GET",
        ADD: "JOURNAL:ADD",
        EDIT: "JOURNAL:EDIT",
        DELETE: "JOURNAL:DELETE"
    },

    SEARCH: {
        DATE: "SEARCH:DATE",
        QUERY: "SEARCH:QUERY"
    },

    ROUTE: {
        HOME: "ROUTE:HOME",
        SEARCH: "ROUTE:SEARCH"
    }
};

var methods = {
    journal: {
        add: function(entry: string) {
            this.dispatch(c.JOURNAL.ADD, entry);
        },
        edit: function(entry: Requests.EditJournalEntry) {
            this.dispatch(c.JOURNAL.EDIT, entry);
        },
        get: function(date: Date) {
            this.dispatch(c.JOURNAL.GET, date);
        },
        delete: function() {
            this.dispatch(c.JOURNAL.DELETE);
        }
    },
    search: {
        date: function(date: Date) {
            this.dispatch(c.SEARCH.DATE, date);
        },
        query: function(query: string) {
            this.dispatch(c.SEARCH.QUERY, query);
        }
    },
    account: {
        login: function(payload: Requests.Login) {
            this.dispatch(c.ACCOUNT.LOGIN, payload);
        },
        profile: function() {
            this.dispatch(c.ACCOUNT.PROFILE);
        },
        logout: function() {
            this.dispatch(c.ACCOUNT.LOGOUT);
        },
        register: function(payload: Requests.Register) {
            this.dispatch(c.ACCOUNT.REGISTER, payload);
        },
        verify: function(token: string) {
            this.dispatch(c.ACCOUNT.VERIFY, token);
        },
        sendReset: function(email: string) {
            this.dispatch(c.ACCOUNT.SEND_RESET, email);
        },
        resetPassword: function(payload: Requests.PasswordReset) {
            this.dispatch(c.ACCOUNT.RESET_PASSWORD, payload);
        },
        saveProfile: function(payload: Requests.SaveProfile) {
            this.dispatch(c.ACCOUNT.SAVE_PROFILE, payload);
        },
        clearResults: function() {
            this.dispatch(c.ACCOUNT.CLEAR_STORE);
        },
        getStreak: function(force: boolean) {
            this.dispatch(c.ACCOUNT.GET_STREAK, force);
        }
    },
    routes: {
        home: function() {
            this.dispatch(c.ROUTE.HOME);
        },
        search: function(query: string) {
            this.dispatch(c.ROUTE.SEARCH, query);
        }
    }
};

var actions = {
    methods: methods,
    constants: c
};

export = actions;