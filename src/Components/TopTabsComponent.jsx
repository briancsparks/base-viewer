
import React                  from 'react';
import Reflux                 from 'reflux';
import RawTelemetryStore      from '../Stores/RawTelemetryStore';

import {
  Tabs, Tab
}                             from 'react-bootstrap';
import {
  IpAcrossTimeComponent
}                             from './IpAcrossTimeComponent';

import '../short.css';

export class TopTabs extends Reflux.Component {

  constructor(props) {
    super(props);
    this.store = RawTelemetryStore;
  }

  render() {
    return (
      <div>
        <Tabs id="top-tabs">
          <Tab eventKey={1} title="Scratch">
            A tab

            <IpAcrossTimeComponent></IpAcrossTimeComponent>
          </Tab>
        </Tabs>
      </div>
    )
  }
}

export default TopTabs;



