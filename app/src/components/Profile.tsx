import * as React from "react";
import classNames from 'classnames';
import { observable, when } from "mobx";
import { observer } from "mobx-react";

import * as Requests from "../models/requests";
import { BaseProps } from "../types";

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
  @observable
  errors: { [field: string]: string } = {};
  @observable
  password = "";
  @observable
  confirm = "";
  @observable
  updateSuccess = false;

  isValid(): boolean {
    return !this.errors;
  }

  onSubmit(ev: any) {
    ev.preventDefault();
    if (this.validate()) {
      if (this.confirm == this.password) {
        this.props.store.authStore.updateProfile(this.password);
        when(
          () => !this.props.store.authStore.saving,
          () => {
            this.updateSuccess = this.props.store.authStore.saved;
            this.password = "";
            this.confirm = "";
          }
        );
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
    this.errors = {};

    if (this.confirm != this.password) {
      this.errors["password"] = "passwords do not match";
      this.errors["confirm"] = "passwords do not match";
    } else if (!this.password || this.password.length < 6) {
      this.errors["password"] = "Password needs to be 6 or more characters";
    } else if (this.password && this.password.length > 50) {
      this.errors["password"] = "Password needs to be less than 50 characters";
    }

    return !Object.keys(this.errors).length;
  }

  renderProfileError() {
    if (this.props.store.authStore.saveError) {
      return (
        <div className="alert alert-danger">
          {this.props.store.authStore.saveError}
        </div>
      );
    }

    return null;
  }

  render() {
    return (
      <div className="row mt-4">
        <div className="col-lg-6 offset-lg-3 col-md-8 offset-md-2 col-sm-12">
          <h3 className="text-center">Update Your Profile</h3>
          <br />
          {this.renderProfileError()}
          {this.updateSuccess ? (
            <div className="alert alert-success">
              Profile Updated Successfully
            </div>
          ) : null}

          <form
            onSubmit={this.onSubmit.bind(this)}
            className="needs-validation"
          >
            <div className="form-group" key="1">
              <label className="control-label" htmlFor="email">
                Email:
              </label>
              <input
                className="form-control"
                id="email"
                name="email"
                defaultValue={this.props.store.authStore.email}
                disabled={true}
              />
            </div>
            <div className="form-group" key="2">
              <label className="control-label" htmlFor="password">
                Password:
              </label>
              <input
                className={classNames("form-control", { "is-invalid": this.errors["password"]})}
                id="password"
                name="password"
                type="password"
                value={this.password}
                onChange={e => this.passwordChanged(e.target.value)}
              />
              {this.errors["password"] ? (
                <span className="invalid-feedback">
                  {this.errors["password"]}
                </span>
              ) : null}
            </div>

            <div
              className="form-group"
              key="3"
            >
              <label className="control-label" htmlFor="password">
                Confirm Password:
              </label>
              <input
                className={classNames("form-control", { "is-invalid": this.errors["confirm"]})}
                id="confirm"
                name="confirm"
                type="password"
                value={this.confirm}
                onChange={e => this.confirmChanged(e.target.value)}
              />
              {this.errors["confirm"] ? (
                <span className="invalid-feedback">{this.errors["confirm"]}</span>
              ) : null}
            </div>
            <div className="text-center">
              <button className="btn btn-primary" type="submit">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
