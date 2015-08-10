import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');
import actions = require('../actions');

var d = jsnox(React);
declare var $: any;

interface TopNavState {
    isLoggedIn: boolean;
    query?: string;
    email?: string;
    searching?: boolean;
}

export class TopNavComponent extends TypedReact.Component<{}, TopNavState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux() {
        var store = this.getFlux().store("auth");
        var search = this.getFlux().store("search");

        return {
            isLoggedIn: store.isLoggedIn,
            email: store.user ? store.user.email : null,
            searching: search.searching,
        };
    }

    componentDidMount() {
        $('.ui.dropdown').dropdown();
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
        return d('div.ui.grid', {}, [
            d('div.row', {}, [
                d('div.ui.inverted.fixed.menu.navbar.page.grid', {}, [
                    d('a.brand.item[href=/journal]', 'My Daily Stuff'),
                    this.state.isLoggedIn ? d('div.item', {}, [
                        d('div.ui.transparent.icon.input.inverted', {}, [
                            d('input[type=text][placeholder=Search...][autoComplete=off]'),
                            d('i.search.link.icon')
                        ])
                    ]) : null,
                    d('div.right.menu', {}, [
                        this.state.isLoggedIn ? d('div.ui.dropdown.item', {}, [
                            this.state.email,
                            d('i.dropdown.icon'),
                            d('div.menu', {}, [
                                d('a.item[href=/profile]', { key: 1 }, "My Profile"),
                                d('a.item[href=#]', { key: 2, onClick: this.handleLogout }, "Logout")
                            ])
                        ]) : d('a.item[href=/login]', "Login"),
                        this.state.isLoggedIn ? null : d('a.item[href=/register]', "Register")
                    ])

                ])
            ])
        ]
            //d('div.container', {}, [
            //    d('div.navbar-header', {}, [
            //        d('button.navbar-toggle.collapsed[type=button][data-toggle=collapse][data-target=#navbar]', {}, [
            //            d('span.sr-only', 'Toggle Navigation'),
            //            d('span.icon-bar', { key: 1 }),
            //            d('span.icon-bar', { key: 2 }),
            //            d('span.icon-bar', { key: 3 })
            //        ]),
            //        d('a.navbar-brand[href=/journal]', 'My Daily Stuff')
            //    ]),
            //
            //    d('div.collapse.navbar-collapse.navbar-ex1-collapse#navbar', {}, [
            //        this.state.isLoggedIn ? d('form.navbar-form.navbar-left[role=search]', { onSubmit: this.handleSearch }, [
            //            d('div.input-group', [
            //                d('input.form-control[type=search][placeholder=Search]', {
            //                    onChange: this.handleTextChange.bind(this, "query"),
            //                    onKeyDown: this.handleSearchKeyDown
            //                }),
            //                d('div.input-group-btn', {},
            //                    d('button[type=submit].btn.btn-primary' + (this.state.searching ? '.disabled' : ''), {},
            //                        d('i.glyphicon.glyphicon-search')))
            //            ]),
            //
            //        ]) : null,
            //
            //        d('ul.nav.navbar-nav.navbar-right', {}, [
            //            this.state.isLoggedIn ? d('li.dropdown', {}, [
            //                d('a.dropdown-toggle[data-toggle=dropdown][role=button]', {}, [
            //                    this.state.email,
            //                    d('span.caret')
            //                ]),
            //                d('ul.dropdown-menu[role=menu]', {}, [
            //                    d('li', { key: 1 }, d('a[href=/profile]', "My Profile")),
            //                    d('li', { key: 2 }, d('a[href=#]', { onClick: this.handleLogout }, "Logout")),
            //                ])
            //            ]) : d('li', { key: 'Login' }, d('a[href=/login]', "Login")),
            //
            //            this.state.isLoggedIn ? null : d('li', { key: 'Register' }, d('a[href=/register]', "Register"))
            //        ])
            //    ])
            //])
        )
    }
}

export var Component = TypedReact.createClass(TopNavComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth", "search")]);