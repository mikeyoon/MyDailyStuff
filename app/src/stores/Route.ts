import { observable, when } from 'mobx';
import page from 'page';
import actions from '../actions';
import * as Requests from '../models/requests';

export enum Routes {
    Journal,
    Login,
    Home,
    Register,
    Profile,
    ForgotPassword
}

export class RouteStore {
    @observable route: string;

    constructor() {
        this.route = '';
        page.start();
        
    }

    search(req: Requests.Search) {
        page('/search/' + req.query + "?offset=" + req.offset);
    }

    updateRoute(route: string) {
        this.route = route;
    }
}
