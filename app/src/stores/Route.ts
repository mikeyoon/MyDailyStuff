import Fluxxor = require('fluxxor');
import * as page from 'page';
import actions from '../actions';
import * as Requests from '../models/requests';

var RouteStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            //actions.constants.ROUTE.HOME, this.onGet,
            actions.constants.ROUTE.SEARCH, this.onSearch
        );
    },

    onSearch: function(req: Requests.Search) {
        page('/search/' + req.query + "?offset=" + req.offset);
    }
});

export default RouteStore;