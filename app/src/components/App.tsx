import * as React from 'react';
import TopNav from '../components/TopNav';
import {assign} from 'lodash';
(React as any).__spread = assign;

interface AppProps {
    flux: Fluxxor.Flux;
    component: React.ComponentClass<{}>;
    componentOptions: any;
}

export default class AppComponent extends React.Component<AppProps, {}> {

    render() {
        let Component = this.props.component;

        return <div>
            <TopNav flux={this.props.flux} />
            <div className="container">
                <Component {...this.props.componentOptions} />
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