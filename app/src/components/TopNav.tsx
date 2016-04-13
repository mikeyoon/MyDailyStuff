import * as Fluxxor from 'fluxxor';
import * as React from 'react';
import BaseFluxxorComponent from "./BaseFluxxorComponent";

interface TopNavProps {
    flux: Fluxxor.Flux;
}

interface TopNavState {
    isLoggedIn: boolean;
    query?: string;
    email?: string;
    searching?: boolean;
}

export default class TopNavComponent extends BaseFluxxorComponent<TopNavProps, TopNavState> {
    getWatchers() { return ['auth', 'search'] };

    getStateFromFlux() {
        var store = this.getFlux().store("auth");
        var search = this.getFlux().store("search");

        return {
            isLoggedIn: store.isLoggedIn,
            email: store.user ? store.user.email : null,
            searching: search.searching,
        };
    }

    handleLogout(ev: any) {
        ev.preventDefault();
        this.getFlux().actions.account.logout();
    }

    handleSearch(ev: any) {
        ev.preventDefault();
        if (this.state.query && !this.state.searching) this.getFlux().actions.routes.search(this.state.query, 0);
    }

    handleTextChange(name:string, ev:any) {
        var state:any = {};
        state[name] = ev.target.value;
        this.setState(state);
    }

    handleSearchKeyDown(ev: any) {
        if ((ev.keyCode == 10 || ev.keyCode == 13) && ev.ctrlKey) {
            this.handleSearch(ev);
        }
    }

    render() {
        return <nav className="navbar navbar-default">
            <div className="container">
                <div className="navbar-header">
                    <button className="navbar-toggle collapsed" data="" data-toggle="collapse" data-target="#navbar">
                        <span className="sr-only">Toggle Navigation</span>
                        <span className="icon-bar" key="1"/>
                        <span className="icon-bar" key="2"/>
                        <span className="icon-bar" key="3"/>
                    </button>
                    <a className="navbar-brand" href="/journal">My Daily Stuff</a>
                </div>

                <div className="collapse navbar-collapse navbar-ex1-collapse" id="navbar">
                    {this.state.isLoggedIn ?
                    <form className="navbar-form navbar-left" role="search" onSubmit={this.handleSearch}>
                        <div className="input-group">
                            <input className="form-control" type="search" placeholder="Search"
                                   onChange={this.handleTextChange.bind(this, "query")}
                                   onKeyDown={this.handleSearchKeyDown}/>
                            <div className="input-group-btn">
                                <button type="submit"
                                        className={"btn btn-primary " + this.state.searching ? 'disabled' : ''}>
                                    <i className="glyphicon glyphicon-search"/>
                                </button>
                            </div>
                        </div>
                    </form>: null
                        }

                    <ul className="nav navbar-nav navbar-right">
                        {this.state.isLoggedIn ?
                        <li className="dropdown">
                            <a className="dropdown-toggle" data-toggle="dropdown" role="button">
                                {this.state.email}
                                <span className="caret"/>
                            </a>
                            <ul className="dropdown-menu" role="menu">
                                <li key="1"><a href="/profile">My Profile</a></li>
                                <li key="2"><a href="#" onClick={this.handleLogout}>Logout</a></li>
                            </ul>
                        </li> :
                        <li key="Login"><a href="/login">Login</a></li>}
                        {this.state.isLoggedIn ? null : <li key="Register"><a href="/register">Register</a></li>}
                    </ul>
                </div>
            </div>
        </nav>
    }
}
