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
            d('div.ui.text.container', {}, d(this.props.component, this.props.componentOptions)),
            d('footer.footer', {},
                d('div.ui.container', {}, [
                    d('div.ui.grid', {}, [
                        d('div.four.column.row', {}, [
                            d('div.left.floated.column', {}, [
                                "Created by ",
                                d('a[href=https://github.com/mikeyoon/]', "Mike Yoon"),
                            ]),
                            d('div.right.floated.column.right.aligned', {}, [
                                d('a[href=/about].pull-right', "About")
                            ])
                        ])
                    ])
                ])
            )
        ]);
    }
}

export var Component = TypedReact.createClass(AppComponent, [Fluxxor.FluxMixin(React)]);