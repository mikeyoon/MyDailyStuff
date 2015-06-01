/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');

var d = jsnox(React);

interface ForgotProps {
    flux: any;
    token: string;
}

interface ForgotState {
    auth?: any;
    password?: string;
    confirm?: string;
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
            this.getFlux().actions.account.resetPassword(new Requests.PasswordReset(this.props.token, this.state.password));
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

                this.state.auth.resetPasswordResult.success ?
                    d('div', {}, [
                        d('div.alert.alert-success', {}, [
                            "Your password has been reset. Click ",
                            d("a[href=/login]", "here"),
                            " to login."
                        ]),
                    ]) :
                    d("form", { onSubmit: this.onSubmit }, [
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
                        d("div.text-center", {}, d("button.btn.btn-primary[type=submit]", "Reset Password"))
                    ])
            ])
        ]);
    }
}

export var Component = TypedReact.createClass(ForgotComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);