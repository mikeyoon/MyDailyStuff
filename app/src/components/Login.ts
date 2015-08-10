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
    email?: string;
    password?: string;
    auth?: any;
    errors?: any;
    persist?: boolean;
}

var emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class LoginComponent extends TypedReact.Component<LoginProps, LoginState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    isValid(): boolean {
        return !this.state.errors;
    }

    validate(): boolean {
        var errors: any = {};

        if (!emailRegex.test(this.state.email)) {
            errors["email"] = "Email is invalid";
        }

        if (!this.state.password || this.state.password.length < 6) {
            errors["password"] = "Password needs to be 6 or more characters";
        } else if (this.state.password && this.state.password.length > 50) {
            errors["password"] = "Password needs to be less than 50 characters";
        }

        this.setState({ errors: errors });
        return !Object.keys(errors).length;
    }

    getStateFromFlux() {
        var result = {
            auth: this.getFlux().store("auth"),
            errors: {}
        };

        return result;
    }

    componentDidMount() {
        this.getFlux().actions.account.clearResults();
    }

    onSubmit(ev:any) {
        ev.preventDefault();
        if (this.validate()) {
            this.getFlux().actions.account.login(new Requests.Login(this.state.email, this.state.password, this.state.persist));
        }
    }

    handleTextChange(name:string, ev:any) {
        var state:any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    handleCheckChange(name:string, ev:any) {
        var state:any = {};
        state[name] = ev.target.checked;
        this.setState(state);
    }

    renderLoginError() {
        if (this.state.auth.error) {
            return d("div.alert.alert-danger", this.state.auth.error);
        }

        return null;
    }

    render() {
        return d("div.ui.middle.aligned.center.aligned.grid", {}, [
            d("div.column", {}, [
                d("h2.ui.header", "Login to your account"),

                this.renderLoginError(),
                d("form.ui.large.form", {onSubmit: this.onSubmit}, [
                    d('div.ui.segment', {}, [
                        d("div.field" + (this.state.errors["email"] ? '.has-error' : ''), {key: 1}, [
                            d("label", {htmlFor: "email"}, "Email:"),
                            d("input#email[name=email]", {
                                value: this.state.email,
                                onChange: this.handleTextChange.bind(this, "email")
                            }),
                            this.state.errors["email"] ? d("span.help-block", this.state.errors["email"]) : null
                        ]),
                        d("div.field" + (this.state.errors["password"] ? '.has-error' : ''), {key: 2}, [
                            d("label", {htmlFor: "password"}, "Password:"),
                            d("input#password[name=password][type=password]", {
                                value: this.state.password,
                                onChange: this.handleTextChange.bind(this, "password")
                            }),
                            this.state.errors["password"] ? d("span.help-block", this.state.errors["password"]) : null
                        ]),
                        d("div.field", {key: 3},
                            d('div.ui.checkbox', {}, [
                                d("input#rememberMe[name=persist][type=checkbox]", {
                                    value: this.state.persist,
                                    onChange: this.handleCheckChange.bind(this, "persist")
                                }),
                                d("label", {htmlFor: "rememberMe"}, "Keep me logged in")
                            ])
                        ),
                        d("div.text-center", { key: 4 }, [
                            d("button.ui.button.primary[type=submit]", "Login"),
                            d("span.margin-small", "or"),
                            d("a[href=/register]", "Register for a new account")
                        ]),
                        d("div.text-center", { key: 5 }, d("a.btn.btn-link[href=/forgot-password]", "I forgot my password"))
                    ]),
                ])
            ])
        ]);
    }
}

export var Component = TypedReact.createClass(LoginComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);