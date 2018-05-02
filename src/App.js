import React, { Component } from 'react';
import {
  Nav, Navbar, NavItem, Grid
}                             from 'react-bootstrap';
import {
  ItemList
}                             from './Components/ItemList';

import { TopTabs } from './Components/TopTabsComponent';

import getSessionData       from './Drivers/GetSessionData';

// TODO: remove this
import telemetryStore       from './Stores/TelemetryStore';

import './short.css'
import './App.css';

class App extends Component {


  render() {

    // const sessions = Array.prototype.slice.apply(telemetryStore.data.sessions);
    // const sessions = Array.prototype.slice.apply(telemetryStore.data.sessions);

    const currentSessionId  = ((this.state) && this.state.currentSessionId) || '';

    return (
      <div className="App">
        <Navbar inverse fluid fixedTop>

          {/* Header and Brand */}
          <Navbar.Header>
            <Navbar.Brand>
              <a href="/">Netlab Telemetry Viewer</a>

            </Navbar.Brand>
            <ItemList itemType="clients"  itemKeyName="clientId" />
            <ItemList itemType="sessions" itemKeyName="sessionId" />

            <Navbar.Text pullRight>
              {`${currentSessionId}`}
            </Navbar.Text>

          </Navbar.Header>

          <Navbar.Collapse>
            <Nav pullRight>
              <NavItem eventKey={1} href="/foobar">Foo Bar</NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        {/* Main Content Area */}
        <div>
          <Grid fluid={true}>
            <TopTabs>
            </TopTabs>

          </Grid>
        </div>

      </div>
    );
  }

  componentDidMount() {
    telemetryStore.addChangeListener(this._onChange.bind(this));
    
    getSessionData();
  }

  _onChange() {
    const itemType  = this.props.itemType           || '';
    const storeList = telemetryStore.data[itemType] || {};

    const items = Array.prototype.slice.apply(storeList);

    const currentSessionId = telemetryStore.data.currentSessionId;

    this.setState({items, currentSessionId});
  }

}

export default App;
