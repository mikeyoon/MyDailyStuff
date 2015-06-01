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
    auth?: any;
    email?: string;
    password?: string;
    confirm?: string;
    errors?: any;
}

var emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class SignupComponent extends TypedReact.Component<SignupProps, SignupState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    isValid(): boolean {
        return !this.state.errors;
    }

    componentDidMount() {
        this.getFlux().actions.account.clearResults();
    }

    getStateFromFlux() {
        var result = {
            auth: this.getFlux().store("auth"),
            errors: {}
        };

        return result;
    }

    onSubmit(ev: any) {
        ev.preventDefault();
        if (this.validate()) {
            if (this.state.confirm == this.state.password) {
                this.getFlux().actions.account.register(new Requests.Register(this.state.email, this.state.password));
            }
        }
    }

    handleTextChange(name: string, ev: any) {
        var state: any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    validate(): boolean {
        var errors: any = {};

        if (this.state.confirm != this.state.password) {
            errors["password"] = "passwords do not match";
            errors["confirm"] = "passwords do not match";
        } else if (!this.state.password || this.state.password.length < 6) {
            errors["password"] = "Password needs to be 6 or more characters";
        } else if (this.state.password && this.state.password.length > 50) {
            errors["password"] = "Password needs to be less than 50 characters";
        }

        if (!emailRegex.test(this.state.email)) {
            errors["email"] = "Email is invalid";
        }

        this.setState({ errors: errors });
        return !Object.keys(errors).length;
    }

    renderSignupError() {
        if (this.state.auth.error) {
            return d("div.alert.alert-danger", this.state.auth.error);
        }

        return null;
    }

    render() {
        return d("div.row", {}, [
            d("div.col-md-6.col-md-offset-3", {}, [
                d("h3.text-center", "Register for an account"),
                d("br"),
                this.renderSignupError(),

                this.state.auth.registerResult.success ?
                d('div', {}, [
                    d('div.alert.alert-success', {}, [
                        "Verification email sent to ",
                        this.state.email,
                        ". Please check your email for directions to complete your signup.",
                    ]),
                    d('p', {}, [
                        "Click ",
                        d('a[href=/login]', "here"),
                        " to return to the login page."
                    ])
                ]) :
                d("form", { onSubmit: this.onSubmit }, [
                    d("div.form-group" + (this.state.errors["email"] ? '.has-error' : ''), { key: "1" }, [
                        d("label.control-label", { htmlFor: "email" }, "Email:"),
                        d("input.form-control#email[name=email]", { value: this.state.email, onChange: this.handleTextChange.bind(this, "email") }),
                        this.state.errors["email"] ? d("span.help-block", this.state.errors["email"]) : null
                    ]),
                    d("div.form-group" + (this.state.errors["password"] ? '.has-error' : ''), { key: "2" }, [
                        d("label.control-label", { htmlFor: "password" }, "Password:"),
                        d("input.form-control#password[name=password][type=password]", { value: this.state.password, onChange: this.handleTextChange.bind(this, "password") }),
                        this.state.errors["password"] ? d("span.help-block", this.state.errors["password"]) : null
                    ]),
                    d("div.form-group" + (this.state.errors["confirm"] ? '.has-error' : ''), { key: "3" }, [
                        d("label.control-label", { htmlFor: "confirm" }, "Confirm Password:"),
                        d("input.form-control#confirm[name=confirm][type=password]", { value: this.state.confirm, onChange: this.handleTextChange.bind(this, "confirm") }),
                        this.state.errors["confirm"] ? d("span.help-block", this.state.errors["confirm"]) : null
                    ]),
                    d("div.text-center", {}, [
                        d("button.btn.btn-primary[type=submit]", "Register"),
                        d("span.margin-small", "or"),
                        d("a[href=/login]", "Login with an existing account")
                    ])
                ])
            ])
        ]);
    }
}

export var Component = TypedReact.createClass(SignupComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);