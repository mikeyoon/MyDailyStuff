import * as React from "react";
import { action, observable } from "mobx";
import classNames from "classnames";

import * as Requests from "../models/requests";
import { BaseProps } from "../types";
import { observer } from "mobx-react";

interface SignupProps {
  flux: any;
}

interface SignupState {
  auth?: any;
  email?: string;
  password?: string;
  confirm?: string;
  errors?: any;
}

var emailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;

@observer
export class SignupComponent extends React.Component<BaseProps> {
  @observable
  errors: { [field: string]: string } = {};
  @observable
  email = "";
  @observable
  password = "";
  @observable
  confirm = "";

  isValid(): boolean {
    return Object.keys(this.errors).length <= 0;
  }

  @action.bound
  onSubmit(ev: any) {
    ev.preventDefault();
    if (this.validate()) {
      if (this.confirm == this.password) {
        this.props.store.authStore.register(
          new Requests.Register(this.email, this.password)
        );
      }
    }
  }

  emailChanged(email: string) {
    this.email = email;
  }

  passwordChanged(password: string) {
    this.password = password;
  }

  confirmChanged(password: string) {
    this.confirm = password;
  }

  validate(): boolean {
    if (this.confirm != this.password) {
      this.errors["password"] = "passwords do not match";
      this.errors["confirm"] = "passwords do not match";
    } else if (!this.password || this.password.length < 6) {
      this.errors["password"] = "Password needs to be 6 or more characters";
    } else if (this.password && this.password.length > 50) {
      this.errors["password"] = "Password needs to be less than 50 characters";
    }

    if (!emailRegex.test(this.email)) {
      this.errors["email"] = "Email is invalid";
    }

    return this.isValid();
  }

  renderSignupError() {
    if (this.props.store.authStore.registerError) {
      return (
        <div className="alert alert-danger">
          {this.props.store.authStore.registerError}
        </div>
      );
    }

    return null;
  }

  render() {
    return (
      <div className="row">
        <div className="col-lg-6 offset-lg-3 col-md-8 offset-md-2 col-sm-12">
          <h3 className="text-center">Register for an account</h3>
          <br />
          {this.renderSignupError()}
          {this.props.store.authStore.registered ? (
            <div>
              <div className="alert alert-success">
                Verification email sent to {this.email}. Please check your email
                for directions to complete your signup.
              </div>
              <p>
                Click <a href="/login">here</a> to return to the login page
              </p>
            </div>
          ) : (
            <form onSubmit={this.onSubmit.bind(this)}>
              <div className="form-group" key="1">
                <label className="control-label" htmlFor="email">
                  Email:
                </label>
                <input
                  className={classNames("form-control", {
                    "is-invalid": this.errors["email"]
                  })}
                  id="email"
                  name="email"
                  value={this.email}
                  onChange={e => this.emailChanged(e.target.value)}
                />
                <span className="invalid-feedback">{this.errors["email"]}</span>
              </div>
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
              <div className="form-group" key="3">
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
                  Register
                </button>
                <span className="margin-small">or</span>
                <a href="/login">Login with an existing account</a>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
}
