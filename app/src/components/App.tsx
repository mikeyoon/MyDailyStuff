import * as React from 'react';

import { BaseProps } from '../types';
import { TopNav } from './TopNav';
import { Routes } from '../stores/route.store';
// import { JournalComponent } from './Journal';
import { LoginComponent } from './Login';

export class AppComponent extends React.Component<BaseProps, {}> {
    renderComponent() {
        switch (this.props.store.routeStore.route) {
            // case Routes.Journal:
            //     return <JournalComponent store={this.props.store} />;
            case Routes.Login:
                return <LoginComponent store={this.props.store} />;
        }
    }

    render() {
        return <div>
            <TopNav store={this.props.store} />
            <div className="container">
                {this.renderComponent()}
            </div>
            <footer className="footer container-fluid">
                <div className="row align-items-center h-100">
                    <div className="col-6">
                        <span className="text-muted">
                            Created by {" "}
                            <a href="https://github.com/mikeyoon/">Mike Yoon</a>
                        </span>
                    </div>
                    <div className="col-6 text-right">
                        <a href="/about" className="pull-right">About</a>
                    </div>
                </div>
            </footer>
        </div>
    }
}
