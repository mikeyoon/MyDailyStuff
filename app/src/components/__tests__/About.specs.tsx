import About from '../About';
import * as TestUtils from 'react-addons-test-utils';
import * as ReactDOM from 'react-dom';
import * as React from 'react';

jest.unmock('../About');

describe('About', () => {
    it('displays header', () => {
        const about = TestUtils.renderIntoDocument(<About />);

        const node = ReactDOM.findDOMNode(about.refs.header);
        expect(node.textContent).toEqual('About');
    });
});