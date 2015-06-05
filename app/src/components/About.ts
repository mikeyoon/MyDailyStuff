/**
 * Created by myoon on 6/4/2015.
 */

import React = require('react');
import Fluxxor = require('fluxxor');
import jsnox = require('jsnox');
import TypedReact = require('typed-react');

var d = jsnox(React);

export class AboutComponent extends TypedReact.Component<{}, {}> {

    render() {
        return d('div.row', {}, [
            d('div.col-md-8.col-md-offset-2', [
                d('h1.page-header', 'About'),

                d('div', { key: 'about' }, [
                    'MyDailyStuff is designed as a simplified tool for journaling your daily activities. The ' +
                    'basic premise is that by keeping track of three things you do each day, you can have more ' +
                    'interesting conversations with others. It was inspired by ',
                    d('a[href=http://www.reddit.com/r/LifeProTips/comments/2chg5w/lpt_be_more_exciting_to_peoplefriendsdates_and/]', "this"),
                    ' reddit thread.'
                ]),

                d('h3', 'Development'),
                d('div', { key: 'dev' }, 'I wrote this application to learn Go and Typescript. All the source code is ' +
                    'available at github (link in the left side of the footer). It is powered on the ' +
                    'backend using ElasticSearch and Martini. The frontend is React and Fluxxor with the stereotypical ' +
                    'bootstrap styling. The Go backend has a fairly comprehensive set of automated tests.')
            ])
        ]);
    }
}

export var Component = TypedReact.createClass(AboutComponent);