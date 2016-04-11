/**
 * Created by myoon on 4/10/2016.
 */

import { combineReducers } from 'redux';
import AuthStore from './Auth';
import JournalStore from './Journal';
import SearchStore from './SearchJournalStore';
import RouteStore from './Route';
import AnalyticsStore from './Analytics';

export interface MDSApp {
    auth:
    journal: new JournalStore(),
    search: new SearchStore(),
    route: new RouteStore(),
    analytics: new AnalyticsStore()
}

export const app = combineReducers<MDSApp>