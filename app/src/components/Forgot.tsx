/// <reference path='../../typings/browser.d.ts' />

import * as React from 'react';
import classNames from 'classnames';
import BaseFluxxorComponent from "./BaseFluxxorComponent";

interface ForgotProps {
    flux: any;
}

interface ForgotState {
    auth?: any;
    email?: string;
    errors?: any;
}

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export default class ForgotComponent extends BaseFluxxorComponent<ForgotProps, ForgotState> {
    getWatchers() { return ['auth']; }
    
    isValid(): boolean {
        return !this.state.errors;
    }

    getStateFromFlux() {
        return {
            auth: this.getFlux().store("auth"),
            errors: {},
            email: ''
        };
    }

    componentDidMount() {
        this.getFlux().actions.account.clearResults();
    }

    onSubmit = (ev: any) => {
        ev.preventDefault();
        if (this.validate()) {
            this.getFlux().actions.account.sendReset(this.state.email);
        }
    };

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
            return <div className="alert alert-danger">{this.state.auth.error}</div>;
        }

        return null;
    }

    render() {
        let emailFormClass = classNames({ "has-error": this.state.errors["email"], "form-group": true });

        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <h3 className="text-center">Reset your Password</h3>
                <br />
                {this.renderErrors()}
                {this.state.auth.sendResetResult.success ?
                <div ref="success">
                    <div className="alert alert-success">
                        You will receive an email from us shortly if the address you provided is in our system.
                    </div>
                    <p>Click <a href="/login">here</a> to return to the login page</p>
                </div> :
                <form onSubmit={this.onSubmit.bind(this)} ref="form">
                    <div className={emailFormClass} key="1">
                        <label className="control-label" htmlFor="email">Email:</label>
                        <input className="form-control" id="email" name="email" value={this.state.email}
                               onChange={this.handleTextChange.bind(this, "email")}/>
                        {this.state.errors["email"] ? <span
                            className="help-block">{this.state.errors["email"]}</span> : null}
                    </div>
                    <div className="text-center">
                        <button className="btn btn-primary" type="submit">Send Reset Password Email</button>
                        <span className="margin-small">or</span>
                        <a href="/login">Back to Login</a>
                    </div>
                </form>}
            </div>
        </div>
    }
}