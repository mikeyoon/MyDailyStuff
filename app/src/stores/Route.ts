import Fluxxor = require('fluxxor');
import page = require('page');

var RouteStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            actions.constants.ROUTE.HOME, this.onGet
        );


    }
});