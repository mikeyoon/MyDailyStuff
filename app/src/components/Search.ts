import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import Requests = require("../models/requests");
import Responses = require("../models/responses");
import TypedReact = require('typed-react');
import actions = require('../actions');
import moment = require('moment');

var d = jsnox(React);

interface SearchProps {
    query: string;
}

interface SearchState {
    start?: number;
    end?: number;
    results?: Responses.QuerySearchResult[];
}

export class SearchComponent extends TypedReact.Component<SearchProps, SearchState>
implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux() {
        return {
            results: this.getFlux().store("search").searchResults
        };
    }

    componentWillReceiveProps(nextProps: SearchProps) {
        this.getFlux().actions.search.query(nextProps.query);
    }

    componentWillMount() {
        this.getFlux().actions.search.query(this.props.query);
    }

    render() {
        return d('div.row', {}, [
            d('div.col-md-8.col-md-offset-2', {}, [
                d('h4', this.state.results.length + " results for \"" + this.props.query + "\""),
                d('div', {},
                    this.state.results.map((result, index) => {
                        return d('div.panel.panel-default', { key: index }, [
                            d('div.panel-body', {}, [
                                (index + 1) + '. ',
                                d('a[href=/journal/' + moment(result.date).utc().format('YYYY-M-D') + ']',
                                    moment(result.date).utc().format('dddd, MMMM Do YYYY'))
                            ]),
                            d('ul.list-group', {}, result.entries.map((entry, ii) => {
                                return d('li.list-group-item', entry, { key: ii });
                            }))
                        ]);
                    })
                )
            ])
        ]);


    }
}

export var Component = TypedReact.createClass(SearchComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("search")]);