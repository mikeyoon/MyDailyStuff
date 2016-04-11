import Fluxxor = require('fluxxor');
import page = require('page');
import actions = require('../actions');
import Requests = require('../models/requests');

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