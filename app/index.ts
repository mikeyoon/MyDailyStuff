/// <reference path='./typings/react/react.d.ts' />
/// <reference path='./node_modules/typed-react/typed-react.d.ts' />

import React = require('react');
import TypedReact = require('typed-react');

export interface AppProps {

}

interface AppState {

}

class App extends TypedReact.Component<{}, {}> {
    render() {
        return React.DOM.div(null, "Hello World 2");
    }
}

var app = TypedReact.createClass(App);

React.render(React.createElement(app, null), document.getElementById('content-body'));