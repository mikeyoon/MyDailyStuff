/// <reference path='../../typings/tsd.d.ts' />

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');

var d = jsnox(React);

interface ProfileProps {
    flux: any;
}

interface ProfileState {
    auth?: any;
    email?: string;
    password?: string;
    confirm?: string;
    errors?: any;
}

export class ProfileComponent extends TypedReact.Component<ProfileProps, ProfileState>
implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    isValid(): boolean {
        return !this.state.errors;
    }

    componentDidMount() {
        this.getFlux().actions.account.clearResults();
    }

    getStateFromFlux() {
        var store = this.getFlux().store("auth");

        var result = {
            auth: store,
            email: store.user ? store.user.email : null,
            password: '',
            confirm: '',
            errors: {}
        };

        return result;
    }

    onSubmit(ev: any) {
        ev.preventDefault();
        if (this.validate()) {
            if (this.state.confirm == this.state.password) {
                this.getFlux().actions.account.saveProfile(new Requests.SaveProfile(this.state.password));
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

        this.setState({ errors: errors });
        return !Object.keys(errors).length;
    }

    renderProfileError() {
        if (this.state.auth.error) {
            return d("div.alert.alert-danger", this.state.auth.error);
        }

        return null;
    }

    render() {
        return d("div.row", {}, [
            d("div.col-md-6.col-md-offset-3", {}, [
                d("h3.text-center", "Update Your Profile"),
                d("br"),
                this.renderProfileError(),

                this.state.auth.saveProfileResult.success ?
                    d('div.alert.alert-success', "Profile Updated Successfully") : null,

                d("form", { onSubmit: this.onSubmit }, [
                    d("div.form-group", { key: "1" }, [
                        d("label.control-label", { htmlFor: "email" }, "Email:"),
                        d("input.form-control#email[name=email]", { defaultValue: this.state.email, disabled: true })
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
                        d("button.btn.btn-primary[type=submit]", "Save Changes")
                    ])
                ])
            ])
        ]);
    }
}

export var Component = TypedReact.createClass(ProfileComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);