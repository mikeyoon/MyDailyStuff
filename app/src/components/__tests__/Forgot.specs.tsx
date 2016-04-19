import Forgot from '../Forgot';
import * as TestUtils from 'react-addons-test-utils';
import * as ReactDOM from 'react-dom';
import * as React from 'react';

jest.unmock('../Forgot');

describe('Forgot Component', () => {
    it('initial load', () => {
        const forgot = TestUtils.renderIntoDocument(<Forgot />);

        const node = ReactDOM.findDOMNode(forgot.refs.form);
        expect(node.textContent).toEqual('About');
    });

    it('after successful submit', () => {
        
    });
});