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
    offset: number;
}

interface SearchState {
    total?: number;
    nextOffset?: number;
    prevOffset?: number;
    offset?: number;
    query?: string;
    results?: Responses.QuerySearchResult[];
}

export class SearchComponent extends TypedReact.Component<SearchProps, SearchState>
implements Fluxxor.FluxMixin, Fluxxor.StoreWatchMixin<{}> {

    getFlux: () => Fluxxor.Flux;

    getStateFromFlux() {
        var store = this.getFlux().store("search");

        return {
            results: store.searchResults,
            total: store.total,
            nextOffset: store.nextOffset,
            prevOffset: store.prevOffset,
            offset: store.offset,
            query: store.query,
        };
    }

    componentWillReceiveProps(nextProps: SearchProps) {
        this.getFlux().actions.search.query(nextProps.query, nextProps.offset);
    }

    componentWillMount() {
        this.getFlux().actions.search.query(this.props.query, this.props.offset);
    }

    handlePageLink(offset: number, ev: any) {
        if (offset == null) {
            ev.preventDefault();
            ev.stopPropagation();
        }
    }

    render() {
        return d('div.row', {}, [
            d('div.col-md-8.col-md-offset-2', {}, [
                d('h4', this.state.total + " results for \"" + this.state.query + "\""),
                d('div', {},
                    this.state.results.map((result, index) => {
                        return d('div.panel.panel-default', { key: index }, [
                            d('div.panel-body', {}, [
                                (index + 1 + this.state.offset) + '. ',
                                d('a[href=/journal/' + moment(result.date).utc().format('YYYY-M-D') + ']',
                                    moment(result.date).utc().format('dddd, MMMM Do YYYY'))
                            ]),
                            d('ul.list-group', {}, result.entries.map((entry, ii) => {
                                return d('li.list-group-item', { key: ii, dangerouslySetInnerHTML: { __html: entry } });
                            }))
                        ]);
                    })
                )
            ]),
            d('nav.col-md-3.col-md-offset-2', {}, d('ul.pager', {}, [
                d('li.previous' + (this.state.prevOffset == null ? '.disabled' : ''), {},
                    d("a", { href: `/search/${this.props.query}?offset=${this.state.prevOffset}`,
                        onClick: this.handlePageLink.bind(this, this.state.prevOffset),
                        rel: this.state.prevOffset == null ? "external" : null,
                    }, [d('span.glyphicon.glyphicon-chevron-left'), " prev"])),
                d('li.next' + (this.state.nextOffset == null ? '.disabled' : ''), {},
                    d("a", { href: `/search/${this.props.query}?offset=${this.state.nextOffset}`,
                        onClick: this.handlePageLink.bind(this, this.state.nextOffset),
                        rel: this.state.nextOffset == null ? "external" : null,
                    }, ["next ", d('span.glyphicon.glyphicon-chevron-right')]))
            ]))
        ]);
    }
}

export var Component = TypedReact.createClass(SearchComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("search")]);