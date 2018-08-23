import * as React  from 'react';

import { BaseProps } from '../types';

export class AboutComponent extends React.Component<BaseProps> {

    render() {
        return <div className="row">
            <div className="col-lg-8 offset-lg-2 col-md-8 offset-md-2 col-sm-12">
                <h2 className="page-header">About</h2>
                <p key="about">
                    MyDailyStuff is designed as a simplified tool for journaling your daily activities. The
                    basic premise is that by keeping track of three things you do each day, you can have more
                    interesting conversations with others. It was inspired by {" "}
                    <a href="http://www.reddit.com/r/LifeProTips/comments/2chg5w/lpt_be_more_exciting_to_peoplefriendsdates_and/">this</a>
                    {" "} reddit thread.
                </p>
                <h3>Development</h3>
                <p key="dev">
                    I wrote this application to learn Go and Typescript. All the source code is
                    available at github (link in the left side of the footer). It is powered on the
                    backend using ElasticSearch and Martini. The frontend is React and Mobx with the stereotypical
                    bootstrap styling. The Go backend has a fairly comprehensive set of automated tests.
                </p>
            </div>
        </div>
    }
}