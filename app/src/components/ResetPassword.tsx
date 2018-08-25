import * as React from "react";
import classNames from "classnames";
import { observable } from "mobx";
import { observer } from "mobx-react";

import * as Requests from "../models/requests";
import { BaseProps } from "../types";

@observer
export class ResetComponent extends React.Component<BaseProps> {
  @observable
  password = "";
  @observable
  confirm = "";
  @observable
  errors: { [field: string]: string } = {};

  isValid(): boolean {
    return Object.keys(this.errors).length <= 0;
  }

  onSubmit = (ev: any) => {
    ev.preventDefault();
    if (this.validate()) {
      this.props.store.authStore.resetPassword(
        new Requests.PasswordReset(
          this.props.store.routeStore.params.token,
          this.password
        )
      );
    }
  };

  handleTextChange(name: string, ev: any) {
    var state: any = {};
    state[name] = ev.target.value;
    this.setState(state);
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

  renderErrors() {
    if (this.props.store.authStore.resetError) {
      return (
        <div className="alert alert-danger">
          {this.props.store.authStore.resetError}
        </div>
      );
    }

    return null;
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-6 col-md-offset-3">
          <h3 className="text-center">Reset your Password</h3>
          <br />
          {this.renderErrors()}

          {this.props.store.authStore.resetSuccess ? (
            <div>
              <div className="alert alert-success">
                Your password has been reset. Click
                <a href="/login">here</a> to login
              </div>
            </div>
          ) : (
            <form onSubmit={this.onSubmit}>
              <div className="form-group" key="2">
                <label className="control-label" htmlFor="password">
                  Password:
                </label>
                <input
                  className={classNames("form-control", {
                    "is-invalid": this.errors["password"]
                  })}
                  id="password"
                  name="password"
                  type="password"
                  value={this.password}
                  onChange={e => this.passwordChanged(e.target.value)}
                />
                <span className="invalid-feedback">
                  {this.errors["password"]}
                </span>
              </div>
              <div
                className="form-group"
                key="2"
              >
                <label className="control-label" htmlFor="confirm">
                  Confirm Password:
                </label>
                <input
                  className={classNames("form-control", {
                    "is-invalid": this.errors["confirm"]
                  })}
                  id="confirm"
                  name="confirm"
                  type="password"
                  value={this.confirm}
                  onChange={e => this.confirmChanged(e.target.value)}
                />
                <span className="invalid-feedback">
                  {this.errors["confirm"]}
                </span>
              </div>
              <div className="text-center">
                <button className="btn btn-primary" type="submit">
                  Reset Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
}
