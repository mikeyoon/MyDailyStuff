/// <reference path='../../typings/browser.d.ts' />

import * as React from 'react';
import classNames from 'classnames';
import { BaseProps } from '../types';
import { observable } from 'mobx';

interface ForgotProps {
    flux: any;
}

interface ForgotState {
    auth?: any;
    email?: string;
    errors?: any;
}

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

export class ForgotComponent extends React.Component<BaseProps> {
    @observable email = '';
    @observable errors: { [field: string]: string } = {};

    isValid(): boolean {
        return !this.errors;
    }

    onSubmit = (ev: any) => {
        ev.preventDefault();
        if (this.validate()) {
            this.props.store.authStore.requestReset(this.email);
        }
    };

    emailChanged(email: string) {
        this.email = email;
    }

    validate(): boolean {
        var errors: any = {};

        if (!emailRegex.test(this.email)) {
            errors["email"] = "Email is invalid";
        }

        this.setState({ errors: errors });
        return !Object.keys(errors).length;
    }

    renderErrors() {
        if (this.props.store.authStore.resetError) {
            return <div className="alert alert-danger">{this.props.store.authStore.resetError}</div>;
        }

        return null;
    }

    render() {
        let emailFormClass = classNames({ "has-error": this.errors["email"], "form-group": true });

        return <div className="row">
            <div className="col-lg-6 offset-lg-3 col-md-8 offset-md-2 col-sm-12">
                <h3 className="text-center">Reset your Password</h3>
                <br />
                {this.renderErrors()}
                {this.props.store.authStore.resetSuccess ?
                <div>
                    <div className="alert alert-success">
                        You will receive an email from us shortly if the address you provided is in our system.
                    </div>
                    <p>Click <a href="/login">here</a> to return to the login page</p>
                </div> :
                <form onSubmit={this.onSubmit.bind(this)}>
                    <div className={emailFormClass} key="1">
                        <label className="control-label" htmlFor="email">Email:</label>
                        <input className="form-control" id="email" name="email" value={this.email}
                               onChange={e => this.emailChanged(e.target.value)}/>
                        {this.errors["email"] ? <span
                            className="help-block">{this.errors["email"]}</span> : null}
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
