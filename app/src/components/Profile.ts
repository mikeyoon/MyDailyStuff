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
    errors?: string[];
    errorFields?: any;
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
            errorFields: {}
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

        this.setState({ errors: errors, errorFields: fields });

        return !errors.length;
    }

    renderProfileError() {
        var errors: string[] = this.state.errors ? this.state.errors.slice() : [];
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
                d("h3.text-center", "Update Your Profile"),
                d("br"),
                this.renderProfileError(),

                this.state.auth.saveProfileResult.success ?
                    d('div.alert.alert-success', "Profile Updated Successfully") : null,

                d("form", { onSubmit: this.onSubmit }, [
                    d("div.form-group" + (this.state.errorFields["email"] ? '.has-error' : ''), { key: "1" }, [
                        d("label.control-label", { htmlFor: "email" }, "Email:"),
                        d("input.form-control#email[name=email]", { defaultValue: this.state.email, disabled: true })
                    ]),
                    d("div.form-group" + (this.state.errorFields["password"] ? '.has-error' : ''), { key: "2" }, [
                        d("label.control-label", { htmlFor: "password" }, "Password:"),
                        d("input.form-control#password[name=password][type=password]", { value: this.state.password, onChange: this.handleTextChange.bind(this, "password") })
                    ]),
                    d("div.form-group" + (this.state.errorFields["confirm"] ? '.has-error' : ''), { key: "3" }, [
                        d("label.control-label", { htmlFor: "confirm" }, "Confirm Password:"),
                        d("input.form-control#confirm[name=confirm][type=password]", { value: this.state.confirm, onChange: this.handleTextChange.bind(this, "confirm") })
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