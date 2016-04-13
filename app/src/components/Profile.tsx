/// <reference path='../../typings/browser.d.ts' />

import * as React from 'react';
import * as Requests from "../models/requests";
import BaseFluxxorComponent from "./BaseFluxxorComponent";

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

export default class ProfileComponent extends BaseFluxxorComponent<ProfileProps, ProfileState> {
    getWatchers() { return ['auth']; }
    
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
            return <div className="alert alert-danger">{this.state.auth.error}</div>;
        }

        return null;
    }

    render() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <h3 className="text-center">Update Your Profile</h3>
                <br />
                {this.renderProfileError()}
                {this.state.auth.saveProfileResult.success ? <div className="alert alert-success">Profile Updated Successfully</div> : null}
            </div>
            <form onSubmit={this.onSubmit}>
                <div className="form-group" key="1">
                    <label className="control-label" htmlFor="email">Email:</label>
                    <input className="form-control" id="email" name="email" defaultValue={this.state.email} disabled="disabled" />
                </div>
                <div className={"form-group " + (this.state.errors["password"] ? 'has-error' : '')} key="2">
                    <label className="control-label" htmlFor="password">Password:</label>
                    <input className="form-control" id="password" name="password" type="password" value={this.state.password}
                           onChange={this.handleTextChange.bind(this, "password")} />
                    {this.state.errors["password"] ? <span className="help-block">{this.state.errors["password"]}</span> : null}
                </div>

                <div className={"form-group " + (this.state.errors["confirm"] ? 'has-error' : '')} key="3">
                    <label className="control-label" htmlFor="password">Confirm Password:</label>
                    <input className="form-control" id="confirm" name="confirm" type="password" value={this.state.confirm}
                           onChange={this.handleTextChange.bind(this, "confirm")} />
                    {this.state.errors["confirm"] ? <span className="help-block">{this.state.errors["confirm"]}</span> : null}
                </div>
                <div className="text-center">
                    <button className="btn btn-primary" type="submit">Save Changes</button>
                </div>
            </form>
        </div>;
    }
}