/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");

var d = jsnox(React);

var Login = React.createClass({
    mixins: [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")],

    getStateFromFlux: function() {
        return {
            auth: this.getFlux().store("auth")
        };
    },

    onSubmit: function(ev: any) {
        ev.preventDefault();
        this.getFlux().actions.account.login(new Requests.Login(this.state.email, this.state.password));
    },

    handleTextChange: function(name: string, ev: any) {
        var state: any = {};
        state[name] = ev.target.value;
        this.setState(state);
    },

    render: function() {
        return d("div.row", {}, [
            d("div.col-md-12", {}, [
                d("form", { onSubmit: this.onSubmit }, [
                    d("div.form-group", { key: "1" }, [
                        d("label", { htmlFor: "email" }, "Email:"),
                        d("input.form-control#email[name=email]", { value: this.state.email, onChange: this.handleTextChange.bind(this, "email") })
                    ]),
                    d("div.form-group", { key: "2" }, [
                        d("label", { htmlFor: "password" }, "Password:"),
                        d("input.form-control#password[name=password][type=password]", { value: this.state.password, onChange: this.handleTextChange.bind(this, "password") })
                    ]),
                    d("button.btn.btn-default[type=submit]", "Submit")
                ])
            ])
        ]);
    }
});

export = Login;