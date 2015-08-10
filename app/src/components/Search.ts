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

    componentWillUnmount() {
        this.getFlux().actions.search.clear();
    }

    handlePageLink(offset: number, ev: any) {
        if (offset == null) {
            ev.preventDefault();
            ev.stopPropagation();
        }
    }

    render() {
        return d('div.row', {}, [
            this.state.query ? d('div', {}, [
                d('h4', this.state.total + " results for \"" + this.state.query + "\""),
                d('div', {},
                    this.state.results.map((result, index) => {
                        return d('div.ui.segments', { key: moment(result.date).utc().format('YYYY-M-D') }, [
                            d('div.ui.segment.secondary', { key: 'header'}, [
                                (index + 1 + this.state.offset) + '. ',
                                d('a[href=/journal/' + moment(result.date).utc().format('YYYY-M-D') + ']',
                                    moment(result.date).utc().format('dddd, MMMM Do YYYY'))
                            ]),
                            d('div.ui.segment', { key: 'result' }, [
                                d('ul.ui.list', {}, result.entries.map((entry, ii) => {
                                    return d('li.item', { key: ii, dangerouslySetInnerHTML: { __html: entry } });
                                }))
                            ])
                        ]);
                    })
                ),
                d('div.ui.horizontal.list', {}, [
                    d("a.ui.item.middle.aligned"  + (this.state.prevOffset == null ? '.disabled' : ''),
                        {
                            key: 'prev',
                            href: `/search/${this.state.query}?offset=${this.state.prevOffset}`,
                            onClick: this.handlePageLink.bind(this, this.state.prevOffset),
                            rel: this.state.prevOffset == null ? "external" : null,
                        },
                        [d('i.angle.left.icon.middle.aligned.content'), d('span.middle.aligned', " prev")]
                    ),
                    //d('div.item' + (this.state.prevOffset == null ? '.disabled' : ''), { key: 'previous' },

                    d("a.ui.item.middle.aligned"  + (this.state.nextOffset == null ? '.disabled' : ''),
                        {
                            key: 'next',
                            href: `/search/${this.state.query}?offset=${this.state.nextOffset}`,
                            onClick: this.handlePageLink.bind(this, this.state.nextOffset),
                            rel: this.state.nextOffset == null ? "external" : null,
                        },
                        [d('span.middle.aligned', "next "), d('i.angle.right.icon.middle.aligned.content')]
                    )
                    //d('div.item' + (this.state.nextOffset == null ? '.disabled' : ''), { key: 'next' },

                ])
            ]) :
            d('div', {},
                d('div.margin-top-md', {},
                    d('div.progress', {},
                        d('div.progress-bar.progress-bar-striped.active[role=progressbar]', { style: { width: "100%" }})
                    )
                )
            )
        ]);
    }
}

export var Component = TypedReact.createClass(SearchComponent, [Fluxxor.FluxMixin(React), Fluxxor.StoreWatchMixin("search")]);