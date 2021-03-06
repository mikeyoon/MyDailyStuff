import * as React from "react";
import { observer } from "mobx-react";

import { BaseProps } from "../types";
import { TopNav } from "./TopNav";
import { Routes } from "../stores/route.store";
import { AboutComponent } from "./About";
import { ForgotComponent } from "./Forgot";
import { JournalComponent } from "./Journal";
import { LoginComponent } from "./Login";
import { ProfileComponent } from "./Profile";
import { ResetComponent } from "./ResetPassword";
import { SearchComponent } from "./Search";
import { SignupComponent } from "./Signup";

@observer
export class AppComponent extends React.Component<BaseProps> {
  renderComponent() {
    switch (this.props.store.routeStore.route) {
      case Routes.About:
        return <AboutComponent store={this.props.store} />;
      case Routes.ForgotPassword:
        return <ForgotComponent store={this.props.store} />;
      case Routes.Journal:
        return <JournalComponent store={this.props.store} />;
      case Routes.Login:
        return <LoginComponent store={this.props.store} />;
      case Routes.Register:
        return <SignupComponent store={this.props.store} />;
      case Routes.Search:
        return <SearchComponent store={this.props.store} />;
      case Routes.Profile:
        return <ProfileComponent store={this.props.store} />;
      case Routes.ResetPassword:
        return <ResetComponent store={this.props.store} />;
    }
  }

  render() {
    return (
      <div>
        <TopNav store={this.props.store} />
        <div className="container mt-4 mb-4">{this.renderComponent()}</div>
        <footer className="footer container-fluid">
          <div className="row align-items-center h-100">
            <div className="col-8">
              <span className="text-muted">
                Created by <a href="https://github.com/mikeyoon/">Mike Yoon</a>
              </span>
            </div>
            <div className="col-4 text-right">
              <a href="/about" className="float-right">
                About
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}
