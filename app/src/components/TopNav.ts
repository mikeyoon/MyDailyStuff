import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');
import AuthStore = require('../stores/Auth');
import actions = require('../actions');

var d = jsnox(React);

interface TopNavState {
    isLoggedIn: boolean;
}

export class TopNavComponent extends TypedReact.Component<{}, TopNavState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux() {
        return {
            isLoggedIn: this.getFlux().store("auth").isLoggedIn
        };
    }

    handleLogout() {
        this.getFlux().actions.account.logout();
    }

    render() {
        return d('nav.navbar.navbar-default', {},
            d('div.container-fluid', {}, [
                d('div.navbar-header', {}, [
                    d('button.navbar-toggle.collapsed[type=button][data-toggle=collapse]', {}, [
                        d('span.sr-only', 'Toggle Navigation'),
                        d('span.icon-bar', { key: 1 }),
                        d('span.icon-bar', { key: 2 }),
                        d('span.icon-bar', { key: 3 })
                    ]),
                    d('a.navbar-brand[href=/]', 'My Daily Three')
                ]),

                d('div.collapse.navbar-collapse', {}, [
                    d('ul.nav.navbar-nav.navbar-right', {}, [
                        this.state.isLoggedIn ? d('li', {},
                            d('a[href=#]', { onClick: this.handleLogout }, "Logout")) :
                            d('li', {}, d('a[href=/login]', "Login"))
                    ])
                ])
            ])
        )
    }
}

export var Component = TypedReact.createClass(TopNavComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);