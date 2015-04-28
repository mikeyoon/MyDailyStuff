var c = {
    ACCOUNT: {
        LOGIN: "ACCOUNT:LOGIN",
        PROFILE: "ACCOUNT:PROFILE",
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
        add: function(entry) {
            this.dispatch(c.JOURNAL.ADD, entry);
        },
        edit: function(entry) {
            this.dispatch(c.JOURNAL.EDIT, entry);
        },
        get: function(date) {
            this.dispatch(c.JOURNAL.GET, date);
        },
        delete: function(id) {
            this.dispatch(c.JOURNAL.DELETE, id);
        }
    },
    account: {
        login: function(email, password) {
            this.dispatch(c.ACCOUNT.LOGIN, {
                email: email,
                password: password
            });
        },
        profile: function() {
            this.dispatch(c.ACCOUNT.PROFILE);
        },
        logout: function() {
            this.dispatch(c.ACCOUNT.LOGOUT);
        }
    }
};

var actions = {
    methods: methods,
    constants: c
};

export = actions;