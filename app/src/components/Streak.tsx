import * as React from 'react';
import 'bootstrap';
import { BaseProps } from "../types";

export default class StreakComponent extends React.Component<BaseProps> {
    getWatchers() { return ['auth']; }

    componentDidMount() {
        this.props.store.authStore.getStreak();
        // $('[data-toggle="tooltip"]').tooltip();
    }

    render() {
        return <span data-toggle="tooltip" data-placement="left" title="Number of contiguous entries over the last ten days">
            Streak {" "}
            <span className="badge">
                {this.props.store.authStore.streak} {" "}
                {this.props.store.authStore.streak >= 10 ? <span className="glyphicon glyphicon-star" /> : null}
            </span>
        </span>
    }
}
