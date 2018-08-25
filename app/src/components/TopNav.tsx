import { observer } from "mobx-react";
import * as React from "react";
import { BaseProps } from "../types";
import { observable, reaction, action } from "mobx";
import classnames from "classnames";
import { GoSearch } from "react-icons/go";
import { Routes } from "../stores/route.store";

@observer
export class TopNav extends React.Component<BaseProps> {
  @observable
  query: string = "";

  handleLogout = (ev: any) => {
    ev.preventDefault();
    this.props.store.authStore.logout();
  };

  handleSearch = (ev: any) => {
    ev.preventDefault();

    if (this.query && !this.props.store.searchStore.searching) {
      this.props.store.routeStore.search(this.query, 0);
    }
  };

  @action.bound
  updateQueryText(query: string) {
    this.query = query;
  }

  handleSearchKeyDown = (ev: any) => {
    if ((ev.keyCode == 10 || ev.keyCode == 13) && ev.ctrlKey) {
      this.handleSearch(ev);
    }
  };

  render() {
    const searchBtnClasses = classnames("btn", "btn-primary", {
      disabled: this.props.store.searchStore.searching
    });
    const isLoggedIn = this.props.store.authStore.isLoggedIn;

    return (
      <nav className="navbar navbar-expand-sm navbar-light bg-light">
        <a className="navbar-brand" href="/journal">
          My Daily Stuff
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbar"
          aria-controls="navbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbar">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              {this.props.store.authStore.isLoggedIn ? (
                <form
                  className="form-inline my-2 my-lg-0"
                  role="search"
                  onSubmit={this.handleSearch}
                >
                  <div className="input-group">
                    <input
                      className="form-control"
                      type="search"
                      placeholder="Search"
                      value={this.query}
                      onChange={e => this.updateQueryText(e.target.value)}
                      onKeyDown={this.handleSearchKeyDown}
                    />
                    <div className="input-group-append">
                      <button type="submit" className={searchBtnClasses}>
                        <GoSearch />
                      </button>
                    </div>
                  </div>
                </form>
              ) : null}
            </li>
          </ul>

          <ul className="nav navbar-nav">
            {isLoggedIn ? (
              <li className="dropdown">
                <a
                  className="btn btn-link nav-link dropdown-toggle"
                  data-toggle="dropdown"
                  role="button"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {this.props.store.authStore.email}
                  <span className="caret" />
                </a>
                <div className="dropdown-menu dropdown-menu-right" role="menu">
                  <a className="dropdown-item" href="/profile">
                    My Profile
                  </a>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={this.handleLogout}
                  >
                    Logout
                  </a>
                </div>
              </li>
            ) : (
              [
                <li className="nav-item" key="Login">
                  <a className="nav-link" href="/login">
                    Login
                  </a>
                </li>,
                <li className="nav-item" key="Register">
                  <a className="nav-link" href="/register">
                    Register
                  </a>
                </li>
              ]
            )}
          </ul>
        </div>
      </nav>
    );
  }
}
