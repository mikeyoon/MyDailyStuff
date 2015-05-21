import Fluxxor = require('fluxxor');
import page = require('page');
import actions = require('../actions');

var RouteStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            //actions.constants.ROUTE.HOME, this.onGet,
            actions.constants.ROUTE.SEARCH, this.onSearch
        );
    },

    onSearch: function(query: string) {
        page('/search/' + query);
    }
});

export = RouteStore;