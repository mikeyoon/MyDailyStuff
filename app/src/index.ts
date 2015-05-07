/// <reference path='../node_modules/typed-react/typed-react.d.ts' />
/// <reference path='../typings/tsd.d.ts' />
/// <reference path='./components/Login.ts' />

import React = require('react');
import TypedReact = require('typed-react');
import page = require('page');
import AuthStore = require('./stores/Auth');
import JournalStore = require('./stores/Journal');
import Fluxxor = require('fluxxor');
import actions = require('./actions');

import Login = require('./components/Login');
import Signup = require('./components/Signup');
import Journal = require('./components/Journal');

class App extends TypedReact.Component<{}, {}> {
    render() {
        return React.DOM.div(null, "Hello World 2");
    }
}

var app = TypedReact.createClass(App);

var stores = {
    auth: new AuthStore(),
    journal: new JournalStore()
};

var flux = new Fluxxor.Flux(stores, actions.methods);
//flux.on("dispatch", function(type: string, payload: any) {
//    console.log("Dispatch:", type, payload);
//});

page('/', () => {
    //Check if logged in, if not, route to /login
    //If logged in, route to journal/today's date
    var routeElement = React.createElement(app, { flux: flux });
    React.render(routeElement, document.getElementById('content-body'));
});

page('/register', () => {
    var routeElement = React.createElement(Signup.Component, { flux: flux });
    React.render(routeElement, document.getElementById('content-body'));
});

page('/login', () => {
    var routeElement = React.createElement(Login.Component, { flux: flux });
    React.render(routeElement, document.getElementById('content-body'));
});

page('/account', () => {
    console.log('account');
});

page('/journal/:date', (ctx) => {
    var routeElement = React.createElement(Journal.Component, { flux: flux, date: new Date(ctx.params.date) });
    React.render(routeElement, document.getElementById('content-body'));
});

page();
