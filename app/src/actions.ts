import Requests = require("./models/requests");

var c = {
    ACCOUNT: {
        LOGIN: "ACCOUNT:LOGIN",
        PROFILE: "ACCOUNT:PROFILE",
        REGISTER: "ACCOUNT:REGISTER",
        LOGOUT: "ACCOUNT:LOGOUT"
    },

    JOURNAL: {
        GET: "JOURNAL:GET",
        ADD: "JOURNAL:ADD",
        EDIT: "JOURNAL:EDIT",
        DELETE: "JOURNAL:DELETE"
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
        delete: function(id: string) {
            this.dispatch(c.JOURNAL.DELETE, id);
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
        }
    }
};

var actions = {
    methods: methods,
    constants: c
};

export = actions;