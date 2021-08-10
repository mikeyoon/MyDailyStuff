import * as React from 'react';
import { render } from 'react-dom';

import { AppComponent } from './components/App';
import { RootStore } from './stores/root.store';

import "bootstrap/dist/css/bootstrap.css";

const store = new RootStore();
const root = document.getElementById('content-root');

render(
    <AppComponent store={store} />,
    root
);
