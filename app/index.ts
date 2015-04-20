/// <reference path='./typings/react/react.d.ts' />
/// <reference path='./node_modules/typed-react/typed-react.d.ts' />

import React = require('react/addons');
import TypedReact = require('typed-react');

export interface AppProps {

}

interface AppState {

}

class App extends TypedReact.Component<{}, {}> {
    render() {
        return React.DOM.div(null, "Hello World");
    }
}

var app = new App();

TypedReact.createClass(App)
React.render(, document.getElementById('content-body'));