/// <reference path='../typings/react/react.d.ts' />
/// <reference path='../node_modules/typed-react/typed-react.d.ts' />
/// <reference path='../typings/react-router/react-router.d.ts' />

import React = require('react');
import TypedReact = require('typed-react');
import Router = require('react-router');


//var Route = React.createFactory(Router.Route);
//var DefaultRoute = React.createFactory(Router.DefaultRoute);
//var NotFoundRoute = React.createFactory(Router.NotFoundRoute);

class App extends TypedReact.Component<{}, {}> {
    render() {
        return React.DOM.div(null, "Hello World 2");
    }
}

var app = TypedReact.createClass(App);
var Route = TypedReact.createClass(Router);

var routeElement = React.createElement(Router, {location: "history"},
    Route({path: "/", handler: App}));

//var routes = Router.Route()

React.render(routeElement, document.getElementById('content-body'));