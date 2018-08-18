import * as React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import * as Requests from "../models/requests";
import { BaseProps } from '../types';

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

@observer
export class ProfileComponent extends React.Component<BaseProps> {
    @observable errors: { [field: string]: string } = {};
    @observable password = '';
    @observable confirm = '';

    isValid(): boolean {
        return !this.errors;
    }

    onSubmit(ev: any) {
        ev.preventDefault();
        if (this.validate()) {
            if (this.confirm == this.password) {
                this.props.store.authStore.updateProfile(new Requests.SaveProfile(this.password));
            }
        }
    }

    passwordChanged(password: string) {
        this.password = password;
    }

    confirmChanged(password: string) {
        this.confirm = password;
    }

    validate(): boolean {
        var errors: any = {};

        if (this.confirm != this.password) {
            errors["password"] = "passwords do not match";
            errors["confirm"] = "passwords do not match";
        } else if (!this.password || this.password.length < 6) {
            errors["password"] = "Password needs to be 6 or more characters";
        } else if (this.password && this.password.length > 50) {
            errors["password"] = "Password needs to be less than 50 characters";
        }

        this.setState({ errors: errors });
        return !Object.keys(errors).length;
    }

    renderProfileError() {
        if (this.props.store.authStore.saveError) {
            return <div className="alert alert-danger">{this.props.store.authStore.saveError}</div>;
        }

        return null;
    }

    render() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <h3 className="text-center">Update Your Profile</h3>
                <br />
                {this.renderProfileError()}
                {this.props.store.authStore.saved ? <div className="alert alert-success">Profile Updated Successfully</div> : null}

                <form onSubmit={this.onSubmit.bind(this)}>
                    <div className="form-group" key="1">
                        <label className="control-label" htmlFor="email">Email:</label>
                        <input className="form-control" id="email" name="email" defaultValue={this.props.store.authStore.email} disabled={true} />
                    </div>
                    <div className={"form-group " + (this.errors["password"] ? 'has-error' : '')} key="2">
                        <label className="control-label" htmlFor="password">Password:</label>
                        <input className="form-control" id="password" name="password" type="password" value={this.password}
                               onChange={e => this.passwordChanged(e.target.value)} />
                        {this.errors["password"] ? <span className="help-block">{this.errors["password"]}</span> : null}
                    </div>

                    <div className={"form-group " + (this.errors["confirm"] ? 'has-error' : '')} key="3">
                        <label className="control-label" htmlFor="password">Confirm Password:</label>
                        <input className="form-control" id="confirm" name="confirm" type="password" value={this.confirm}
                               onChange={e => this.confirmChanged(e.target.value)} />
                        {this.errors["confirm"] ? <span className="help-block">{this.errors["confirm"]}</span> : null}
                    </div>
                    <div className="text-center">
                        <button className="btn btn-primary" type="submit">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>;
    }
}