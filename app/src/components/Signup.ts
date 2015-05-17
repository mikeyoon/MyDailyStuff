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
    errors?: string[];
    errorFields?: any;
}

var emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class SignupComponent extends TypedReact.Component<SignupProps, SignupState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    isValid(): boolean {
        return !this.state.errors;
    }

    getStateFromFlux() {
        var result = {
            auth: this.getFlux().store("auth"),
            errorFields: {}
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
        var errors: string[] = [];
        var fields: any = {};

        if (this.state.confirm != this.state.password) {
            errors.push('Passwords do not match');
            fields["password"] = true;
            fields["confirm"] = true;
        }

        if (!this.state.password || this.state.password.length < 6) {
            errors.push('Password needs to be 6 or more characters');
            fields["password"] = true;
        }

        if (this.state.password && this.state.password.length > 50) {
            errors.push('Password needs to be less than 50 characters');
            fields["password"] = true;
        }

        if (!emailRegex.test(this.state.email)) {
            errors.push('Email is invalid');
            fields["email"] = true;
        }

        this.setState({ errors: errors, errorFields: fields });

        return !errors;
    }

    renderSignupError() {
        var errors: string[] = this.state.errors ? this.state.errors : [];
        if (this.state.auth && this.state.auth.registerResult && this.state.auth.registerResult.success == false) {
            errors.push(this.state.auth.registerResult.error);
        }

        if (errors.length) return d("div.alert.alert-danger", {}, d('ul', {}, errors.map((err, ii) => {
            return d('li', { key: ii }, err);
        })));

        return null;
    }

    render() {
        return d("div.row", {}, [
            d("div.col-md-6.col-md-offset-3", {}, [
                d("h3", "Register for an account"),
                d("br"),
                this.renderSignupError(),
                d("form", { onSubmit: this.onSubmit }, [
                    d("div.form-group" + (this.state.errorFields["email"] ? '.has-error' : ''), { key: "1" }, [
                        d("label.control-label", { htmlFor: "email" }, "Email:"),
                        d("input.form-control#email[name=email]", { value: this.state.email, onChange: this.handleTextChange.bind(this, "email") })
                    ]),
                    d("div.form-group" + (this.state.errorFields["password"] ? '.has-error' : ''), { key: "2" }, [
                        d("label.control-label", { htmlFor: "password" }, "Password:"),
                        d("input.form-control#password[name=password][type=password]", { value: this.state.password, onChange: this.handleTextChange.bind(this, "password") })
                    ]),
                    d("div.form-group" + (this.state.errorFields["confirm"] ? '.has-error' : ''), { key: "3" }, [
                        d("label.control-label", { htmlFor: "confirm" }, "Confirm Password:"),
                        d("input.form-control#confirm[name=confirm][type=password]", { value: this.state.confirm, onChange: this.handleTextChange.bind(this, "confirm") })
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