/// <reference path='../node_modules/typed-react/typed-react.d.ts' />
/// <reference path='../typings/tsd.d.ts' />

import React = require('react');
import TypedReact = require('typed-react');
import page = require('page');
import AuthStore = require('./stores/Auth');
import Fluxxor = require('fluxxor');
import actions = require('./actions');

import LoginComponent = require('./components/Login');

class App extends TypedReact.Component<{}, {}> {
    render() {
        return React.DOM.div(null, "Hello World 2");
    }
}

var app = TypedReact.createClass(App);

var stores = {
    auth: new AuthStore()
};

var flux = new Fluxxor.Flux(stores, actions.methods);
flux.on("dispatch", function(type: string, payload: any) {
    console.log("Dispatch:", type, payload);
});

page('/', () => {
    //Check if logged in, if not, route to /login
    //If logged in, route to journal/today's date
    var routeElement = React.createElement(app, { flux: flux });
    React.render(routeElement, document.getElementById('content-body'));
});

page('/register', () => {
    console.log('register');
});

page('/login', () => {
    var routeElement = React.createElement(LoginComponent, { flux: flux });
    React.render(routeElement, document.getElementById('content-body'));
});

page('/account', () => {
    console.log('account');
});

page('/journal/:date', (ctx) => {
    console.log(ctx.params.date);
});

page();
