import * as React from 'react';
import { observer } from 'mobx-react';
import 'bootstrap';
import { BaseProps } from "../types";

@observer
export class StreakComponent extends React.Component<BaseProps> {
    componentDidMount() {
        this.props.store.authStore.getStreak();
        // $('[data-toggle="tooltip"]').tooltip();
    }

    render() {
        let streak = this.props.store.authStore.streak != null ? this.props.store.authStore.streak : 0;

        return <span data-toggle="tooltip" data-placement="left" title="Number of contiguous entries over the last ten days">
            Streak {" "}
            <span className="badge">
                {streak} {" "}
                {streak >= 10 ? <span className="glyphicon glyphicon-star" /> : null}
            </span>
        </span>
    }
}
