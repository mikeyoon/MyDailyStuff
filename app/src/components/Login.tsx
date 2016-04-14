/// <reference path='../../typings/browser.d.ts' />

import * as React from 'react';
import Fluxxor = require('fluxxor');
import * as Requests from "../models/requests";
import BaseFluxxorComponent from "./BaseFluxxorComponent";

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

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export default class LoginComponent extends BaseFluxxorComponent<LoginProps, LoginState> {
    getWatchers() { return ['auth']; }

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
        return {
            auth: this.getFlux().store("auth"),
            errors: {},
            email: '',
            password: '',
            persist: false,
        };
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
            return <div className="alert alert-danger">{this.state.auth.error}</div>;
        }

        return null;
    }

    render() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <h3 className="text-center">Login to your account</h3>
                <br />
                {this.renderLoginError()}
                <form onSubmit={this.onSubmit.bind(this)}>
                    <div className={"form-group " + (this.state.errors["email"] ? 'has-error' : '')} key="1">
                        <label htmlFor="email">Email:</label>
                        <input className="form-control" id="email" name="email" value={this.state.email} onChange={this.handleTextChange.bind(this, "email")} />
                        {this.state.errors["email"] ? <span className="help-block">{this.state.errors["email"]}</span> : null}
                    </div>
                    <div className={"form-group " + (this.state.errors["password"] ? 'has-error' : '')} key="2">
                        <label htmlFor="password">Password:</label>
                        <input className="form-control" id="password" name="password" type="password" value={this.state.password} onChange={this.handleTextChange.bind(this, "password")} />
                        {this.state.errors["password"] ? <span className="help-block">{this.state.errors["password"]}</span> : null}
                    </div>
                    <div className="checkbox" key="3">
                        <label htmlFor="rememberMe">
                            <input id="rememberMe" name="persist" type="checkbox" value={this.state.persist} onChange={this.handleCheckChange.bind(this, "persist")} />
                            Keep me logged in
                        </label>
                    </div>
                    <div className="text-center" key="4">
                        <button className="btn btn-primary" type="submit">Login</button>
                        <span className="margin-small">or</span>
                        <a href="/register">Register for a new account</a>
                    </div>
                    <div className="text-center" key="5">
                        <a className="btn btn-link" href="/forgot-password">I forgot my password</a>
                    </div>
                </form>
            </div>
        </div>
    }
}