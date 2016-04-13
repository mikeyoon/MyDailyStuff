import * as React from 'react';
import {StoreWatchMixin, FluxMixin} from 'fluxxor';
import {assign, bindAll} from 'lodash';

interface BaseState {
    flux: Fluxxor.Flux
}

abstract class BaseFluxxorComponent<P extends BaseState,S> extends React.Component<P,S>{
    constructor(props: P) {
        super(props);

        assign(this, StoreWatchMixin.apply(this, this.getWatchers()));
        bindAll(this);

        delete (this as any).getInitialState; // Fluxxor is so outdated :(
        this.state = this.getStateFromFlux();
    }

    getFlux() { return this.props.flux; }

    state: S;


    abstract getWatchers(): Array<string>;
    abstract getStateFromFlux(): S;
}

export default BaseFluxxorComponent;