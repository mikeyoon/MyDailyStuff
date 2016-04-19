/**
 * Created by mike on 4/18/16.
 */

jest.unmock('../About');

import About from '../About';
import TestUtils = require('react-addons-test-utils');
import * as ReactDOM from 'react-dom';
import * as React from 'react';

describe('About', () => {
  it('displays', () => {
    const about = TestUtils.renderIntoDocument(
      <About></About>
    );

    const node = ReactDOM.findDOMNode(about);
    console.log(node.textContent);
  });
});