import * as React from 'react';
import { render } from 'react-dom';

import { AppComponent } from './components/App';
import { RootStore } from './stores/root.store';

const store = new RootStore();
const root = document.getElementById('content-root');

render(
    <AppComponent store={store} />,
    root
);

//var flux = new Fluxxor.Flux(stores, actions.methods);
//flux.on("dispatch", function(type: string, payload: any) {
//    console.log("Dispatch:", type, payload);
//});

// function renderApp(component: React.ComponentClass<{}>, options: any) {
//     const routeElement = React.createElement(App, { flux: flux, component: component, componentOptions: options });
//     const root = document.getElementById('content-root');
//     if (root != null) {
//         DOM.render(routeElement, root);
//     }
// }

// page('/', () => {
//     if (!stores.auth.isLoggedIn) {
//         page('/login');
//     } else {
//         //Check if logged in, if not, route to /login
//         //If logged in, route to journal/today's date
//         renderApp(Journal, {flux: flux, date: new Date()});
//     }
// });

// page('/register', () => {
//     if (!stores.auth.isLoggedIn) {
//         renderApp(Signup, {flux: flux});
//     } else {
//         page('/login');
//     }
// });

// page('/login', () => {
//     if (!stores.auth.isLoggedIn) {
//         renderApp(Login, { flux: flux });
//     } else {
//         page('/journal');
//     }
// });

// page('/profile', () => {
//     if (stores.auth.isLoggedIn) {
//         renderApp(Profile, {flux: flux});
//     } else {
//         page('/login');
//     }
// });

// page('/forgot-password', () => {
//     renderApp(Forgot, { flux: flux });
// });

// page('/account/reset/:token', (ctx) => {
//     //console.log(ctx.params.token);
//     renderApp(Reset, { flux: flux, token: ctx.params.token });
// });

// page('/account/verify/:token', (ctx) => {
//     //console.log(ctx.params.token);
//     flux.actions.account.verify(ctx.params.token);
// });

// page('/search/:query', (ctx) => {
//     if (!stores.auth.isLoggedIn) {
//         page('/login');
//     } else {
//         var regex = /offset=([0-9]+)/i.exec(ctx.querystring);
//         var offset = regex ? parseInt(regex[1]) : 0;

//         renderApp(Search, { flux: flux, query: ctx.params.query, offset: offset });
//     }
// });

// page('/journal', (ctx) => {
//     if (!stores.auth.isLoggedIn) {
//         page('/login');
//     } else {
//         var date = new Date();
//         date.setHours(0,0,0,0);
//         renderApp(Journal, { flux: flux, date: date });
//     }
// });

// page('/journal/:date', (ctx) => {
//     if (!stores.auth.isLoggedIn) {
//         page('/login');
//     } else {
//         renderApp(Journal, {flux: flux, date: moment(ctx.params.date, 'YYYY-M-D').toDate() });
//     }
// });

// page('/about', () => {
//     renderApp(About, {});
// });

//page.exit((ctx, next) => {
//    console.log(ctx);
//    next();
//});

// if (stores.auth.isLoggedIn != null) {
//     page();
// } else {
//     stores.auth.once('change', () => {
//         page();
//     });
// }
