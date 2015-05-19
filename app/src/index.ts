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
import moment = require('moment');

import Login = require('./components/Login');
import Signup = require('./components/Signup');
import Journal = require('./components/Journal');
import Forgot = require('./components/Forgot');
import Reset = require('./components/ResetPassword');
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
    if (!stores.auth.isLoggedIn) {
        page('/login');
    } else {
        //Check if logged in, if not, route to /login
        //If logged in, route to journal/today's date
        renderApp(Journal.Component, {flux: flux, date: new Date()});
    }
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

page('/forgot-password', () => {
    renderApp(Forgot.Component, { flux: flux });
});

page('/account/reset/:token', (ctx) => {
    //console.log(ctx.params.token);
    renderApp(Reset.Component, { flux: flux, token: ctx.params.token });
});

page('/account/verify/:token', (ctx) => {
    //console.log(ctx.params.token);
    flux.actions.account.verify(ctx.params.token);
});

page('/journal', (ctx) => {
    if (!stores.auth.isLoggedIn) {
        page('/login');
    } else {
        var date = new Date();
        date.setHours(0,0,0,0);
        renderApp(Journal.Component, { flux: flux, date: date });
    }
});

page('/journal/:date', (ctx) => {
    if (!stores.auth.isLoggedIn) {
        page('/login');
    } else {
        renderApp(Journal.Component, {flux: flux, date: moment(ctx.params.date, 'YYYY-M-D').toDate() });
    }
});

//page.exit((ctx, next) => {
//    console.log(ctx);
//    next();
//});

if (stores.auth.isLoggedIn != null) {
    page();
} else {
    stores.auth.once('change', () => {
        page();
    });
}
