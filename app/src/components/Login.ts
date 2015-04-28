import React = require('react');
import Fluxxor = require('fluxxor');

var Login = React.createClass({
    mixins: [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")],

    getStateFromFlux: function() {
        return {
            auth: this.getFlux().store("auth")
        };
    },

    render: function() {
        return React.DOM.div(null, "Login!");
    }
});

export = Login;