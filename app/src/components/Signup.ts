/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');

var d = jsnox(React);

interface SignupProps {
    flux: any;
}

interface SignupState {
    auth: any;
    email: string;
    password: string;
}

export class SignupComponent extends TypedReact.Component<SignupProps, SignupState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux() {
        return {
            auth: this.getFlux().store("auth")
        };
    }

    onSubmit(ev: any) {
        ev.preventDefault();
        this.getFlux().actions.account.register(new Requests.Register(this.state.email, this.state.password));
    }

    handleTextChange(name: string, ev: any) {
        var state: any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    renderSignupError() {
        if (this.state.auth.registerResult && !this.state.auth.registerResult.success) {
            return d("div.alert.alert-danger", this.state.auth.registerResult.error);
        }

        return null;
    }

    render() {
        return d("div.row", {}, [
            d("div.col-md-6.col-md-offset-3", {}, [
                d("h3", "Register for an account"),
                d("br"),
                this.renderSignupError(),
                d("form", { onSubmit: this.onSubmit }, [
                    d("div.form-group", { key: "1" }, [
                        d("label", { htmlFor: "email" }, "Email:"),
                        d("input.form-control#email[name=email]", { value: this.state.email, onChange: this.handleTextChange.bind(this, "email") })
                    ]),
                    d("div.form-group", { key: "2" }, [
                        d("label", { htmlFor: "password" }, "Password:"),
                        d("input.form-control#password[name=password][type=password]", { value: this.state.password, onChange: this.handleTextChange.bind(this, "password") })
                    ]),
                    d("button.btn.btn-primary[type=submit]", "Register"),
                    d("span.margin-small", "or"),
                    d("a[href=/login]", "Login with an existing account")
                ])
            ])
        ]);
    }
}

export var Component = TypedReact.createClass(SignupComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);