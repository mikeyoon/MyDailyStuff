import { observable, action } from 'mobx';
import page from 'page';
import * as Requests from '../models/requests';
import { AuthStore } from './auth.store';

export enum Routes {
    Journal = 'journal',
    Login = 'login',
    Home = 'home',
    Register = 'register',
    Profile = 'profile',
    ForgotPassword = 'forgot',
    Search = 'search'
}

export class RouteStore {
    @observable route: Routes;
    @observable params: { [name: string]: string };

    constructor(private authStore: AuthStore) {
        this.route = Routes.Search;
        this.params = {};

        page('/', () => this.setDefaultRoute());
        page('/login', () => this.setLoginRoute());
        page('/journal', ctx => this.setJournalRoute(ctx));
        page('/journal/:date', ctx => this.setJournalRoute(ctx));
        page('/search/:query', ctx => this.setSearchRoute(ctx));
        page('/forgot-password', () => this.setForgotRoute());
        page.start();
    }

    @action
    setDefaultRoute() {
        if (this.authStore.isLoggedIn) {
            page.show('/journal');
        } else {
            page.show('/login');
        }
    }

    @action
    setLoginRoute() {
        if (this.authStore.isLoggedIn) {
            page.show('/journal');
        } else {
            this.route = Routes.Login;
            this.params = {};
        }
    }

    @action
    setForgotRoute() {
        this.route = Routes.ForgotPassword;
        this.params = {};
    }

    @action
    setSearchRoute(ctx: PageJS.Context) {
        this.route = Routes.Search;
        this.params = ctx.params;
    }

    @action
    setJournalRoute(ctx: PageJS.Context) {
        this.route = Routes.Journal;
        this.params = ctx.params;
    }

    search(req: Requests.Search) {
        page('/search/' + req.query + "?offset=" + req.offset);
    }
}
