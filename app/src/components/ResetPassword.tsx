import * as React from 'react';
import * as Requests from "../models/requests";
import BaseFluxxorComponent from "./BaseFluxxorComponent";

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

export default class ForgotComponent extends BaseFluxxorComponent<ForgotProps, ForgotState> {
    getWatchers() { return ['auth']; }

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

    onSubmit = (ev: any) => {
        ev.preventDefault();
        if (this.validate()) {
            this.getFlux().actions.account.resetPassword(new Requests.PasswordReset(this.props.token, this.state.password));
        }
    };

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
            return <div className="alert alert-danger">{this.state.auth.error}</div>;
        }

        return null;
    }

    render() {
        return <div className="row">
            <div className="col-md-6 col-md-offset-3">
                <h3 className="text-center">Reset your Password</h3>
                <br />
                {this.renderErrors()}

                {this.state.auth.resetPasswordResult.success ?
                    <div>
                        <div className="alert alert-success">
                            Your password has been reset. Click
                            <a href="/login">here</a> to login
                        </div>
                    </div> :
                    <form onSubmit={this.onSubmit}>
                        <div className={"form-group " + (this.state.errors["password"] ? 'has-error' : '')} key="2">
                            <label className="control-label" htmlFor="password">Password:</label>
                            <input className="form-control" id="password" name="password" type="password" value={this.state.password}
                                   onChange={this.handleTextChange.bind(this, "password")} />
                            {this.state.errors["password"] ? <span className="help-block">{this.state.errors["password"]}</span> : null}
                        </div>
                        <div className={"form-group " + (this.state.errors["confirm"] ? 'has-error' : '')} key="2">
                            <label className="control-label" htmlFor="confirm">Confirm Password:</label>
                            <input className="form-control" id="confirm" name="confirm" type="password" value={this.state.confirm}
                                   onChange={this.handleTextChange.bind(this, "confirm")} />
                            {this.state.errors["confirm"] ? <span className="help-block">{this.state.errors["confirm"]}</span> : null}
                        </div>
                        <div className="text-center"><button className="btn btn-primary" type="submit">Reset Password</button></div>
                    </form>
                }
            </div>
        </div>;
    }
}

//export var Component = TypedReact.createClass(ForgotComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);