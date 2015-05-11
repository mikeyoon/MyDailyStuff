/// <reference path='../../node_modules/typed-react/typed-react.d.ts' />
/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');
import page = require('page');

var d = jsnox(React);

export interface LoginProps {
    flux: any;
}

export interface LoginState {
    email: string;
    password: string;
    auth: any;
}

export class LoginComponent extends TypedReact.Component<LoginProps, LoginState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux() {
        var result = {
            auth: this.getFlux().store("auth"),
        };

        return result;
    }

    onSubmit(ev:any) {
        ev.preventDefault();
        this.getFlux().actions.account.login(new Requests.Login(this.state.email, this.state.password));
    }

    handleTextChange(name:string, ev:any) {
        var state:any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    renderLoginError() {
        if (this.state.auth.loginResult && this.state.auth.loginResult.success == false) {
            return d("div.alert.alert-danger", this.state.auth.loginResult.error);
        }

        return null;
    }

    render() {
        return d("div.row", {}, [
            d("div.col-md-6.col-md-offset-3", {}, [
                d("h3", "Login to your account"),
                d("br"),
                this.renderLoginError(),
                d("form", {onSubmit: this.onSubmit}, [
                    d("div.form-group", {key: "1"}, [
                        d("label", {htmlFor: "email"}, "Email:"),
                        d("input.form-control#email[name=email]", {
                            value: this.state.email,
                            onChange: this.handleTextChange.bind(this, "email")
                        })
                    ]),
                    d("div.form-group", {key: "2"}, [
                        d("label", {htmlFor: "password"}, "Password:"),
                        d("input.form-control#password[name=password][type=password]", {
                            value: this.state.password,
                            onChange: this.handleTextChange.bind(this, "password")
                        })
                    ]),
                    d("button.btn.btn-primary[type=submit]", "Login"),
                    d("span.margin-small", "or"),
                    d("a[href=/register]", "Register for a new account")
                ])
            ])
        ]);
    }
}

export var Component = TypedReact.createClass(LoginComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);