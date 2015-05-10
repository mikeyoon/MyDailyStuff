/// <reference path='../node_modules/typed-react/typed-react.d.ts' />
/// <reference path='../typings/tsd.d.ts' />
/// <reference path='./components/Login.ts' />

import React = require('react');
import TypedReact = require('typed-react');
import page = require('page');
import AuthStore = require('./stores/Auth');
import JournalStore = require('./stores/Journal');
//import RouteStore = require('./stores/Route');
import Fluxxor = require('fluxxor');
import actions = require('./actions');
import jsnox = require('jsnox');

import Login = require('./components/Login');
import Signup = require('./components/Signup');
import Journal = require('./components/Journal');
import App = require('./components/App');

var stores = {
    auth: new AuthStore(),
    journal: new JournalStore()
};

var flux = new Fluxxor.Flux(stores, actions.methods);
//flux.on("dispatch", function(type: string, payload: any) {
//    console.log("Dispatch:", type, payload);
//});

function renderApp(component: React.ComponentClass<{}>, options: any) {
    var routeElement = React.createElement(App.Component, { flux: flux, component: component, componentOptions: options });
    React.render(routeElement, document.getElementById('content-root'));
}

page('/', () => {
    //Check if logged in, if not, route to /login
    //If logged in, route to journal/today's date
    renderApp(Journal.Component, { flux: flux, date: new Date() });
});

page('/register', () => {
    renderApp(Signup.Component, { flux: flux });
});

page('/login', () => {
    renderApp(Login.Component, { flux: flux });
});

page('/account', () => {
    console.log('account');
});

page('/journal', (ctx) => {
    renderApp(Journal.Component, { flux: flux, date: new Date() });
});

page('/journal/:date', (ctx) => {
    renderApp(Journal.Component, { flux: flux, date: new Date(ctx.params.date) });
});

page();
