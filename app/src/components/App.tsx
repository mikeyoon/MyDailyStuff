import React = require('react');
import Requests = require("../models/requests");

import TopNav from '../components/TopNav';

interface AppProps {
    flux: Fluxxor.Flux;
    component: React.ComponentClass<{}>;
    componentOptions: {};
}

export default class AppComponent extends React.Component<AppProps, {}> {

    //getFlux: () => Fluxxor.Flux;

    render() {
        return <div>
            <TopNav />
            <div className="container">
                <this.props.component {...this.props.componentOptions} />
            </div>
            <footer className="footer">
                <div className="container">
                    <p className="text-muted">
                        Created by
                        <a href="https://github.com/mikeyoon/">Mike Yoon</a>
                        <a href="/about" className="pull-right">About</a>
                    </p>
                </div>
            </footer>
        </div>
    }
}

//export var Component = TypedReact.createClass(AppComponent, [Fluxxor.FluxMixin(React)]);