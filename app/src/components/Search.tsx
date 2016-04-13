/// <reference path='../../typings/browser.d.ts' />

import * as Fluxxor from 'fluxxor';
import * as React from 'react';
import * as Responses from "../models/responses";
import * as moment from 'moment';
import BaseFluxxorComponent from "./BaseFluxxorComponent";

interface SearchProps {
    query: string;
    offset: number;
    flux: Fluxxor.Flux;
}

interface SearchState {
    total?: number;
    nextOffset?: number;
    prevOffset?: number;
    offset?: number;
    query?: string;
    results?: Responses.QuerySearchResult[];
}

export default class SearchComponent extends BaseFluxxorComponent<SearchProps, SearchState> {
    getWatchers() { return ['search']; }

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
        return <div className="row">
            {this.state.query ? <div className="col-md-8 col-md-offset-2">
                <h4>{this.state.total} results for "{this.state.query}"</h4>
                <div>
                    {this.state.results.map((result, index) => {
                        return <div className="panel panel-default" key={index}>
                            <div className="panel-body">
                                {index + 1 + this.state.offset}.
                                <a href={"/journal/" + moment(result.date).utc().format('YYYY-M-D')}>
                                    {moment(result.date).utc().format('dddd, MMMM Do YYYY')}
                                </a>
                            </div>
                            <ul className="list-group">
                                {result.entries.map((entry, ii) => <li className="list-group-item" key={ii} dangerouslySetInnerHTML={{__html: entry}} />)}
                            </ul>
                        </div>
                        })
                    }
                </div>
                <ul className="pager">
                    <li className={"previous " + (this.state.prevOffset == null ? 'disabled' : '')}>
                        <a href={`/search/${this.state.query}?offset=${this.state.prevOffset}`}
                           onClick={this.handlePageLink.bind(this, this.state.prevOffset)}
                           rel={this.state.prevOffset === null ? "external" : null}>
                            <span className="glyphicon glyphicon-chevron-left" /> prev
                        </a>
                    </li>
                    <li className={"next " + (this.state.nextOffset == null ? 'disabled' : '')}>
                        <a href={`/search/${this.state.query}?offset=${this.state.nextOffset}`}
                           onClick={this.handlePageLink.bind(this, this.state.nextOffset)}
                           rel={this.state.nextOffset === null ? "external" : null}>
                            next <span className="glyphicon glyphicon-chevron-right" />
                        </a>
                    </li>
                </ul>
            </div> :
            <div className="col-md-8 col-md-offset-2">
                <div className="margin-top-md">
                    <div className="progress">
                        <div className="progress-bar progress-bar-striped active" role="progressbar" style={{width: "100%"}}></div>
                    </div>
                </div>
            </div>
            }
        </div>
    }
}
