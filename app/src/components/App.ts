import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import TypedReact = require('typed-react');

import TopNav = require('../components/TopNav');

var d = jsnox(React);

interface AppProps {
    flux: Fluxxor.Flux;
    component: React.ComponentClass<{}>;
    componentOptions: {};
}

export class AppComponent extends TypedReact.Component<AppProps, {}>
    implements Fluxxor.FluxMixin {

    getFlux: () => Fluxxor.Flux;

    render() {
        return d('div', [
            d(TopNav.Component),
            d('div.container', {}, d(this.props.component, this.props.componentOptions)),
            d('footer.footer', {},
                d('div.container', {}, [
                    d('p.text-muted', {}, [
                        "Created by ",
                        d('a[href=https://github.com/mikeyoon/]', "Mike Yoon"),
                        d('a[href=/about].pull-right', "About")
                    ]),
                ])
            )
        ]);
    }
}

export var Component = TypedReact.createClass(AppComponent, [Fluxxor.FluxMixin(React)]);