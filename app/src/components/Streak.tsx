/**
 * Created by myoon on 6/15/2015.
 */
import React = require('react');
import Requests = require("../models/requests");
import Responses = require("../models/responses");

declare var $: any;

export interface StreakProps {
    flux: any;
    update: boolean;
}

export interface StreakState {
    streak?: number;
}

export default class StreakComponent extends React.Component<StreakProps, StreakState> {

    //getFlux: () => Fluxxor.Flux;

    // getStateFromFlux(): StreakState {
    //     var auth = this.getFlux().store("auth");
    //
    //     return {
    //         streak: auth.streak,
    //     };
    // }

    componentWillReceiveProps(nextProps: StreakProps) {
        // if (nextProps.update) {
        //     this.getFlux().actions.account.getStreak(true);
        // }
    }

    componentWillMount() {
        //this.getFlux().actions.account.getStreak(false);
    }

    componentDidMount() {
        $('[data-toggle="tooltip"]').tooltip();
    }

    render() {
        return <span data-toggle="tooltip" data-placement="left" title="Number of contiguous entries over the last ten days">
            Streak
            <span className="badge">
                {this.state.streak}
                {this.state.streak >= 10 ? <span className="glyphicon glyphicon-star" /> : null}
            </span>
        </span>
    }
}

//export var Component = TypedReact.createClass(StreakComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);