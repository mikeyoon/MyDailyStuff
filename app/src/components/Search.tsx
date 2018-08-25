import * as React from "react";
import moment from "moment";
import classNames from "classnames";
import { BaseProps } from "../types";
import { observer } from "mobx-react";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";

@observer
export class SearchComponent extends React.Component<BaseProps> {
  componentWillUnmount() {
    this.props.store.searchStore.clear();
  }

  handlePageLink(offset: number, ev: React.MouseEvent) {
    if (offset == null) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  render() {
    return (
      <div className="row">
        {this.props.store.searchStore.query ? (
          <div className="col-md-10 offset-md-1">
            <h4>
              {this.props.store.searchStore.total} results for "
              {this.props.store.searchStore.query}"
            </h4>
            <div>
              {this.props.store.searchStore.searchResults.map(
                (result, index) => {
                  return (
                    <div className="card panel-default" key={index}>
                      <div className="card-body">
                        {index + 1 + this.props.store.searchStore.offset}.{" "}
                        <a
                          href={
                            "/journal/" +
                            moment(result.date)
                              .utc()
                              .format("YYYY-M-D")
                          }
                        >
                          {moment(result.date)
                            .utc()
                            .format("dddd, MMMM Do YYYY")}
                        </a>
                      </div>
                      <ul className="list-group">
                        {result.entries.map((entry, ii) => (
                          <li
                            className="list-group-item"
                            key={ii}
                            dangerouslySetInnerHTML={{ __html: entry }}
                          />
                        ))}
                      </ul>
                    </div>
                  );
                }
              )}
            </div>
            <ul className="pager">
              <li className="previous">
                <a
                  href={`/search/${this.props.store.searchStore.query}/${
                    this.props.store.searchStore.prevOffset
                  }`}
                  className={classNames("btn", "btn-link", {
                    disabled: this.props.store.searchStore.prevOffset == null
                  })}
                  onClick={this.handlePageLink.bind(
                    this,
                    this.props.store.searchStore.prevOffset
                  )}
                  rel={
                    this.props.store.searchStore.prevOffset === null
                      ? "external"
                      : undefined
                  }
                >
                  <GoChevronLeft /> prev
                </a>
              </li>
              <li className="next">
                <a
                  className={classNames("btn", "btn-link", {
                    disabled: this.props.store.searchStore.nextOffset == null
                  })}
                  href={`/search/${this.props.store.searchStore.query}/${
                    this.props.store.searchStore.nextOffset
                  }`}
                  onClick={this.handlePageLink.bind(
                    this,
                    this.props.store.searchStore.nextOffset
                  )}
                  rel={
                    this.props.store.searchStore.nextOffset === null
                      ? "external"
                      : undefined
                  }
                >
                  next <GoChevronRight />
                </a>
              </li>
            </ul>
          </div>
        ) : (
          <div className="col-md-8 col-md-offset-2">
            <div className="mt-4">
              <div className="progress">
                <div
                  className="progress-bar progress-bar-striped active"
                  role="progressbar"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
