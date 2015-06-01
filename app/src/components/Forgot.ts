/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');

var d = jsnox(React);

interface ForgotProps {
    flux: any;
}

interface ForgotState {
    auth?: any;
    email?: string;
    errors?: any;
}

var emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class ForgotComponent extends TypedReact.Component<ForgotProps, ForgotState>
implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    isValid(): boolean {
        return !this.state.errors;
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

    onSubmit(ev: any) {
        ev.preventDefault();
        if (this.validate()) {
            this.getFlux().actions.account.sendReset(this.state.email);
        }
    }

    handleTextChange(name: string, ev: any) {
        var state: any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    validate(): boolean {
        var errors: any = {};

        if (!emailRegex.test(this.state.email)) {
            errors["email"] = "Email is invalid";
        }

        this.setState({ errors: errors });
        return !Object.keys(errors).length;
    }

    renderErrors() {
        if (this.state.auth.error) {
            return d("div.alert.alert-danger", this.state.auth.error);
        }

        return null;
    }

    render() {
        return d("div.row", {}, [
            d("div.col-md-6.col-md-offset-3", {}, [
                d("h3.text-center", "Reset your Password"),
                d("br"),
                this.renderErrors(),

                this.state.auth.sendResetResult.success ?
                    d('div', {}, [
                        d('div.alert.alert-success', {}, [
                            "You will receive an email from us shortly if the address you provided is in our system."
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
                        d("div.text-center", {}, [
                            d("button.btn.btn-primary[type=submit]", "Send Reset Password Email"),
                            d("span.margin-small", "or"),
                            d("a[href=/login]", "Back to Login")
                        ])
                    ])
            ])
        ]);
    }
}

export var Component = TypedReact.createClass(ForgotComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);