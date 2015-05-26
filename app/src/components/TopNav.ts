import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');
import actions = require('../actions');

var d = jsnox(React);

interface TopNavState {
    isLoggedIn: boolean;
    query?: string;
    email?: string;
}

export class TopNavComponent extends TypedReact.Component<{}, TopNavState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux() {
        var store = this.getFlux().store("auth");

        return {
            isLoggedIn: store.isLoggedIn,
            email: store.user ? store.user.email : null
        };
    }

    handleLogout(ev: any) {
        ev.preventDefault();
        this.getFlux().actions.account.logout();
    }

    handleSearch(ev: any) {
        ev.preventDefault();
        if (this.state.query) this.getFlux().actions.routes.search(this.state.query);
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
        return d('nav.navbar.navbar-default', {},
            d('div.container', {}, [
                d('div.navbar-header', {}, [
                    d('button.navbar-toggle.collapsed[type=button][data-toggle=collapse][data-target=#navbar]', {}, [
                        d('span.sr-only', 'Toggle Navigation'),
                        d('span.icon-bar', { key: 1 }),
                        d('span.icon-bar', { key: 2 }),
                        d('span.icon-bar', { key: 3 })
                    ]),
                    d('a.navbar-brand[href=/]', 'My Daily Stuff')
                ]),

                d('div.collapse.navbar-collapse.navbar-ex1-collapse#navbar', {}, [
                    this.state.isLoggedIn ? d('form.navbar-form.navbar-left[role=search]', { onSubmit: this.handleSearch }, [
                        d('div.input-group', [
                            d('input.form-control[type=search][placeholder=Search]', {
                                onChange: this.handleTextChange.bind(this, "query"),
                                onKeyDown: this.handleSearchKeyDown
                            }),
                            d('div.input-group-btn', {}, d('button[type=submit].btn.btn-primary', {}, d('i.glyphicon.glyphicon-search')))
                        ]),

                    ]) : null,

                    d('ul.nav.navbar-nav.navbar-right', {}, [
                        this.state.isLoggedIn ? d('li.dropdown', {}, [
                            d('a.dropdown-toggle[data-toggle=dropdown][role=button]', {}, [
                                this.state.email,
                                d('span.caret')
                            ]),
                            d('ul.dropdown-menu[role=menu]', {}, [
                                d('li', { key: 1 }, d('a[href=/profile]', "My Profile")),
                                d('li', { key: 2 }, d('a[href=#]', { onClick: this.handleLogout }, "Logout")),
                            ])
                        ]) : d('li', { key: 'Login' }, d('a[href=/login]', "Login")),

                        this.state.isLoggedIn ? null : d('li', { key: 'Register' }, d('a[href=/register]', "Register"))
                    ])
                ])
            ])
        )
    }
}

export var Component = TypedReact.createClass(TopNavComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);