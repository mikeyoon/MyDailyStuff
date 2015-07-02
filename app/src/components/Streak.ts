/**
 * Created by myoon on 6/15/2015.
 */
import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import Responses = require("../models/responses");
import TypedReact = require('typed-react');

var d = jsnox(React);
declare var $: any;

export interface StreakProps {
    flux: any;
    update: boolean;
}

export interface StreakState {
    streak?: number;
}

export class StreakComponent extends TypedReact.Component<StreakProps, StreakState>
    implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux(): StreakState {
        var auth = this.getFlux().store("auth");

        return {
            streak: auth.streak,
        };
    }

    componentWillReceiveProps(nextProps: StreakProps) {
        if (nextProps.update) {
            this.getFlux().actions.account.getStreak(true);
        }
    }

    componentWillMount() {
        this.getFlux().actions.account.getStreak(false);
    }

    componentDidMount() {
        $('[data-toggle="tooltip"]').tooltip();
    }

    render() {
        return d('span[data-toggle=tooltip][data-placement=left][title=Number of contiguous entries over the last ten days]', {}, [
            "Streak ",
            d("span.badge", {}, [
                this.state.streak,
                " ",
                this.state.streak >= 10 ? d("span.glyphicon.glyphicon-star") : null
            ])
        ])
    }
}

export var Component = TypedReact.createClass(StreakComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("auth")]);