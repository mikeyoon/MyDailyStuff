import { observer } from 'mobx-react';
import * as React from 'react';
import { BaseProps } from '../types';
import { observable, action } from 'mobx';
import classnames from 'classnames';
import { Search } from '../models/requests';

@observer
export class TopNav extends React.Component<BaseProps> {
    @observable query: string = '';

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
        const searchBtnClasses = classnames('btn', 'btn-primary', { disabled: this.props.store.searchStore.searching });
        const isLoggedIn = this.props.store.authStore.isLoggedIn;

        return <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <a className="navbar-brand" href="/journal">My Daily Stuff</a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse justify-content-end" id="navbar">
                {this.props.store.authStore.isLoggedIn ?
                <form className="navbar-form navbar-left" role="search" onSubmit={this.handleSearch}>
                    <div className="input-group">
                        <input className="form-control" type="search" placeholder="Search"
                                onChange={e => this.updateQueryText(e.target.value)}
                                onKeyDown={this.handleSearchKeyDown}/>
                        <div className="input-group-btn">
                            <button type="submit"
                                    className={searchBtnClasses}>
                                <i className="glyphicon glyphicon-search"/>
                            </button>
                        </div>
                    </div>
                </form> 
                : null }

                <ul className="nav navbar-nav navbar-right">
                    {isLoggedIn ?
                    <li className="dropdown">
                        <a className="dropdown-toggle" data-toggle="dropdown" role="button">
                            {this.props.store.authStore.email}
                            <span className="caret"/>
                        </a>
                        <ul className="dropdown-menu" role="menu">
                            <li key="1"><a href="/profile">My Profile</a></li>
                            <li key="2"><a href="#" onClick={this.handleLogout}>Logout</a></li>
                        </ul>
                    </li> :
                    <li key="Login"><a href="/login">Login</a></li>}
                    {isLoggedIn ? null : <li key="Register"><a href="/register">Register</a></li>}
                </ul>
            </div>
        </nav>
    }
}
