
import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import {
  Tabs, Tab
}                             from 'react-bootstrap';

import '../short.css';

export class TopTabs extends Component {
  static propTypes = {

  }

  render() {
    return (
      <div>
        <Tabs id="top-tabs">
          <Tab eventKey={1} title="Scratch">
            A tab
          </Tab>
        </Tabs>
      </div>
    )
  }
}

export default TopTabs;



