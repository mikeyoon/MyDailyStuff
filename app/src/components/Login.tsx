import * as React from 'react';
import classNames from 'classnames';

import * as Requests from "../models/requests";
import { BaseProps } from '../types';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';

const emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

@observer
export class LoginComponent extends React.Component<BaseProps> {
    @observable email = '';
    @observable password = '';
    @observable persist = false;
    @observable errors: { [field: string]: string } = {};
    @observable validated = false;

    isValid(): boolean {
        return this.props.store.authStore.loginError == null;
    }

    @action
    validate(): boolean {
        this.errors = {};
        this.validated = true;

        if (!this.email) {
            this.errors["email"] = "Email is required";
        }
        else if (!emailRegex.test(this.email)) {
            this.errors["email"] = "Email is invalid";
        }

        if (!this.password || this.password.length < 6) {
            this.errors["password"] = "Password needs to be 6 or more characters";
        } else if (this.password && this.password.length > 50) {
            this.errors["password"] = "Password needs to be less than 50 characters";
        }

        return !Object.keys(this.errors).length;
    }

    @action.bound
    onSubmit(ev:any) {
        ev.preventDefault();
        if (this.validate()) {
            this.props.store.authStore.login(
                new Requests.Login(this.email, this.password, this.persist)
            );
        }
    }

    @action
    updateEmail(email: string) {
        this.email = email;
    }

    @action
    updatePassword(password: string) {
        this.password = password;
    }

    @action
    updatePersist(persist: boolean) {
        this.persist = persist;
    }

    renderLoginError() {
        if (this.props.store.authStore.loginError) {
            return <div className="alert alert-danger">{this.props.store.authStore.loginError}</div>;
        }

        return null;
    }

    render() {
        const formClass = classNames('needs-validation', { "was-validated": this.validated });
        return <div className="row">
            <div className="col-lg-6 offset-lg-3 col-md-8 offset-md-2 col-sm-12">
                <h3 className="text-center">Login to your account</h3>
                <br />
                {this.renderLoginError()}
                <form onSubmit={this.onSubmit.bind(this)} className={formClass}>
                    <div className={"form-group " + (this.errors["email"] ? 'has-error' : '')} key="1">
                        <label htmlFor="email">Email:</label>
                        <input className="form-control" id="email" name="email" value={this.email} onChange={e => this.updateEmail(e.target.value)} />
                        {this.errors["email"] ? <span className="invalid-feedback">{this.errors["email"]}</span> : null}
                    </div>
                    <div className={"form-group " + (this.errors["password"] ? 'has-error' : '')} key="2">
                        <label htmlFor="password">Password:</label>
                        <input className="form-control" id="password" name="password" type="password" value={this.password} onChange={e => this.updatePassword(e.target.value)} />
                        {this.errors["password"] ? <span className="invalid-feedback">{this.errors["password"]}</span> : null}
                    </div>
                    <div className="form-row" key="3">
                        <div className="col form-group">
                            <div className="form-check">
                                <input className="align-middle form-check-input" id="rememberMe" name="persist" type="checkbox" checked={this.persist} value="persist" onChange={e => this.updatePersist(e.target.checked)} />
                                <label className="form-check-label align-middle" htmlFor="rememberMe">Keep me logged in</label>
                            </div>
                        </div>
                        <div className="col form-group text-right">
                            <a className="btn btn-link" href="/forgot-password">I forgot my password</a>
                        </div>
                    </div>
                    <div className="text-center" key="4">
                        <button className="btn btn-primary" type="submit">Login</button>
                        <span className="margin-small">or</span>
                        <a href="/register">Register for a new account</a>
                    </div>
                </form>
            </div>
        </div>
    }
}