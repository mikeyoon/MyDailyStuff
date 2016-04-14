import * as React from 'react';
import {StoreWatchMixin, FluxMixin} from 'fluxxor';
import {assign, bindAll} from 'lodash';

interface BaseState {
    flux: Fluxxor.Flux
}

const storeMixin = StoreWatchMixin as any;

abstract class BaseFluxxorComponent<P extends BaseState,S> extends React.Component<P,S> {
    constructor(props: P) {
        super(props);

        let mixin = StoreWatchMixin.apply(this, this.getWatchers());
        this.__patch('componentDidMount', mixin);
        this.__patch('componentWillUnmount', mixin);
        this.__patch('getInitialState', mixin);

        delete (this as any).getInitialState; // Fluxxor is so outdated :(
        this.state = this.getStateFromFlux();
    }

    __patch(name: string, mixin: any) {
        if ((this as any)[name]) {
            let fn = (this as any)[name] as Function;
            (this as any)[name] = function() {
                mixin[name].apply(this, arguments);
                fn.apply(this, arguments);
            }
        } else {
            (this as any)[name] = mixin[name];
        }
    }

    getFlux() { return this.props.flux; }

    state: S;


    abstract getWatchers(): Array<string>;
    abstract getStateFromFlux(): S;
}

export default BaseFluxxorComponent;